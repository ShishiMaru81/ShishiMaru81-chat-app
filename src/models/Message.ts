// src/models/Message.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface IMessage extends Document {
    sender: string;
    content: string;
    timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
    sender: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default models.Message || mongoose.model<IMessage>("Message", MessageSchema);
