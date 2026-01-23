import { ClientConversation } from "./client-conversation";

export interface ClientUser {
    _id: string;
    username: string;
    email: string;
    isOnline: boolean;
    profilePicture?: string;
    role: 'user' | 'moderator' | 'admin';
    status: 'active' | 'banned';
    lastSeen: Date;
    isVerified: Date;
    conversations: ClientConversation[];
    createdAt: Date;
    updatedAt: Date;
}