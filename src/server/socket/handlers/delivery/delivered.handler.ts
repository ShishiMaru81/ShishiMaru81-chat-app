// src/server/socket/handlers/delivery/delivered.handler.ts
import type { Server as IOServer } from "socket.io";
import {
    ServerToClientEvents,
    ClientToServerEvents,
    MessageDeliveredPayload,
    SocketEvents,
} from "@/server/socket/types/SocketEvents";
import { markDelivered } from "@/lib/services/delivery.service";

type IO = IOServer<ClientToServerEvents, ServerToClientEvents>;
type Socket = import("socket.io").Socket<
    ClientToServerEvents,
    ServerToClientEvents
>;

export function deliveredHandler(io: IO, socket: Socket) {
    socket.on(
        SocketEvents.MESSAGE_DELIVERED,
        async ({ messageId, conversationId }: MessageDeliveredPayload) => {
            const userId = socket.data.user._id;

            const updated = await markDelivered(messageId, userId);

            io.to(conversationId).emit(SocketEvents.MESSAGE_DELIVERED, {
                messageId,
                conversationId,
                userId,
                at: new Date(),
            });
        },
    );
}