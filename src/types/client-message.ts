import { IMessagePopulated } from "@/models/Message";
import { IUser } from "@/models/User";

export interface ClientReaction {
    emoji: string;
    userIds: string[];
}

export interface ClientMessage {
    _id: string;
    conversationId: string;
    senderId: string;
    sender?: IUser; // optional populated
    content: string;
    messageType: "text" | "image" | "file" | "system";
    reactions: ClientReaction[];

    deliveredTo: string[];
    seenBy: string[];

    isEdited: boolean;
    isDeleted: boolean;

    createdAt: string; // ISO string
    updatedAt?: string;
}