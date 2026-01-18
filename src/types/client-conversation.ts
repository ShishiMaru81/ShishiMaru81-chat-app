

import { MessageType } from "./message.types";
import { ClientUser } from "./user";

export interface ClientConversation {
    _id: string;
    type: "direct" | "group";
    participants: ClientUser[];
    name?: string;
    image?: string;
    isGroup: boolean;
    groupName?: string;

    lastMessage?: MessageType; // ✅ client-safe
    unreadCount?: number;

    createdAt?: string;
    updatedAt?: string;
}