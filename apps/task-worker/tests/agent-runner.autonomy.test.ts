import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { AgentRunner } from "../services/agent-runner.js";
import ToolRegistry, { type Tool } from "../services/tools/tool-registry.js";

let currentLlmPayloads: Array<{ toolName: string; arguments: Record<string, unknown> }> | null = null;
let currentLlmIndex = 0;

type MockTask = {
    _id: { toString(): string };
    conversationId: { toString(): string };
    title: string;
    description: string;
    status: string;
    version: number;
    updatedBy: null | string;
    retryCount?: number;
    maxRetries?: number;
    progress?: number;
    checkpoints?: Array<{ step: string; status: string; timestamp: string }>;
    executionHistory?: {
        attempts: number;
        failures: number;
        results: Array<Record<string, unknown>>;
    };
    result?: Record<string, unknown>;
    save: () => Promise<void>;
};

class RecordingTool implements Tool {
    public readonly name: string;
    public readonly description: string;
    public readonly inputSchema = z.object({}).passthrough();

    private readonly calls: Array<{ toolName: string; input: Record<string, unknown> }>;
    private readonly outputs: Array<{ summary: string; adapterSuccess: boolean; evidence: unknown; error?: string }>;

    constructor(
        name: string,
        description: string,
        calls: Array<{ toolName: string; input: Record<string, unknown> }>,
        outputs: Array<{ summary: string; adapterSuccess: boolean; evidence: unknown; error?: string }>
    ) {
        this.name = name;
        this.description = description;
        this.calls = calls;
        this.outputs = outputs;
    }

    async execute(input: Record<string, unknown>) {
        this.calls.push({ toolName: this.name, input });
        const next = this.outputs.shift();
        if (!next) {
            return {
                summary: `${this.name} executed`,
                adapterSuccess: true,
                evidence: { defaulted: true },
            };
        }

        return next;
    }
}

function createMockTask(): MockTask {
    const task: MockTask = {
        _id: { toString: () => "task-1" },
        conversationId: { toString: () => "conv-1" },
        title: "Autonomy test task",
        description: "Validate autonomous multi-step execution",
        status: "pending",
        version: 1,
        updatedBy: null,
        save: async () => {
            task.version += 1;
        },
    };

    return task;
}

function toolCallPayload(name: string, args: Record<string, unknown>, content?: string) {
    return {
        toolName: name,
        arguments: args,
    };
}

function noActionPayload(reasoning: string) {
    return {
        toolName: "none",
        arguments: { reasoning },
    };
}

function createLlmRequestFn() {
    return async () => {
        const next = currentLlmPayloads?.[currentLlmIndex] ?? currentLlmPayloads?.[currentLlmPayloads.length - 1] ?? { toolName: "none", arguments: {} };
        currentLlmIndex += 1;

        const text = JSON.stringify({
            tool: next.toolName === "none" ? null : next.toolName,
            confidence: 0.9,
            parameters: next.arguments,
            reasoning: "test decision",
            noAction: next.toolName === "none",
            needsClarification: false,
            clarificationQuestion: null,
        });

        return {
            output_text: text,
            output: [{ type: "message", content: [{ type: "output_text", text }] }],
        };
    };
}

