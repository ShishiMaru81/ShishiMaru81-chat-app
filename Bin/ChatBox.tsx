// // src/components/ChatBox.tsx
// "use client";

// import { socket } from "@/lib/socket/socketClient";
// import { useEffect, useState } from "react";


// export default function ChatBox() {
//     const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
//     const [input, setInput] = useState("");

//     useEffect(() => {
//         fetch("/api/messages")
//             .then((res) => res.json())
//             .then((data) => {
//                 if (data.success) setMessages(data.messages.reverse());
//             });

//         socket.on("message:new", (msg) => {
//             const message = msg.message;
//             setMessages((prev) => [...prev, { 
//                 sender: typeof message.sender === 'object' && 'username' in message.sender 
//                     ? message.sender.username 
//                     : 'Unknown',
//                 content: message.content 
//             }]);
//         });

//         return () => {
//             socket.off("message:new");
//         };
//     }, []);

//     const sendMessage = async () => {
//         const newMessage = { sender: "You", content: input };

//         setMessages((prev) => [...prev, newMessage]);

//         socket.emit("message:new", { conversationId: "default", message: newMessage });

//         await fetch("/api/messages", {
//             method: "POST",
//             body: JSON.stringify(newMessage),
//             headers: { "Content-Type": "application/json" },
//         });

//         setInput("");
//     };

//     return (
//         <div>
//             <div className="h-[300px] overflow-y-scroll border p-2">
//                 {messages.map((msg, i) => (
//                     <p key={i}><strong>{msg.sender}:</strong> {msg.content}</p>
//                 ))}
//             </div>
//             <input
//                 className="border w-full p-2 mt-2"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//                 placeholder="Type a message"
//             />
//         </div>
//     );
// }
