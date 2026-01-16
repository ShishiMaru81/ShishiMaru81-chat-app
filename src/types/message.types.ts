import { IUser } from "@/models/User";

export type MessageType = "text" | "image" | "file" | "voice" | "video" | "audio";

export interface ClientMessage {
    _id: string;
    conversationId: string;

    sender: IUser; // already populated
    content: string;

    messageType: MessageType;

    isEdited: boolean;
    isDeleted: boolean;

    reactions: any[];
    seenBy: string[];
    deliveredTo: string[];

    createdAt: string;
    updatedAt: string;
}