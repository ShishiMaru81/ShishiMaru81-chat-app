import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Message from "@/models/Message";
import { getAuthUser } from "@/lib/utils/auth/getAuthUser";
import { emitToSocketServer } from "@/server/socket/emit"; // ✅ your server emitter
import { SocketEvents } from "@/shared/types/SocketEvents";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: messageId } = await context.params;

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
        }

        const seenAt = new Date();

        await Message.updateOne(
            { _id: messageId, "seenBy.userId": { $ne: user.id } },
            { $push: { seenBy: { userId: user.id, at: seenAt } } }
        );

        //emit from server transport layer
        emitToSocketServer(SocketEvents.MESSAGE_SEEN_UPDATE, {
            messageId,
            userId: user.id,
            at: seenAt,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("PATCH /api/messages/:id/seen error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}