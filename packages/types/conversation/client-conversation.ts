import type { UIMessage } from "../message/ui-message";
import type { ClientUser } from "../user/user";

export interface ClientConversation {
    _id: string;
    type: "direct" | "group";
    participants: ClientUser[];
    name?: string;
    image?: string;
    isGroup: boolean;
    groupName?: string;
    admin?: string;
    lastMessage?: UIMessage; // ✅ client-safe
    unreadCount?: number;

    createdAt?: string;
    updatedAt?: string;
}