// websocketHandler.js
import MessageContextBuilder from './MessageContextBuilder.js';
import prepareOpenAIRequest from './prepareOpenAIRequest.js';

class WebSocketHandler {
    constructor(dependencies) {
        this.openai = dependencies.openai;
        this.rollingWindowCache = dependencies.rollingWindowCache;
        this.instructionsCache = dependencies.instructionsCache;
        this.pineconeClient = dependencies.pineconeClient;
    }

    async handleMessage(message, ws) {
        try {
            const parsedMessage = JSON.parse(message.toString());
            if (!parsedMessage.messages || !Array.isArray(parsedMessage.messages)) {
                ws.send("Error: Invalid messages format.");
                return;
            }

            const lastUserMessage = parsedMessage.messages.filter(msg => msg.role === "user").pop();
            if (!lastUserMessage) {
                ws.send("Error: No valid user message found.");
                return;
            }

            const contextBuilder = new MessageContextBuilder({
                rollingWindowCache: this.rollingWindowCache,
                pineconeClient: this.pineconeClient,
                fileCache: this.instructionsCache,
                userId: "user_456",
                segmentId: "default_segment"
            });

            const messageContext = await contextBuilder.buildContext(parsedMessage.messages);
            const openAIRequest = prepareOpenAIRequest(parsedMessage.messages, messageContext);

            const response = await this.openai.chat.completions.create({
                messages: openAIRequest,
                stream: true,
                model: "gpt-4",
            });

            let assistantResponse = "";
            for await (const part of response) {
                const chunk = part.choices[0]?.delta?.content || "";
                ws.send(chunk);
                assistantResponse += chunk;
                await new Promise(res => setTimeout(res, 50));
            }

            ws.send("__END__");
            await this.storeMessages(lastUserMessage.content, assistantResponse);
        } catch (error) {
            console.error("❌ WebSocket Error:", error);
            ws.send("Error: Failed to process message.");
        }
    }

    async storeMessages(userMessage, assistantMessage) {
        try {
            await this.rollingWindowCache.storeMessage({ role: "user", content: userMessage });
            await this.rollingWindowCache.storeMessage({ role: "assistant", content: assistantMessage });
        } catch (error) {
            console.error("❌ Failed to store messages:", error);
        }
    }
}

export default WebSocketHandler;