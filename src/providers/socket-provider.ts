'use client';

import { useEffect } from "react";
import { socket, registerGlobalSocketListeners } from "@/lib/socket/socketClient";
import { useUser } from "@/context/UserContext";

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();

    useEffect(() => {
        if (!user?._id) return;

        socket.auth = { userId: user._id };
        socket.connect();

        registerGlobalSocketListeners();

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

    return children;
}