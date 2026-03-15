import { ClientUser } from "./user.js";
import { ClientMessage } from "./message.js";

export interface ClientConversation {
    _id: string;
    type: 'direct' | 'group';
    isGroup: boolean;
    admin?: string;
    name?: string;
    image?: string;
    groupName?: string;
    participants: ClientUser[];
    lastMessage?: ClientMessage;
    createdAt: string;
    updatedAt: string;
}