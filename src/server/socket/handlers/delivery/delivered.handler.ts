// src/server/socket/handlers/delivery/delivered.handler.ts
import type { Server as IOServer } from "socket.io";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    MessageDeliveredPayload,
    //SocketEvents,
} from "@/server/socket/types/SocketEvents";
import { markDelivered } from "@/lib/services/delivery.service";

type IO = IOServer<ClientToServerEvents, ServerToClientEvents>;
type Socket = import("socket.io").Socket<
    ClientToServerEvents,
    ServerToClientEvents
>;

export function deliveredHandler(_io: IO, socket: Socket) {
    socket.on(
        "message:delivered",
        async ({ messageId, conversationId }: MessageDeliveredPayload) => {
            const userId = socket.data.user._id;

            await markDelivered(messageId, userId);

            socket.to(conversationId).emit("message:delivered:update", {
                messageId,
                //conversationId,
                userId,
                deliveredAt: new Date(),
            });
        },
    );
}