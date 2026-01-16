

import { MessageType } from "./message.types";
export interface ClientConversation {
    _id: string;
    type: "direct" | "group";
    participants: string[];
    name?: string;
    image?: string;
    isGroup: boolean;

    lastMessage?: MessageType; // ✅ client-safe
    unreadCount?: number;

    createdAt?: string;
    updatedAt?: string;
}