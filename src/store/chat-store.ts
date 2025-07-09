import { create } from "zustand";
import { Conversation, IMessage } from "@/types";

interface ChatStore {
    selectedConversation: Conversation | null;
    messages: IMessage[];
    onlineUsers: string[];
    setSelectedConversation: (c: Conversation | null) => void;
    setMessages: (msgs: IMessage[]) => void;
    addMessage: (msg: IMessage) => void;
    setOnlineUsers: (users: string[]) => void;
}

export const useConversationStore = create<ChatStore>((set) => ({
    selectedConversation: null,
    messages: [],
    onlineUsers: [],
    setSelectedConversation: (c) => set({ selectedConversation: c }),
    setMessages: (msgs) => set({ messages: msgs }),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setOnlineUsers: (users) => set({ onlineUsers: users })
}));
