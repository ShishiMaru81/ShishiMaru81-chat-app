import { config as loadEnv } from "dotenv";
import Redis from "ioredis";
import mongoose from "mongoose";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as outboxModule from "../../packages/services/outbox.service";
import * as intelligenceModule from "../../packages/services/task-intelligence.service";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const visitedEnvPaths = new Set<string>();
let scanDir = currentDir;

for (let depth = 0; depth < 8; depth += 1) {
    const envCandidates = [
        path.join(scanDir, ".env.local"),
        path.join(scanDir, ".env"),
    ];

    for (const envPath of envCandidates) {
        if (!visitedEnvPaths.has(envPath) && existsSync(envPath)) {
            loadEnv({ path: envPath });
            visitedEnvPaths.add(envPath);
        }
    }

    const parent = path.dirname(scanDir);
    if (parent === scanDir) {
        break;
    }
    scanDir = parent;
}

const WORKER_ID = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;
const BATCH_SIZE = Number(process.env.TASK_WORKER_BATCH_SIZE || 10);
const POLL_INTERVAL_MS = Number(process.env.TASK_WORKER_POLL_MS || 800);

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
const redis = redisUrl
    ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: null })
    : null;

const internalBaseUrl = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const INTERNAL_SECRET_HEADER = "x-internal-secret";

const outboxApi = ((outboxModule as unknown as { default?: unknown }).default || outboxModule) as {
    claimOutboxEvents?: (workerId: string, limit?: number) => Promise<Array<{
        _id: { toString(): string };
        topic: string;
        dedupeKey: string;
        payload: Record<string, unknown>;
        attempts: number;
    }>>;
    markOutboxEventCompleted?: (id: string) => Promise<void>;
    markOutboxEventFailed?: (id: string, errorMessage: string, retryDelayMs?: number) => Promise<void>;
};

const processMessageTaskIntelligence = (
    (intelligenceModule as unknown as { default?: unknown }).default
    || intelligenceModule
) as {
    processMessageTaskIntelligence?: (input: {
        messageId: string;
        conversationId: string;
        senderId: string;
        content: string;
        messageType: string;
    }) => Promise<{
        semanticPayload: {
            conversationId: string;
        };
        taskCreatedPayload?: unknown;
        taskUpdatedPayload?: unknown;
        taskLinkedPayload?: unknown;
    } | null>;
};

type MessageCreatedPayload = {
    messageId: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: string;
};

function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function isMessageCreatedPayload(payload: Record<string, unknown>): payload is MessageCreatedPayload {
    return (
        typeof payload.messageId === "string"
        && typeof payload.conversationId === "string"
        && typeof payload.senderId === "string"
        && typeof payload.content === "string"
        && typeof payload.messageType === "string"
    );
}

async function emitInternal(path: string, conversationId: string, payload: unknown) {
    const internalSecret = process.env.INTERNAL_SECRET || "";
    await fetch(`${internalBaseUrl}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(internalSecret
                ? {
                    [INTERNAL_SECRET_HEADER]: internalSecret,
                }
                : {}),
        },
        body: JSON.stringify({
            conversationId,
            payload,
        }),
    });
}

function computeRetryDelay(attempts: number) {
    const base = 1000;
    const capped = Math.min(attempts, 8);
    return base * (2 ** capped);
}

function getOutboxFns() {
    const claim = outboxApi.claimOutboxEvents;
    const complete = outboxApi.markOutboxEventCompleted;
    const fail = outboxApi.markOutboxEventFailed;

    if (typeof claim !== "function" || typeof complete !== "function" || typeof fail !== "function") {
        throw new Error(`Outbox module exports are invalid. keys=${Object.keys(outboxModule).join(",")}`);
    }

    return { claim, complete, fail };
}

function getIntelligenceFn() {
    const fn = processMessageTaskIntelligence.processMessageTaskIntelligence;
    if (typeof fn !== "function") {
        throw new Error(`Task intelligence module exports are invalid. keys=${Object.keys(intelligenceModule).join(",")}`);
    }
    return fn;
}

async function ensureDatabaseConnection() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
    });
}

async function processOneEvent(event: {
    _id: { toString(): string };
    topic: string;
    dedupeKey: string;
    payload: Record<string, unknown>;
    attempts: number;
}) {
    const { complete } = getOutboxFns();
    const processIntelligence = getIntelligenceFn();
    const eventId = event._id.toString();
    const processedKey = `task-worker:processed:${event.dedupeKey}`;

    let shouldProcess = true;
    if (redis) {
        const acquired = await redis.set(processedKey, WORKER_ID, "EX", 7 * 24 * 60 * 60, "NX");
        shouldProcess = Boolean(acquired);
    }

    if (!shouldProcess) {
        await complete(eventId);
        return;
    }

    try {
        if (event.topic !== "message.created") {
            await complete(eventId);
            return;
        }

        if (!isMessageCreatedPayload(event.payload)) {
            throw new Error("Invalid message.created payload shape");
        }

        const intelligence = await processIntelligence({
            messageId: event.payload.messageId,
            conversationId: event.payload.conversationId,
            senderId: event.payload.senderId,
            content: event.payload.content,
            messageType: event.payload.messageType,
        });

        if (intelligence) {
            await emitInternal(
                "/internal/message-semantic-updated",
                intelligence.semanticPayload.conversationId,
                intelligence.semanticPayload
            );

            if (intelligence.taskCreatedPayload) {
                await emitInternal(
                    "/internal/task-created",
                    intelligence.semanticPayload.conversationId,
                    intelligence.taskCreatedPayload
                );
            }

            if (intelligence.taskUpdatedPayload) {
                await emitInternal(
                    "/internal/task-updated",
                    intelligence.semanticPayload.conversationId,
                    intelligence.taskUpdatedPayload
                );
            }

            if (intelligence.taskLinkedPayload) {
                await emitInternal(
                    "/internal/task-linked-to-message",
                    intelligence.semanticPayload.conversationId,
                    intelligence.taskLinkedPayload
                );
            }
        }

        await complete(eventId);
    } catch (error) {
        if (redis) {
            await redis.del(processedKey);
        }
        throw error;
    }
}

async function run() {
    const { claim, fail } = getOutboxFns();

    if (!process.env.MONGODB_URI) {
        console.warn("task-worker disabled: MONGODB_URI is not set. Set MONGODB_URI to enable task processing.");
        // Keep process alive so monorepo dev does not fail hard when worker env is missing.
        // eslint-disable-next-line no-constant-condition
        while (true) {
            await wait(10_000);
        }
    }

    await ensureDatabaseConnection();

    if (redis) {
        await redis.connect();
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const events = await claim(WORKER_ID, BATCH_SIZE);

        if (events.length === 0) {
            await wait(POLL_INTERVAL_MS);
            continue;
        }

        for (const event of events) {
            try {
                await processOneEvent(event);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Outbox worker failure";
                await fail(event._id.toString(), message, computeRetryDelay(event.attempts));
                console.error("task-worker event processing failed", {
                    workerId: WORKER_ID,
                    eventId: event._id.toString(),
                    topic: event.topic,
                    attempts: event.attempts,
                    error: message,
                });
            }
        }
    }
}

run().catch((error) => {
    console.error("task-worker fatal error", error);
    process.exit(1);
});