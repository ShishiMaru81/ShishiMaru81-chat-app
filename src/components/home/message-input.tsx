'use client';
import { Laugh, Mic, Plus, Send } from "lucide-react";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { getMe } from "@/lib/api";
//import { socket } from "@/lib/socketClient";
import { useConversationStore } from "@/store/chat-store";
import { socket } from "@/lib/socketClient";
import { IUser } from "@/models/User";




const MessageInput = () => {
    const [msgText, setMsgText] = useState("");
    const [me, setMe] = useState<IUser | null>(null);
    const addMessage = useConversationStore(s => s.addMessage);
    const sel = useConversationStore(s => s.selectedConversation);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await getMe();
                setMe(response);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchMe();
    }, []);
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgText || !me) return;
        // console.log("Sending message:", {
        //     content: msgText,
        //     conversationId: sel?._id,
        //     senderId: me?._id,
        // });

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: msgText,
                    conversationId: sel?._id,
                    senderId: me._id,
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            const message = await res.json();
            addMessage(message);
            socket.emit("message:send", message);
            // Local update (Socket.IO will broadcast too)
            setMsgText("");
        } catch (err) {
            console.error("Send message failed:", err);
        }

    }

    return (
        <div className='bg-gray-primary p-2 flex gap-4 items-center'>
            <div className='relative flex gap-2 ml-2'>
                {/* EMOJI PICKER WILL GO HERE */}
                <Laugh className='text-gray-600 dark:text-gray-400' />
                <Plus className='text-gray-600 dark:text-gray-400' />
            </div>
            <form className='w-full flex gap-3' onSubmit={handleSendMessage}>
                <div className='flex-1'>
                    <Input
                        type='text'
                        placeholder='Type a message'
                        className='py-2 text-sm w-full rounded-lg shadow-sm bg-[hsl(var(--gray-tertiary))] focus-visible:ring-transparent'
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                    />
                </div>
                <div className='mr-4 flex items-center gap-3'>
                    {msgText.length > 0 ? (
                        <Button
                            type='submit'
                            size={"sm"}
                            className='bg-transparent text-[hsl(var(--foreground))] hover:bg-transparent'
                        >
                            <Send />
                        </Button>
                    ) : (
                        <Button
                            type='submit'
                            size={"sm"}
                            className='bg-transparent text-[hsl(var(--foreground))] hover:bg-transparent'
                        >
                            <Mic />
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};
export default MessageInput;