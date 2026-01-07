// src/server/socket/handlers/delivery/delivered.handler.ts
import type { Server as IOServer } from "socket.io";
import {
    type ServerToClientEvents,
    type ClientToServerEvents,
    SocketEvents,
} from "@/server/socket/types/SocketEvents";

type IO = IOServer<ClientToServerEvents, ServerToClientEvents>;
type Socket = import("socket.io").Socket<
    ClientToServerEvents,
    ServerToClientEvents
>;

export function deliveredHandler(io: IO, socket: Socket) {
    socket.on(SocketEvents.MESSAGE_DELIVERED, async ({ messageId, userId, at }) => {


        io.to(`user:${userId}`).emit(
            SocketEvents.MESSAGE_DELIVERED_UPDATE,
            { messageId, userId, deliveredAt: at }
        );
    });
}