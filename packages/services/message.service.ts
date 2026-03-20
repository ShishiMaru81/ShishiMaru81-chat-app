// src/lib/services/message.service.ts
'use server';
import * as messageRepo from "@/lib/repositories/message.repo";
import { CreateMessageInput } from "@/lib/validators/message.schema";
import { Types } from "mongoose";
import { Conversation } from "@/models/Conversation";
import Message, { IMessagePopulated } from "@/models/Message";
import { connectToDatabase } from "@/lib/Db/db";
//import { socket } from "@/lib/socket/socketClient";

export async function createMessage(data: CreateMessageInput, senderId: string) {
    await connectToDatabase();

    // correctly map senderId → sender
    const toSave: Parameters<typeof messageRepo.saveMessage>[0] = {
        sender: new Types.ObjectId(senderId),
        conversationId: new Types.ObjectId(data.conversationId),
        content: data.content,
        messageType: data.messageType ?? "text",
        status: "sent",
        delivered: false,
        seen: false,
        ...(data.replyTo ? { repliedTo: new Types.ObjectId(data.replyTo) } : {}),
    };
    const conversation = await Conversation.findById(data.conversationId);
    if (!conversation) {
        throw new Error("Conversation not found");
    }
    const saved = await messageRepo.saveMessage(toSave);
    conversation.lastMessage = {
        _id: saved._id,
        sender: saved.sender,
        messageType: saved.messageType,
        content: saved.content,
        _creationTime: saved.createdAt ?? new Date(),
    };
    await conversation.save();

    // Populate sender and repliedTo so normalizeMessage can serialize them safely.
    const populated = await Message.findById(saved._id)
        .populate("sender", "username profilePicture _id")
        .populate({
            path: "repliedTo",
            select: "content sender messageType",
            populate: { path: "sender", select: "username profilePicture _id" },
        })
        .lean<IMessagePopulated>();

    if (!populated) throw new Error("Failed to retrieve saved message");
    return populated;
}

export async function updateMessageReaction({ messageId, emoji, userId }: { messageId: string; emoji: string; userId: string }) {
    const msg = await Message.findById(messageId).select("reactions");
    if (!msg) return null;

    const userObjectId = new Types.ObjectId(userId);
    let alreadyReactedWithSameEmoji = false;

    if (msg.reactions instanceof Map) {
        const users = msg.reactions.get(emoji) || [];
        alreadyReactedWithSameEmoji = users.some(
            (uid: Types.ObjectId) => uid.toString() === userObjectId.toString()
        );
    }

    const pullUpdate: Record<string, Types.ObjectId> = {};
    if (msg.reactions instanceof Map) {
        for (const key of msg.reactions.keys()) {
            pullUpdate[`reactions.${key}`] = userObjectId;
        }
    }

    if (Object.keys(pullUpdate).length > 0) {
        await Message.updateOne({ _id: messageId }, { $pull: pullUpdate });
    }

    if (!alreadyReactedWithSameEmoji) {
        await Message.updateOne(
            { _id: messageId },
            { $addToSet: { [`reactions.${emoji}`]: userObjectId } }
        );
    }

    const updated = await Message.findById(messageId)
        .populate([
            { path: "sender", select: "username avatarUrl" },
            { path: "repliedTo", populate: { path: "sender" } },
        ])
        .lean();
    return updated;
}
export async function editMessageById(messageId: string, text: string) {
    const msg = await Message.findById(messageId);
    if (!msg) return null;

    msg.content = text;
    msg.isEdited = true;
    await msg.save();

    // Populate 
    const updated = await Message.findById(messageId)
        .populate([
            { path: "sender", select: "username avatarUrl" },
            { path: "repliedTo", populate: { path: "sender" } },
        ])
        .lean();

    return updated;
}
