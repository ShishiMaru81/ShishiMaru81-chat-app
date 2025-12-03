// src/store/useSocketStore.ts
"use client";

import { create } from "zustand";
import { socket } from "@/lib/socket/socketClient";
import { IMessagePopulated } from "@/models/Message";
import {
    JoinConversationPayload,
    LeaveConversationPayload,
    SendMessagePayload,
    EditMessagePayload,
    DeleteMessagePayload,
    ReactMessagePayload,
    TypingPayload,
    MessageDeletedPayload,
    TypingUpdatePayload,
    PresenceUpdatePayload,
} from "@/types/socket";
import { useConversationStore } from "./conversation-store";

interface SocketState {
    connected: boolean;
    currentConversationId: string | null;
    onlineUsers: Set<string>;
    typingUsers: Record<string, Set<string>>; // conversationId -> set<userId>

    connect: () => void;
    disconnect: () => void;
    joinConversation: (payload: JoinConversationPayload) => void;
    leaveConversation: (payload: LeaveConversationPayload) => void;
    sendMessage: (payload: SendMessagePayload) => void;
    editMessage: (payload: EditMessagePayload) => void;
    deleteMessage: (payload: DeleteMessagePayload) => void;
    reactToMessage: (payload: ReactMessagePayload) => void;
    startTyping: (payload: TypingPayload) => void;
    stopTyping: (payload: TypingPayload) => void;
}

const useSocketStore = create<SocketState>((set, get) => {
    // Attach listeners only once
    if (!socket.hasListeners("connect")) {
        socket.on("connect", () => {
            set({ connected: true });
        });

        socket.on("disconnect", () => {
            set({ connected: false });
        });

        // ----- message:new -----
        socket.on("message:new", (message: IMessagePopulated) => {
            useConversationStore.getState().addMessage(message);
        });

        // ----- message:updated (edit) -----
        socket.on("message:updated", (message: IMessagePopulated) => {
            useConversationStore.getState().updateMessage(message);
        });

        // ----- message:deleted -----
        socket.on(
            "message:deleted",
            ({ messageId, conversationId }: MessageDeletedPayload) => {
                useConversationStore.getState().removeMessage(messageId);
            }
        );

        // ----- message:reaction:updated -----
        socket.on(
            "message:reaction:updated",
            (message: IMessagePopulated) => {
                useConversationStore.getState().updateMessage(message);
            }
        );

        // ----- typing:update -----
        socket.on(
            "typing:update",
            ({ conversationId, userId, isTyping }: TypingUpdatePayload) => {
                set((state) => {
                    const current = new Map(
                        Object.entries(state.typingUsers).map(([cid, setUsers]) => [
                            cid,
                            new Set(setUsers),
                        ])
                    );

                    const setForConv = current.get(conversationId) || new Set<string>();

                    if (isTyping) {
                        setForConv.add(userId);
                    } else {
                        setForConv.delete(userId);
                    }

                    current.set(conversationId, setForConv);

                    const obj: Record<string, Set<string>> = {};
                    current.forEach((v, k) => (obj[k] = v));

                    return { typingUsers: obj };
                });
            }
        );

        // ----- presence:update -----
        socket.on("presence:update", ({ userId, status }: PresenceUpdatePayload) => {
            set((state) => {
                const online = new Set(state.onlineUsers);
                if (status === "online") online.add(userId);
                else online.delete(userId);
                return { onlineUsers: online };
            });
        });
    }

    return {
        connected: false,
        currentConversationId: null,
        onlineUsers: new Set(),
        typingUsers: {},

        connect: () => {
            if (!socket.connected) socket.connect();
        },

        disconnect: () => {
            if (socket.connected) socket.disconnect();
        },

        joinConversation: ({ conversationId }) => {
            const prev = get().currentConversationId;
            if (prev && prev !== conversationId) {
                socket.emit("conversation:leave", { conversationId: prev });
            }

            socket.emit("conversation:join", { conversationId });
            set({ currentConversationId: conversationId });
        },

        leaveConversation: ({ conversationId }) => {
            socket.emit("conversation:leave", { conversationId });
            set({ currentConversationId: null });
        },

        sendMessage: (payload) => {
            socket.emit("message:send", payload);
            // Optional: optimistic add using tempId
            // useChatStore.getState().addOptimisticMessage(payload);
        },

        editMessage: (payload) => {
            socket.emit("message:edit", payload);
        },

        deleteMessage: (payload) => {
            socket.emit("message:delete", payload);
            // Optional optimistic remove:
            useConversationStore.getState().removeMessage(payload.messageId);
        },

        reactToMessage: (payload) => {
            socket.emit("message:react", payload);
        },

        startTyping: (payload) => {
            socket.emit("typing:start", payload);
        },

        stopTyping: (payload) => {
            socket.emit("typing:stop", payload);
        },
    };
});

export default useSocketStore;