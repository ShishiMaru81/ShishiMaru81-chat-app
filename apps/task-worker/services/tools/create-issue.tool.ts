import type { Tool, ToolExecutionTask, ToolResult } from "./tool-registry.js";

export class CreateIssueTool implements Tool {
    name = "github-issue-api";

    capabilities = ["create_issue", "create_github_issue"];

    async execute(task: ToolExecutionTask): Promise<ToolResult> {
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO;

        if (!token || !repo || !repo.includes("/")) {
            throw new Error("GitHub adapter is not configured. Set GITHUB_TOKEN and GITHUB_REPO=owner/repo.");
        }

        const title = typeof task.parameters?.title === "string"
            ? task.parameters.title
            : `Task: ${task.taskId}`;
        const body = typeof task.parameters?.body === "string"
            ? task.parameters.body
            : `Auto-created from task ${task.taskId} in conversation ${task.conversationId}.`;

        const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
            method: "POST",
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "User-Agent": "chat-task-worker",
            },
            body: JSON.stringify({ title, body }),
        });

        const issue = (await response.json()) as { html_url?: string; number?: number; message?: string };

        return {
            summary: response.ok ? `Created GitHub issue #${issue.number ?? "?"}${issue.html_url ? ` (${issue.html_url})` : ""}` : `GitHub issue creation failed with status ${response.status}.`,
            adapterSuccess: response.ok,
            evidence: {
                responseStatus: response.status,
                issue,
            },
            ...(response.ok ? {} : { error: typeof issue.message === "string" ? issue.message : undefined }),
        };
    }
}

export default CreateIssueTool;