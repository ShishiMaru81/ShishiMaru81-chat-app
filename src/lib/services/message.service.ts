// src/lib/services/message.service.ts
import * as messageRepo from "@/lib/repositories/message.repo";
import { CreateMessageInput } from "../validators/ message.schema";
import { Types } from "mongoose";

export async function createMessage(data: CreateMessageInput) {
    // correctly map senderId → sender
    const toSave = {
        sender: new Types.ObjectId(data.senderId),
        conversationId: new Types.ObjectId(data.conversationId),
        content: data.content,
        // if you have messageType in schema, include here:
        // messageType: data.messageType ?? "text",
    };

    console.log("🔊 [Service] Emitting to room", data.conversationId, toSave);
    return await messageRepo.saveMessage(toSave);

    // io.to(data.conversationId).emit("message:new", saved);

    //return saved;
}
