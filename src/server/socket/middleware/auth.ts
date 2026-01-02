import { Socket } from "socket.io";

export function socketAuth(socket: Socket, next: Function) {
    const { userId, isAdmin } = socket.handshake.auth;
    socket.data.userId = userId || socket.id;
    socket.data.isAdmin = Boolean(isAdmin);

    next();
}