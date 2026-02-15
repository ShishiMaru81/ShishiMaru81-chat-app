import { UIMessage } from "./ui-message.js";
import { ClientUser } from "./user.js";

export interface ClientConversation {
    _id: string;
    type: "direct" | "group";
    participants: ClientUser[];
    name?: string;
    image?: string;
    isGroup: boolean;
    groupName?: string;

    lastMessage?: UIMessage; // ✅ client-safe
    unreadCount?: number;

    createdAt?: string;
    updatedAt?: string;
}