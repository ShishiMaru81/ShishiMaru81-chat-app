import type { MessageDTO } from "../dto/message.dto";

export interface UIMessage extends Omit<MessageDTO, "createdAt" | "updatedAt"> {
    createdAt: Date;
    updatedAt?: Date;

    status: "pending" | "failed" | "sent" | "delivered" | "seen" | "queued";
    isTemp?: boolean;
}