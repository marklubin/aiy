import axios from 'axios';
import { z } from 'zod';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import admin from 'firebase-admin';
import { getRemoteConfig } from 'firebase-admin/remote-config';






function getAPIKey(){
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const remoteConfig = getRemoteConfig();
    const apiKey = remoteConfig.getString('openai_api_key');
    if (!apiKey) {
        throw new HttpsError('failed-precondition', 'OpenAI API key is not configured');
    }

    return apiKey;
}


// Comprehensive Zod schema matching OpenAI API request format
const CompletionRequestSchema = z.object({
    model: z.string().default("gpt-3.5-turbo"),
    prompt: z.union([z.string(), z.array(z.string())]).optional(),
    messages: z.array(z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string()
    })).optional(),
    max_tokens: z.number().int().min(1).max(4096).optional().default(150),
    temperature: z.number().min(0).max(2).optional().default(1),
    top_p: z.number().min(0).max(1).optional(),
    n: z.number().int().min(1).max(128).optional().default(1),
    stream: z.boolean().optional().default(false),
    stop: z.union([z.string(), z.array(z.string())]).optional(),
    presence_penalty: z.number().min(-2.0).max(2.0).optional(),
    frequency_penalty: z.number().min(-2.0).max(2.0).optional()
});

export const createChatCompletion =
    onCall({
            memory: '1GB',
            timeoutSeconds: 540,
        },
        async (data, context) => {
            try {
                // Validate input against OpenAI-like schema
                const validatedInput = CompletionRequestSchema.parse(data);

                // Prepare messages for API call
                const messagesPayload = validatedInput.messages ||
                    (validatedInput.prompt
                        ? [{ role: "user", content:
                                Array.isArray(validatedInput.prompt)
                                    ? validatedInput.prompt.join('\n')
                                    : validatedInput.prompt
                        }]
                        : []);

                // Construct payload exactly matching OpenAI API
                const payload = {
                    model: validatedInput.model,
                    messages: messagesPayload,
                    max_tokens: validatedInput.max_tokens,
                    temperature: validatedInput.temperature,
                    n: validatedInput.n,
                    stream: validatedInput.stream,
                    ...(validatedInput.top_p && { top_p: validatedInput.top_p }),
                    ...(validatedInput.stop && { stop: validatedInput.stop }),
                    ...(validatedInput.presence_penalty && { presence_penalty: validatedInput.presence_penalty }),
                    ...(validatedInput.frequency_penalty && { frequency_penalty: validatedInput.frequency_penalty })
                };

                const apiKey = getAPIKey();

                // Make request to OpenAI API
                const openaiResponse = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                // Return exact same response structure as OpenAI API
                return {
                    id: openaiResponse.data.id || `chatcmpl-${Date.now()}`,
                    object: "chat.completion",
                    created: Math.floor(Date.now() / 1000),
                    model: openaiResponse.data.model || validatedInput.model,
                    choices: openaiResponse.data.choices.map((choice, index) => ({
                        index,
                        message: choice.message,
                        finish_reason: choice.finish_reason || "stop"
                    })),
                    usage: openaiResponse.data.usage || {
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0
                    }
                };

            } catch (error) {


                // Detailed error handling
                if (error instanceof z.ZodError) {
                    throw new HttpsError('invalid-argument', 'Invalid input', {
                        issues: error.issues
                    });
                }

                if (axios.isAxiosError(error)) {
                    console.error('Axios error:', error);
                    throw new HttpsError('internal', 'API request failed', {
                        details: error.response?.data || error.message
                    });
                }

                console.error('Unexpected error:', error);
                throw new HttpsError('internal', 'An unexpected error occurred');
            }
        });