function withMockedFetch(
    llmPayloads: Array<Record<string, unknown>>,
    fn: () => Promise<void>
) {
    const originalFetch = global.fetch;
    let llmIndex = 0;
    const previousPayloads = currentLlmPayloads;
    const previousIndex = currentLlmIndex;
    currentLlmPayloads = llmPayloads as Array<{ toolName: string; arguments: Record<string, unknown> }>;
    currentLlmIndex = 0;

    global.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("/responses")) {
            const payload = llmPayloads[llmIndex] ?? noActionPayload("No more actions.");
            llmIndex += 1;
            return new Response(JSON.stringify(payload), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (url.includes("/internal/task-updated")) {
            return new Response(JSON.stringify({ ok: true, init }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }) as typeof fetch;

    return fn().finally(() => {
        global.fetch = originalFetch;
        currentLlmPayloads = previousPayloads;
        currentLlmIndex = previousIndex;
    });
}

function restoreEnvVar(key: string, value: string | undefined) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
}

test("autonomy: schedules meeting then sends follow-up email via LLM-selected tools", async () => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-key";

    const toolCalls: Array<{ toolName: string; input: Record<string, unknown> }> = [];
    const registry = new ToolRegistry();
    registry.register(
        new RecordingTool("schedule_meeting", "Schedule a meeting", toolCalls, [
            {
                summary: "Meeting scheduled",
                adapterSuccess: true,
                evidence: { meetingId: "m-1" },
            },
        ])
    );
    registry.register(
        new RecordingTool("send_email", "Send email", toolCalls, [
            {
                summary: "Follow-up sent",
                adapterSuccess: true,
                evidence: { emailId: "e-1" },
            },
        ])
    );

    const task = createMockTask();
    const runner = new AgentRunner({
        llmRequestFn: createLlmRequestFn(),
        taskModel: {
            findById: async () => task as any,
        },
        toolRegistry: registry,
        taskSuccessRegistry: {
            validate: (toolName: string) => ({
                validator: "autonomy-test",
                passed: toolName === "send_email",
                checks: [{ name: "terminal-step", passed: toolName === "send_email", details: null }],
            }),
        } as any,
        internalBaseUrl: "http://mock-internal",
        getLatestExecutionTaskAction: async () => ({
            taskId: { toString: () => "task-1" },
            conversationId: { toString: () => "conv-1" },
            actionType: "none",
            toolName: "none",
            parameters: {},
            messageId: null,
            executionState: null,
        }),
    });

    const previousKey = process.env.OPENAI_API_KEY;
    const previousMaxIterations = process.env.TASK_AGENT_MAX_ITERATIONS;
    process.env.OPENAI_API_KEY = "test-key";
    process.env.TASK_AGENT_MAX_ITERATIONS = "4";

    await withMockedFetch(
        [
            toolCallPayload("schedule_meeting", { summary: "Project sync", whenText: "tomorrow 10am" }),
            toolCallPayload("send_email", { to: ["team@example.com"], subject: "Meeting scheduled" }),
        ],
        async () => {
            const outcome = await runner.runTask("task-1");
            assert.equal(outcome.completed, true);
            assert.equal(toolCalls.length, 2);
            assert.equal(toolCalls[0]?.toolName, "schedule_meeting");
            assert.equal(toolCalls[1]?.toolName, "send_email");
            assert.equal(task.status, "completed");
        }
    );

    restoreEnvVar("OPENAI_API_KEY", previousKey);
    restoreEnvVar("TASK_AGENT_MAX_ITERATIONS", previousMaxIterations);
});

test("autonomy: creates GitHub issue then notifies team without predefined plan", async () => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-key";

    const toolCalls: Array<{ toolName: string; input: Record<string, unknown> }> = [];
    const registry = new ToolRegistry();
    registry.register(
        new RecordingTool("create_github_issue", "Create a GitHub issue", toolCalls, [
            {
                summary: "Issue created",
                adapterSuccess: true,
                evidence: { issueNumber: 42 },
            },
        ])
    );
    registry.register(
        new RecordingTool("send_email", "Send email", toolCalls, [
            {
                summary: "Team notified",
                adapterSuccess: true,
                evidence: { notification: true },
            },
        ])
    );

    const task = createMockTask();
    const runner = new AgentRunner({
        llmRequestFn: createLlmRequestFn(),
        taskModel: {
            findById: async () => task as any,
        },
        toolRegistry: registry,
        taskSuccessRegistry: {
            validate: (toolName: string) => ({
                validator: "autonomy-test",
                passed: toolName === "send_email",
                checks: [{ name: "terminal-step", passed: toolName === "send_email", details: null }],
            }),
        } as any,
        internalBaseUrl: "http://mock-internal",
        getLatestExecutionTaskAction: async () => ({
            taskId: { toString: () => "task-1" },
            conversationId: { toString: () => "conv-1" },
            actionType: "none",
            toolName: "none",
            parameters: {},
            messageId: null,
            executionState: null,
        }),
    });

    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";

    await withMockedFetch(
        [
            toolCallPayload("create_github_issue", { title: "Bug", body: "Please fix", labels: ["bug"] }),
            toolCallPayload("send_email", { to: ["team@example.com"], subject: "Issue created" }),
        ],
        async () => {
            const outcome = await runner.runTask("task-1");
            assert.equal(outcome.completed, true);
            assert.deepEqual(
                toolCalls.map((entry) => entry.toolName),
                ["create_github_issue", "send_email"]
            );
            assert.equal(task.status, "completed");
        }
    );

    restoreEnvVar("OPENAI_API_KEY", previousKey);
});

