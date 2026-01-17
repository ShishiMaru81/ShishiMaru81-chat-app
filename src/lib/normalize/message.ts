import { ClientMessage } from "@/types/client-message";

export const normalizeMessage = (m: ClientMessage): ClientMessage => ({
    _id: String(m._id),
    conversationId: String(m.conversationId),
    senderId: String(m.sender?._id ?? m.sender),
    sender: m.sender,
    content: m.content,
    messageType: m.messageType,
    reactions: m.reactions ?? [],
    deliveredTo: (m.deliveredTo ?? []).map(String),
    seenBy: (m.seenBy ?? []).map(String),
    isEdited: Boolean(m.isEdited),
    isDeleted: Boolean(m.isDeleted),
    createdAt: new Date(m.createdAt).toISOString(),
    updatedAt: m.updatedAt
        ? new Date(m.updatedAt).toISOString()
        : undefined,
});