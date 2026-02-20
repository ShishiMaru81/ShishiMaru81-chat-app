import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./socket/index.js";
import { emitToConversation } from "./socket/emit.js";
import { SocketEvents } from "../shared/types/SocketEvents.js";


const app = express();
app.use(cors({
    origin: process.env.ORIGIN,
}));
app.use(express.json());

const server = http.createServer(app);

await initSocket(server);


app.post("/internal/message-deleted", (req, res) => {
    console.log("🔌 internal/message-deleted", req.body);
    const { conversationId, payload } = req.body;

    if (!conversationId || !payload) {
        return res.status(400).json({ error: "Invalid payload" });
    }

    emitToConversation(conversationId, SocketEvents.MESSAGE_DELETE, payload);

    return res.json({ success: true });
})
app.post("/internal/message-reaction", (req, res) => {
    const { conversationId, payload } = req.body;

    emitToConversation(conversationId, "message:reaction", payload);

    res.json({ success: true });
});

server.listen(3001, () => {
    console.log("🚀 Server running on http://localhost:3001");
});