test("autonomy: chained tasks adapt after a failed step", async () => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-key";

    const toolCalls: Array<{ toolName: string; input: Record<string, unknown> }> = [];
    const registry = new ToolRegistry();
    registry.register(
        new RecordingTool("create_github_issue", "Create a GitHub issue", toolCalls, [
            {
                summary: "Issue tool failed",
                adapterSuccess: false,
                evidence: { reason: "api unavailable" },
                error: "api unavailable",
            },
        ])
    );
    registry.register(
        new RecordingTool("schedule_meeting", "Schedule a meeting", toolCalls, [
            {
                summary: "Fallback sync scheduled",
                adapterSuccess: true,
                evidence: { meetingId: "fallback-1" },
            },
        ])
    );
    registry.register(
        new RecordingTool("send_email", "Send email", toolCalls, [
            {
                summary: "Final update sent",
                adapterSuccess: true,
                evidence: { emailId: "final-1" },
            },
        ])
    );

    const task = createMockTask();
    const runner = new AgentRunner({
        llmRequestFn: createLlmRequestFn(),
        taskModel: {
            findById: async () => task as any,
        },
        toolRegistry: registry,
        taskSuccessRegistry: {
            validate: (toolName: string, _task: unknown, result: { adapterSuccess: boolean }) => ({
                validator: "autonomy-test",
                passed: toolName === "send_email" && result.adapterSuccess,
                checks: [{ name: "goal-achieved", passed: toolName === "send_email" && result.adapterSuccess, details: null }],
            }),
        } as any,
        internalBaseUrl: "http://mock-internal",
        getLatestExecutionTaskAction: async () => ({
            taskId: { toString: () => "task-1" },
            conversationId: { toString: () => "conv-1" },
            actionType: "none",
            toolName: "none",
            parameters: {},
            messageId: null,
            executionState: null,
        }),
    });

    const previousKey = process.env.OPENAI_API_KEY;
    const previousMaxIterations = process.env.TASK_AGENT_MAX_ITERATIONS;
    process.env.OPENAI_API_KEY = "test-key";
    process.env.TASK_AGENT_MAX_ITERATIONS = "6";

    await withMockedFetch(
        [
            toolCallPayload("create_github_issue", { title: "Primary attempt" }),
            toolCallPayload("schedule_meeting", { summary: "Fallback sync" }),
            toolCallPayload("send_email", { to: ["team@example.com"], subject: "Update" }),
        ],
        async () => {
            const outcome = await runner.runTask("task-1");
            assert.equal(outcome.completed, true);
            assert.deepEqual(
                toolCalls.map((entry) => entry.toolName),
                ["create_github_issue", "schedule_meeting", "send_email"]
            );
            assert.ok(outcome.retryCount > 0);
            assert.equal(task.status, "completed");
        }
    );

    restoreEnvVar("OPENAI_API_KEY", previousKey);
    restoreEnvVar("TASK_AGENT_MAX_ITERATIONS", previousMaxIterations);
});
