'use client';

import { useEffect } from "react";
import { socket, registerGlobalSocketListeners } from "@/lib/socket/socketClient";
import { useUser } from "@/context/UserContext";
import { useSocketPresence } from "@/lib/hooks/useSocketPresence";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const isOnline = useNetworkStatus();
    useSocketPresence(user?._id ?? null);

    useEffect(() => {
        if (!user?._id) return;

        socket.auth = { userId: user._id };
        socket.connect();

        registerGlobalSocketListeners();

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

    useEffect(() => {
        if (!user?._id) return;

        const ensureConnected = () => {
            if (!isOnline) return;
            if (!socket.connected) {
                socket.connect();
            }
        };

        const handleDisconnect = (reason: string) => {
            if (reason === "io server disconnect") {
                setTimeout(ensureConnected, 1200);
            }
        };

        const handleConnectError = () => {
            setTimeout(ensureConnected, 1500);
        };

        if (isOnline) {
            ensureConnected();
        }

        const reconnectInterval = setInterval(() => {
            ensureConnected();
        }, 5000);

        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);

        return () => {
            clearInterval(reconnectInterval);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
        };
    }, [user?._id, isOnline]);

    return children;
}