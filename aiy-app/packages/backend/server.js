// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from "url";
import DependencyContainer from './dependencyContainer.js';
import WebSocketHandler from './websocketHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.join(__dirname, '..', '..');
dotenv.config({ path: path.join(rootPath, '.env') });

async function startServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    const container = new DependencyContainer();
    await container.initialize();

    const handler = new WebSocketHandler(container.getDependencies());

    wss.on("connection", (ws) => {
        console.log("🟢 Client connected to WebSocket");
        ws.on("message", async (message) => handler.handleMessage(message, ws));
        ws.on("close", () => console.log("🔴 Client disconnected"));
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`🚀 WebSocket Server running on port ${PORT}`));
}

startServer().catch(console.error);