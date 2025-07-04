import { Schema, model, models, Document, Types } from "mongoose";


export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
    status: 'online' | 'offline' | 'busy';
    lastSeen: Date;
    conversations: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for OAuth users
    profilePicture: { type: String },
    status: { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    conversations: [{ type: Schema.Types.ObjectId, ref: 'Conversation' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const User = models.User || model<IUser>("User", userSchema);