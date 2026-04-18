import type { Tool, ToolExecutionTask, ToolResult } from "./tool-registry.js";

export class ScheduleMeetingTool implements Tool {
    name = "meeting-webhook";

    capabilities = ["schedule_meeting"];

    async execute(task: ToolExecutionTask): Promise<ToolResult> {
        const webhookUrl = process.env.SCHEDULE_MEETING_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error("Schedule meeting adapter is not configured. Set SCHEDULE_MEETING_WEBHOOK_URL.");
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                taskId: task.taskId,
                conversationId: task.conversationId,
                triggerMessageId: task.messageId,
                parameters: task.parameters ?? {},
            }),
        });

        const responseText = await response.text();
        let responseBody: unknown = responseText;
        try {
            responseBody = responseText.length > 0 ? JSON.parse(responseText) : null;
        } catch {
            responseBody = responseText;
        }

        return {
            summary: response.ok ? "Scheduled meeting via external adapter." : `Meeting scheduling failed with status ${response.status}.`,
            adapterSuccess: response.ok,
            evidence: {
                responseStatus: response.status,
                responseBody,
            },
            ...(response.ok ? {} : { error: typeof responseBody === "string" ? responseBody.slice(0, 500) : undefined }),
        };
    }
}

export default ScheduleMeetingTool;