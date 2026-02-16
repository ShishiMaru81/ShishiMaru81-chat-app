//import { Server as HttpServer } from "http";
import { Server as IOServer, Socket as IOSocket } from "socket.io";
import {
    ServerToClientEvents,
    ClientToServerEvents,
} from "../shared/types/SocketEvents";

declare global {

    var io: SocketIOServer | undefined;

    interface SocketIOServer
        extends IOServer<ClientToServerEvents, ServerToClientEvents> { }

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