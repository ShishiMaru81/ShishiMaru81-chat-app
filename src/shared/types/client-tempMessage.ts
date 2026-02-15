import { ClientMessage } from "./client-message.js";

export interface clientTempMessage {
    _id: string;
    conversationId: string;
    senderId: string;
    isDeleted: boolean;
    repliedTo?: string;
    reactions?: {
        emoji: string;
        users: ClientMessage[]; // who reacted
    }[];
    content: string;
    messageType: "text" | "image";
    status: "pending" | "queued";
    sender: ClientMessage;
    createdAt: Date;
}