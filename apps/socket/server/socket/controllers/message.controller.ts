import * as messageService from "../../../../../packages/services/message.service.js";
import type { CreateMessageInput } from "../../../../../packages/services/validators/message.schema.js";
import { Conversation } from "../../../../../packages/db/models/Conversation.js";

export async function handleCreateMessage(data: CreateMessageInput, senderId: string) {

    // Optional: validate that conversation exists
    const conversation = await Conversation.findById(data.conversationId);
    if (!conversation) {
        throw new Error("Conversation not found");
    }

    // Delegate saving & emitting to the service
    return messageService.createMessage(data, senderId);
}
