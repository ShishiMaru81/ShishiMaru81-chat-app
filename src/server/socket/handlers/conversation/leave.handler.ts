import { Server, Socket } from "socket.io";
import { SocketEvents } from "@/server/socket/types/SocketEvents";

export function LeaveHandler(io: Server, socket: Socket) {
    socket.on(SocketEvents
        .CONVERSATION_LEAVE, (payload) => {
            const { conversationId } = payload;
            if (!conversationId) return;
            socket.leave(`conversation:${conversationId}`);
        }
    )
}
