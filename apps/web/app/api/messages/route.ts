import { NextRequest, NextResponse } from "next/server";
import { createMessage } from "@/lib/services/message.service";
import { CreateMessageSchema } from "@/lib/validators/message.schema";
import { getPaginatedMessages } from "@/lib/repositories/message.repo";
import { normalizeMessage } from "@/server/normalizers/message.normalizer";
import { requireAuthUser } from "@/lib/utils/auth/requireAuthUser";
import { getInternalSocketServerUrl } from "@/lib/socket/socketConfig";
import { createInternalRequestHeaders } from "@chat/types/utils/internal-bridge-auth";
import { processMessageTaskIntelligence } from "@/lib/services/task-intelligence.service";

//import { messageRateLimiter } from "@/lib/utils/rateLimiter";

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuthUser();
        if (guard.response) {
            return guard.response;
        }
        const senderId = guard.user.id;
        // const identifier = session.user.email;
        //const { success } = await messageRateLimiter.limit(identifier);
        //if (!success) return NextResponse.json({ error: "Too many messages" }, { status: 429 });
        const requestBody = await req.json();
        const parsed = CreateMessageSchema.parse(requestBody);
        const message = await createMessage(parsed, senderId);
        const clientMessage = normalizeMessage(message);

        void (async () => {
            try {
                const taskResult = await processMessageTaskIntelligence({
                    messageId: clientMessage._id,
                    conversationId: clientMessage.conversationId,
                    senderId,
                    content: clientMessage.content,
                    messageType: clientMessage.messageType,
                });

                if (!taskResult) return;

                const headers = createInternalRequestHeaders();
                const baseUrl = getInternalSocketServerUrl();

                await fetch(`${baseUrl}/internal/message-semantic-updated`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        conversationId: clientMessage.conversationId,
                        payload: taskResult.semanticPayload,
                    }),
                });

                if (taskResult.taskCreatedPayload) {
                    await fetch(`${baseUrl}/internal/task-created`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            conversationId: clientMessage.conversationId,
                            payload: taskResult.taskCreatedPayload,
                        }),
                    });
                }

                if (taskResult.taskUpdatedPayload) {
                    await fetch(`${baseUrl}/internal/task-updated`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            conversationId: clientMessage.conversationId,
                            payload: taskResult.taskUpdatedPayload,
                        }),
                    });
                }

                if (taskResult.taskLinkedPayload) {
                    await fetch(`${baseUrl}/internal/task-linked-to-message`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            conversationId: clientMessage.conversationId,
                            payload: taskResult.taskLinkedPayload,
                        }),
                    });
                }
            } catch (taskProcessingError) {
                console.error("Task intelligence processing failed", taskProcessingError);
            }
        })();

        return NextResponse.json(clientMessage, { status: 201 });
    } catch (error) {
        console.error("❌ Message POST error:", error);

        return NextResponse.json(
            { error: error || "Invalid input" },
            { status: 400 }
        );
    }
}
export async function GET(req: NextRequest) {
    try {

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId")!;
        const cursor = searchParams.get("cursor") || undefined;

        const messages = await getPaginatedMessages(conversationId, cursor);
        const clientMessages = (Array.isArray(messages) ? messages : []).map(normalizeMessage);
        // Always return an array, even if empty:
        return NextResponse.json(clientMessages, { status: 200 });
    } catch (err) {
        console.error(err);
        // Return an empty array instead of no body:
        return NextResponse.json([], { status: 200 });
    }
}