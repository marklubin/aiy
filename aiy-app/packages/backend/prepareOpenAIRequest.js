/**
 * Converts a generic AI context object into OpenAI's chat completion format.
 * @param {Array} messages - The conversation history including user messages.
 * @param {Object} context - The structured AI interaction context.
 * @returns {Array} messagesPayload - Formatted messages array for OpenAI API.
 */
export default function prepareOpenAIRequest(messages, context) {
    if (!context.system_instructions) {
        throw new Error("Missing system instructions in context object.");
    }

    if (!context.context_usage_instructions) {
        throw new Error("Missing context usage instructions in context object.");
    }

    // Extract the last user message from the messages array
    const lastUserMessage = messages.filter(msg => msg.role === "user").pop();

    if (!lastUserMessage) {
        throw new Error("No valid user message found in messages array.");
    }

    // Construct OpenAI message payload
    const messagesPayload = [
        { role: "system", content: context.system_instructions },
        { role: "system", content: `=== Context Usage Guide ===\n${context.context_usage_instructions}\n============================` },
        ...(context.retrieved_context?.length > 0 ? [{
            role: "system",
            content: `=== Retrieved Context ===\n${context.retrieved_context.map(item => `• ${item.content}`).join('\n')}\n=========================`
        }] : []),
        ...context.rolling_window,
        lastUserMessage // ✅ Inject the latest user message into the payload
    ];

    return messagesPayload;
}