import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enqueueOutboxEvent } from "@chat/services/outbox.service";
import { getPendingApprovalTaskActions, getTaskActionById, updateTaskActionExecutionState } from "@chat/services/repositories/task.repo";
import { requireAuthUser } from "@/lib/utils/auth/requireAuthUser";

const decisionSchema = z.object({
    taskActionId: z.string().min(1),
    decision: z.enum(["approve", "reject"]),
    reason: z.string().max(2000).optional(),
});

function serializeTaskAction(action: Awaited<ReturnType<typeof getPendingApprovalTaskActions>>[number]) {
    return {
        _id: action._id.toString(),
        taskId: action.taskId.toString(),
        conversationId: action.conversationId.toString(),
        actorType: action.actorType,
        actorId: action.actorId ? action.actorId.toString() : null,
        actionType: action.actionType,
        messageId: action.messageId ? action.messageId.toString() : null,
        executionState: action.executionState ?? null,
        summary: action.summary ?? null,
        error: action.error ?? null,
        patch: action.patch,
        reason: action.reason,
        idempotencyKey: action.idempotencyKey,
        createdAt: action.createdAt.toISOString(),
    };
}

export async function GET(req: NextRequest) {
    const guard = await requireAuthUser();
    if (guard.response) return guard.response;

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId") ?? undefined;

    const actions = await getPendingApprovalTaskActions(conversationId);
    return NextResponse.json({ approvals: actions.map(serializeTaskAction) }, { status: 200 });
}

export async function POST(req: NextRequest) {
    const guard = await requireAuthUser();
    if (guard.response) return guard.response;

    const body = decisionSchema.parse(await req.json());
    const action = await getTaskActionById(body.taskActionId);

    if (!action) {
        return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    if (body.decision === "reject") {
        const updated = await updateTaskActionExecutionState({
            taskActionId: body.taskActionId,
            executionState: "rejected",
            summary: action.summary ?? null,
            error: body.reason ?? "Rejected by reviewer.",
        });

        return NextResponse.json({ approval: updated ? serializeTaskAction(updated) : null }, { status: 200 });
    }

    const updated = await updateTaskActionExecutionState({
        taskActionId: body.taskActionId,
        executionState: "approved",
        summary: action.summary ?? null,
        error: null,
    });

    await enqueueOutboxEvent({
        topic: "task.execution.approved",
        dedupeKey: `task.execution.approved:${body.taskActionId}`,
        payload: {
            taskId: action.taskId.toString(),
            conversationId: action.conversationId.toString(),
            taskActionId: body.taskActionId,
            approvedByType: guard.user.role === "admin" ? "system" : "user",
            approvedById: guard.user.id,
            reason: body.reason ?? "",
        },
    });

    return NextResponse.json({ approval: updated ? serializeTaskAction(updated) : null }, { status: 200 });
}