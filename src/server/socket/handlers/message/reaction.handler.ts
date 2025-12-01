// src/server/socket/handlers/message/reaction.handler.ts
import { updateMessageReaction } from "@/lib/services/message.service";
import { Server, Socket } from "socket.io";

export default function reactionHandler(io: Server, socket: Socket) {
    socket.on("message:react", async (payload) => {
        const msg = await updateMessageReaction(payload);
        if (!msg) return;

        io.to(msg.conversationId.toString()).emit("message:reaction:updated", msg);
    });
}