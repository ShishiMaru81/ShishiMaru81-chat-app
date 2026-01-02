import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./socket/index.js";


const app = express();
app.use(cors());

const server = http.createServer(app);

await initSocket(server);

server.listen(3001, () => {
    console.log("🚀 Server running on http://localhost:3001");
});