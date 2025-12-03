const onlineUsers = new Map<string, string>(); // userId → socketId

export function setOnline(userId: string, socketId: string) {
    onlineUsers.set(userId, socketId);
}

export function setOffline(userId: string) {
    onlineUsers.delete(userId);
}

export function isOnline(userId: string) {
    return onlineUsers.has(userId);
}

export function getOnlineUsers() {
    return Array.from(onlineUsers.keys());
}