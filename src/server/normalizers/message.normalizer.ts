import { ClientMessage } from "@/types/client-message";

// src/server/normalizers/message.normalizer.ts
export function normalizeMessage(doc: any): ClientMessage {
    return {
        id: doc._id.toString(),
        conversationId: doc.conversationId.toString(),
        senderId: doc.sender.toString(),

        content: doc.isDeleted ? null : doc.content,
        type: doc.messageType,

        createdAt: doc.createdAt.toISOString(),
        editedAt: doc.updatedAt?.toISOString(),
        deletedAt: doc.isDeleted ? doc.updatedAt?.toISOString() : undefined,

        reactions: doc.reactions ?? [],
        deliveredTo: doc.deliveredTo?.map(String) ?? [],
        seenBy: doc.seenBy?.map(String) ?? [],
    };
}