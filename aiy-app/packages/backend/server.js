import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import MessageContextBuilder from "./MessageContextBuilder.js";
import prepareOpenAIRequest from "./prepareOpenAIRequest.js";
import path from 'path';
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.join(__dirname, '..', '..');

dotenv.config({ path: path.join(rootPath, '.env') });

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
});

const instructionsCache = new S3FileCache(process.env.S3_BUCKET, 3600);
const rollingWindowCache = new DDBRollingWindowMessageCache(
    "AIYMessages",
    "user_456",
    "default_segment"
);

await rollingWindowCache.preload();

const wss = new WebSocketServer({ server });

// MessageContextBuilder.js
import { v4 as uuidv4 } from 'uuid';

class MessageContextBuilder {
    constructor({ rollingWindowCache, queryPinecone, fileCache, userId, segmentId }) {
        if (!rollingWindowCache || !queryPinecone || !fileCache || !userId || !segmentId) {
            throw new Error("❌ Missing required dependencies.");
        }

        this.rollingWindowCache = rollingWindowCache;
        this.queryPinecone = queryPinecone;
        this.fileCache = fileCache;

        this.userId = userId;
        this.segmentId = segmentId;
        this.sessionId = uuidv4();
        this.timestamp = new Date().toISOString();
        this.messages = [];
        this.pineconeResults = [];
        this.systemInstructions = null;
        this.contextUsageInstructions = null;
        this.userContext = {};

        this.requiredFiles = {
            systemInstructions: 'system-message.txt',
            contextUsageInstructions: 'context-usage.txt'
        };
    }

    async fetchRequiredFiles() {
        try {
            this.systemInstructions = await this.fileCache.fetchFile(this.requiredFiles.systemInstructions);
            this.contextUsageInstructions = await this.fileCache.fetchFile(this.requiredFiles.contextUsageInstructions);

            if (!this.systemInstructions || !this.contextUsageInstructions) {
                throw new Error("Missing required AI instruction files.");
            }
        } catch (error) {
            console.error("Error fetching required AI instructions:", error);
            throw new Error("Critical error: Unable to load essential AI files.");
        }
    }

    async buildContext(messages) {
        // Extract last user message for semantic search
        const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
        if (!lastUserMessage) {
            throw new Error("No valid user message found in messages array.");
        }

        await Promise.all([
            this.fetchRequiredFiles(),
            this.rollingWindowCache.preload(),
            this.querySemanticContext(lastUserMessage.content)
        ]);

        return {
            session_id: this.sessionId,
            user_id: this.userId,
            segment_id: this.segmentId,
            timestamp: this.timestamp,
            system_instructions: this.systemInstructions,
            context_usage_instructions: this.contextUsageInstructions,
            rolling_window: this.rollingWindowCache.getContextMessages(),
            retrieved_context: this.pineconeResults,
            user_context: this.userContext
        };
    }

    async querySemanticContext(searchText) {
        try {
            const searchResults = await this.queryPinecone(searchText);
            this.pineconeResults = searchResults.matches?.map(match => ({
                content: match.record.text,
                score: match.score
            })) || [];
        } catch (error) {
            console.error("Error querying Pinecone:", error);
            this.pineconeResults = [];
        }
    }
}

export default MessageContextBuilder;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 WebSocket Server running on port ${PORT}`));