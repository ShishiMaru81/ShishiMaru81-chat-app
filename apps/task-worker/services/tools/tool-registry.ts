export type ToolExecutionTask = {
    taskId: string;
    conversationId: string;
    capability: string;
    actionType: string;
    parameters: Record<string, unknown>;
    messageId: string | null;
};

export type ToolResult = {
    summary: string;
    adapterSuccess: boolean;
    evidence: unknown;
    error?: string;
};

export interface Tool {
    name: string;
    capabilities: string[];
    execute(task: ToolExecutionTask): Promise<ToolResult>;
}

export class ToolRegistry {
    private readonly toolsByCapability = new Map<string, Tool[]>();

    register(tool: Tool) {
        for (const capability of tool.capabilities) {
            const existing = this.toolsByCapability.get(capability) ?? [];
            this.toolsByCapability.set(capability, [...existing, tool]);
        }
    }

    findToolsByCapability(capability: string): Tool[] {
        return this.toolsByCapability.get(capability) ?? [];
    }

    hasCapability(capability: string): boolean {
        return this.findToolsByCapability(capability).length > 0;
    }
}

export default ToolRegistry;