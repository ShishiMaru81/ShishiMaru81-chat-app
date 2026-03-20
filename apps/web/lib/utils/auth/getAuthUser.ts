import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/Db/db";
import { User } from "@/models/User";
import { authOptions } from "./auth";

export type AuthUser = {
    id: string;
    email: string;
    role: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const sessionId = session.user.id ? String(session.user.id) : "";
    const sessionEmail = session.user.email ? String(session.user.email) : "";

    if (sessionId && sessionEmail && mongoose.Types.ObjectId.isValid(sessionId)) {
        return {
            id: sessionId,
            email: sessionEmail,
            role: String(session.user.role || "user"),
        };
    }

    if (!sessionEmail) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: sessionEmail })
        .select("_id email role")
        .lean<{ _id: { toString(): string }; email: string; role?: string } | null>();

    if (!user) return null;

    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
    };
}
