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
                Object.fromEntries(
                    Object.entries(doc.reactions).map(([emoji, users]) => {
                        let userArr: (string | { _id: { toString(): string } } | { toString(): string })[] = [];
                        if (Array.isArray(users)) {
                            userArr = users;
                        } else if (users && typeof users === 'object' && typeof (users as { values?: () => unknown }).values === 'function') {
                            // If users is a Map-like object, convert to array and filter/map to correct type
                            userArr = Array.from((users as { values: () => Iterable<unknown> }).values())
                                .filter((u): u is string | { _id: { toString(): string } } | { toString(): string } =>
                                    typeof u === "string" || (typeof u === "object" && u !== null && ("_id" in u || "toString" in u))
                                );
                        } else if (users) {
                            userArr = [users];
                        }
                        return [
                            emoji,
                            userArr.map((user: string | { _id: { toString(): string } } | { toString(): string }) =>
                                typeof user === "string"
                                    ? user
                                    : "_id" in user
                                        ? user._id.toString()
                                        : user.toString()
                            )
                        ];
                    })
                )
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
    reactions?: Record<string, (string | { _id: { toString(): string } } | { toString(): string })[]>
): { emoji: string; users: string[] }[] | undefined {
    if (!reactions) return undefined;

    return Object.entries(reactions).map(([emoji, users]) => {
        let userArr: (string | { _id: { toString(): string } } | { toString(): string })[] = [];
        if (Array.isArray(users)) {
            userArr = users;
        } else if (users && typeof users === 'object' && typeof (users as { values?: () => unknown }).values === 'function') {
            // If users is a Map-like object, convert to array and filter/map to correct type
            userArr = Array.from((users as { values: () => Iterable<unknown> }).values())
                .filter((u): u is string | { _id: { toString(): string } } | { toString(): string } =>
                    typeof u === "string" || (typeof u === "object" && u !== null && ("_id" in u || "toString" in u))
                );
        } else if (users) {
            userArr = [users];
        }
        return {
            emoji,
            users: userArr.map((user) =>
                typeof user === "string"
                    ? user
                    : "_id" in user
                        ? user._id.toString()
                        : user.toString()
            ),
        };
    });
}