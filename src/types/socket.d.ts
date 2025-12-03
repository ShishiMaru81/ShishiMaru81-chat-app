//import { Server as HttpServer } from "http";
import { Server as IOServer, Socket as IOSocket } from "socket.io";
import {
    ServerToClientEvents,
    ClientToServerEvents,
} from "../server/socket/types/SocketEvents";

declare global {
    // ============================
    // Typed Socket.IO Server
    // ============================
    var io: SocketIOServer | undefined;

    interface SocketIOServer
        extends IOServer<ClientToServerEvents, ServerToClientEvents> { }

    // ============================
    // Typed Socket.IO Socket
    // ============================
    interface TypedSocket
        extends IOSocket<ClientToServerEvents, ServerToClientEvents> {
        data: {
            user: {
                _id: string;
                email: string;
                name?: string;
            };
        };
    }
}

export { };