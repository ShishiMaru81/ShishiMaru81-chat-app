import { MessageDTO } from "@/shared/dto/message.dto.js";
import { IMessagePopulated } from "../../models/Message.js";
import type { ClientMessage, ClientReaction } from "../../shared/types/client-message.js";

// src/server/normalizers/message.normalizer.ts
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
            ? doc.reactions.map((reaction) => ({
                emoji: reaction.emoji,
                users: (reaction.users ?? []).map((user: any) =>
                    typeof user === "string"
                        ? user
                        : user._id
                            ? user._id.toString()
                            : user.toString()
                ),
            }))
            : [],

        seenBy: doc.seenBy
            ? doc.seenBy.map((entry: any) =>
                entry.user
                    ? entry.user.toString()
                    : entry.toString()
            )
            : [],

        deliveredTo: doc.deliveredTo
            ? doc.deliveredTo.map((entry: any) =>
                entry.user
                    ? entry.user.toString()
                    : entry.toString()
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
    reactions?: Record<string, string[]>
): ClientReaction[] | undefined {
    if (!reactions) return undefined;

    return Object.entries(reactions).map(([emoji, users]) => ({
        emoji,
        users,
    }));
}