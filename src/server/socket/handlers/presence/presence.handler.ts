// src/server/socket/handlers/presence/presence.handler.ts
import { userConnected, userDisconnected } from "@/lib/services/presence.service";
import { Socket, Server } from "socket.io";

export default function presenceHandler(io: Server, socket: Socket) {
    socket.on("user:online", (userId: string) => {
        socket.data.userId = userId;
        userConnected(userId, socket.id);

        io.emit("user:online", userId);
    });

    socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (!userId) return;

        userDisconnected(userId, socket.id);

        if (!userDisconnected(userId, socket.id)) {
            io.emit("user:offline", userId);
        }
    });
}