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
    

    async buildContext(searchText) {
        await Promise.all([
            this.fetchRequiredFiles(),
            this.rollingWindowCache.preload()
        ]);
        return {
            session_id: this.sessionId,
            user_id: this.userId,
            segment_id: this.segmentId,
            timestamp: this.timestamp,
            system_instructions: this.systemInstructions,
            context_usage_instructions: this.contextUsageInstructions,
            rolling_window: this.rollingWindowCache.getMessages(),
            retrieved_context: this.pineconeResults,
            user_context: this.userContext
        };
    }
}

export default MessageContextBuilder;