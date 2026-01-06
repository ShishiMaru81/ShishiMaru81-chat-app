// src/server/socket/handlers/typing/typing.handler.ts
import type { Server as IOServer } from "socket.io";
import {
    ServerToClientEvents,
    ClientToServerEvents,
    //TypingStartPayload,
    // TypingStopPayload,
    SocketEvents,
} from "@/server/socket/types/SocketEvents";

type IO = IOServer<ClientToServerEvents, ServerToClientEvents>;
type Socket = import("socket.io").Socket<
    ClientToServerEvents,
    ServerToClientEvents
>;

export function typingHandler(io: IO, socket: Socket) {
    socket.on(SocketEvents.TYPING_START, (payload) => {

        const { conversationId } = payload;

        socket.to(conversationId).emit(SocketEvents.TYPING_START, {
            conversationId,
            userId: socket.data.user._id,
        });
    });

    socket.on(SocketEvents.TYPING_STOP, (payload) => {
        const { conversationId } = payload;

        socket.to(conversationId).emit(SocketEvents.TYPING_STOP, {
            conversationId,
            userId: socket.data.user._id,
        });
    });
}