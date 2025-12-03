import Message from "@/models/Message";
import mongoose from "mongoose";

export async function markDelivered(messageId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) return null;

    await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deliveredTo: userId },
    });

    const msg = await Message.findById(messageId)
        .populate("sender")
        .populate("conversation");

    return msg;
}