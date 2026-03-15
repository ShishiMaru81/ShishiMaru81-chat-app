import type { TypedSocket } from "../types.js";
export function socketAuth(
    socket: TypedSocket,
    next: (err?: Error) => void
): void {
    const { userId, isAdmin } = socket.handshake.auth as {
        userId?: string;
        isAdmin?: boolean;
    };
    if (!userId) {
        return next(new Error("Unauthorized"));
    }

    socket.data.userId = userId;
    socket.data.isAdmin = Boolean(isAdmin);

    next();
}