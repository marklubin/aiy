import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import MessageContextBuilder from "./MessageContextBuilder.js";
import prepareOpenAIRequest from "./prepareOpenAIRequest.js";
import S3FileCache from "./S3FileCache.js";
import DDBRollingWindowMessageCache from "./DDBRollingWindowMessageCache.js";
import { queryPinecone } from "./pinecone.js";
import path from 'path';

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.join(__dirname, '..', '..');

// Load .env from monorepo root
dotenv.config({ path: path.join(rootPath, '.env') });

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY, // ✅ Corrected API Key Variable
});

// ✅ Create cache instances
const instructionsCache = new S3FileCache(process.env.S3_BUCKET, 3600);
const rollingWindowCache = new DDBRollingWindowMessageCache(
  "AIYMessages",
  "user_456",
  "default_segment"
);

// ✅ Preload rolling window cache
await rollingWindowCache.preload();

/**
 * ✅ WebSocket Server - Uses `MessageContextBuilder` Correctly
 */
const wss = new WebSocketServer({ server });



async function storeMessagesInDynamoDB(userMessage, assistantMessage) {
    try {
        console.log("📝 Storing messages in DynamoDB...");

        await rollingWindowCache.storeMessage({ role: "user", content: userMessage });
        await rollingWindowCache.storeMessage({ role: "assistant", content: assistantMessage });

        console.log("✅ Messages successfully stored in DynamoDB.");
    } catch (error) {
        console.error("❌ Failed to store messages in DynamoDB:", error);
    }
}

wss.on("connection", (ws) => {
  console.log("🟢 Client connected to WebSocket");

  ws.on("message", async (message) => {
    try {
        const parsedMessage = JSON.parse(message.toString());

        console.log("📥 Received WebSocket Message:", parsedMessage);

        if (!parsedMessage.messages || !Array.isArray(parsedMessage.messages)) {
            ws.send("Error: Invalid messages format.");
            return;
        }

        console.log("📨 Messages Array:", parsedMessage.messages);

        // ✅ Extract last user message
        const lastUserMessage = parsedMessage.messages.filter(msg => msg.role === "user").pop()?.content;

        if (!lastUserMessage) {
            ws.send("Error: No valid user message found.");
            return;
        }

        console.log("🔍 User Query for Context:", lastUserMessage);

        // ✅ Build context
        const contextBuilder = new MessageContextBuilder({
            rollingWindowCache,
            queryPinecone,
            fileCache: instructionsCache,
            userId: "user_456",
            segmentId: "default_segment",
        });

        const messageContext = await contextBuilder.buildContext(lastUserMessage);
        console.log("📜 Generated Message Context:", messageContext);

        // ✅ Prepare OpenAI request
        const openAIRequest = prepareOpenAIRequest(parsedMessage.messages, messageContext); // ✅ Properly structured request

        console.log("🚀 Sending OpenAI-Compatible Request:", openAIRequest);

        // ✅ Call OpenAI API (or compatible backend)
        const response = await openai.chat.completions.create({
            messages: openAIRequest,
            stream: true,
            model: "gpt-4",
        });

        let assistantResponse = ""; // ✅
        // ✅ Stream response character by character
        for await (const part of response) {
            const chunk = part.choices[0]?.delta?.content || "";
            ws.send(chunk);
            assistantResponse += chunk;
            await new Promise((res) => setTimeout(res, 50));
        }

        ws.send("__END__");
        storeMessagesInDynamoDB(lastUserMessage, assistantResponse);
    } catch (error) {
        console.error("❌ WebSocket Error:", error);
        ws.send("Error: Failed to process message.");
    }
});
  ws.on("close", () => console.log("🔴 Client disconnected"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 WebSocket Server running on port ${PORT}`));