import { MessageDTO } from "../dto/message.dto";

export function isMessageDTO(value: unknown): value is MessageDTO {
    if (!value || typeof value !== "object") return false;

    const v = value as any;

    return (
        typeof v._id === "string" &&
        typeof v.conversationId === "string" &&
        typeof v.content === "string" &&
        typeof v.createdAt === "string" &&
        v.sender &&
        typeof v.sender._id === "string"
    );
}