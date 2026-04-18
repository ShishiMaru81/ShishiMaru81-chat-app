import type { Tool, ToolExecutionTask, ToolResult } from "./tool-registry.js";

export class SendEmailTool implements Tool {
    name = "resend-email";

    capabilities = ["send_email"];

    async execute(task: ToolExecutionTask): Promise<ToolResult> {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.RESEND_FROM_EMAIL;

        if (!apiKey || !from) {
            throw new Error("Email adapter is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
        }

        const to = Array.isArray(task.parameters?.to)
            ? task.parameters.to
            : typeof task.parameters?.to === "string"
                ? [task.parameters.to]
                : [];

        if (to.length === 0) {
            throw new Error("Email adapter requires parameters.to");
        }

        const subject = typeof task.parameters?.subject === "string"
            ? task.parameters.subject
            : `Task update ${task.taskId}`;

        const body = typeof task.parameters?.body === "string"
            ? task.parameters.body
            : `Automated update for task ${task.taskId}.`;

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to,
                subject,
                text: body,
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
            summary: response.ok ? `Sent email to ${to.join(", ")}.` : `Email sending failed with status ${response.status}.`,
            adapterSuccess: response.ok,
            evidence: {
                responseStatus: response.status,
                responseBody,
                to,
            },
            ...(response.ok ? {} : { error: typeof responseBody === "string" ? responseBody.slice(0, 500) : undefined }),
        };
    }
}

export default SendEmailTool;