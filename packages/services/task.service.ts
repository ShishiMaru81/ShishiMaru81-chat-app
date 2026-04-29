import type { CreateTaskInput } from "@chat/services/validators/task.schema";
import { buildTaskDedupeKey, createTask, upsertTaskByDedupeKey } from "@chat/services/repositories/task.repo";

export function normalizeTaskTitle(title: string) {
    return title.trim().replace(/\s+/g, " ");
}

export function deriveTaskDedupeKey(input: Pick<CreateTaskInput, "conversationId" | "title"> & { sourceMessageId?: string | null }) {
    return buildTaskDedupeKey(input.conversationId, normalizeTaskTitle(input.title), input.sourceMessageId ?? null);
}

export async function createOrReuseTask(input: CreateTaskInput) {
    return upsertTaskByDedupeKey(input);
}

export async function createManualTask(input: CreateTaskInput) {
    return createTask(input);
}