import { ClientConversation } from "./client-conversation.js";

export interface ClientUser {
    _id: string;
    username: string;
    email: string;
    isOnline: boolean;
    profilePicture?: string;
    role: 'user' | 'moderator' | 'admin';
    status: 'active' | 'banned';
    lastSeen: Date;
    isVerified: boolean;
    verifiedAt?: Date;
    conversations: ClientConversation[];
    createdAt: Date;
    updatedAt: Date;
}