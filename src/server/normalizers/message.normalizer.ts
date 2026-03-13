import { MessageDTO } from "../../shared/dto/message.dto.js";
import { IMessagePopulated } from "../../models/Message.js";

export function normalizeMessage(doc: IMessagePopulated): MessageDTO {
    return {
        _id: doc._id.toString(),
        conversationId: doc.conversationId.toString(),

        content: doc.content,
        messageType: doc.messageType,

        sender: {
            _id: doc.sender._id.toString(),
            username: doc.sender.username,
            profilePicture: doc.sender.profilePicture,
        },

        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: doc.updatedAt
            ? new Date(doc.updatedAt).toISOString()
            : undefined,

        isDeleted: doc.isDeleted,
        isEdited: doc.isEdited,
        editedAt: doc.isEdited && doc.updatedAt
            ? new Date(doc.updatedAt).toISOString()
            : undefined,

        reactions: doc.reactions
            ? normalizeReactions(
                doc.reactions instanceof Map
                    ? Object.fromEntries(doc.reactions)
                    : doc.reactions
            )
            : [],

        seenBy: doc.seenBy
            ? doc.seenBy.map((entry) =>
                typeof entry === "object" && entry !== null && "user" in entry && entry.user
                    ? (entry.user as { toString(): string }).toString()
                    : (entry as { toString(): string }).toString()
            )
            : [],

        deliveredTo: doc.deliveredTo
            ? doc.deliveredTo.map((entry) =>
                typeof entry === "object" && entry !== null && "user" in entry && entry.user
                    ? (entry.user as { toString(): string }).toString()
                    : (entry as { toString(): string }).toString()
            )
            : [],
        repliedTo: doc.repliedTo ? {
            _id: doc.repliedTo._id.toString(),
            content: doc.repliedTo.content,
            sender: {
                _id: doc.repliedTo.sender._id.toString(),
                username: doc.repliedTo.sender.username,
                profilePicture: doc.repliedTo.sender.profilePicture,
            }
        } : null,
    };
}
export function normalizeReactions(
    reactions?: Record<string, unknown[]>
): { emoji: string; users: string[] }[] {
    if (!reactions) return [];

    return Object.entries(reactions).map(([emoji, users]) => ({
        emoji,
        users: (users || []).map((user: any) =>
            typeof user === "string"
                ? user
                : user?._id
                    ? user._id.toString()
                    : user?.toString()
        ),
    }));
}