// src/types/socket.ts
//import { IMessagePopulated } from "@/models/Message"; // or wherever your message type is

export interface JoinConversationPayload {
    conversationId: string;
}

export interface LeaveConversationPayload {
    conversationId: string;
}

export interface SendMessagePayload {
    conversationId: string;
    tempId: string;
    content: string;
    type: "text" | "image" | "video" | "audio" | "voice" | "file";
    fileUrl?: string;
    repliedTo?: string | null;
}

export interface EditMessagePayload {
    messageId: string;
    content: string;
}

export interface DeleteMessagePayload {
    messageId: string;
}

export interface ReactMessagePayload {
    messageId: string;
    emoji: string;
}

export interface TypingPayload {
    conversationId: string;
}

export interface MessageDeletedPayload {
    messageId: string;
    conversationId: string;
}

export interface TypingUpdatePayload {
    conversationId: string;
    userId: string;
    isTyping: boolean;
}

export interface PresenceUpdatePayload {
    userId: string;
    status: "online" | "offline";
}