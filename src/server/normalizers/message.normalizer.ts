import { ClientMessage } from "../../types/client-message.js";

// src/server/normalizers/message.normalizer.ts
export function normalizeMessage(doc: any): ClientMessage {
    return {
        _id: doc._id.toString(),
        conversationId: doc.conversationId.toString(),
        sender: doc.sender.toString(),

        content: doc.isDeleted ? null : doc.content,
        messageType: doc.messageType,

        createdAt: doc.createdAt.toISOString(),
        //editedAt: doc.updatedAt?.toISOString(),
        //deletedAt: doc.isDeleted ? doc.updatedAt?.toISOString() : undefined,

        reactions: doc.reactions ?? [],
        //deliveredTo: doc.deliveredTo?.map(String) ?? [],
        // seenBy: doc.seenBy?.map(String) ?? [],
    };
}