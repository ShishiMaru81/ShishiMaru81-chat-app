import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Message from "@/models/Message";
import { io } from "socket.io-client";
import { getAuthUser } from "@/lib/utils/auth/getAuthUser";
import { SocketEvents } from "@/server/socket/types/SocketEvents";

export async function PATCH(
    { params }: { params: { id: string } }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        const messageId = params.id;
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
        }
        const deliveredAt = new Date();
        await Message.updateOne(
            { _id: messageId, "deliveredBy.userId": { $ne: user.id } },
            { $push: { deliveredBy: { userId: user.id, at: deliveredAt } } }
        );
        io().emit(SocketEvents.MESSAGE_DELIVERED_UPDATE, {
            messageId,
            userId: user.id,
            at: deliveredAt,
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("POST /api/messages/:id/delivered error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}