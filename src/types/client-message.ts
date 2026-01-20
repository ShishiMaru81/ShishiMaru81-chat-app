import { IMessagePopulated } from "@/models/Message";
import { IUser } from "@/models/User";

export interface ClientReaction {
    emoji: string;
    userIds: string[];
}

export interface ClientMessage {
    id: string
    conversationId: string
    senderId: string
    content: string | null
    type: "text" | "image" | "file" | "system"

    createdAt: string        // ISO string (single source of truth)
    editedAt?: string
    deletedAt?: string

    reactions: ClientReaction[]
    deliveredTo: string[]
    seenBy: string[]

    status?: "sending" | "sent" | "failed" // client-only
}