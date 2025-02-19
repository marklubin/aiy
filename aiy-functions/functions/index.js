import axios from 'axios';
import cors from 'cors'; // Import CORS middleware
import { z } from 'zod';
import { onRequest } from 'firebase-functions/v2/https'; // Switch to onRequest for CORS flexibility
import admin from 'firebase-admin';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import { HttpsError } from 'firebase-functions/v2/https';

// Initialize the CORS middleware with permissive settings (restrict origin in production)
const corsHandler = cors({ origin: true });


async function getAPIKey() {
    return process.env.OPEN_AI_API_KEY;
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
    onRequest(async (req, res) => {
        // Use CORS middleware to handle preflight requests
        corsHandler(req, res, async () => {
            try {
                // Log the request body for debugging
                console.log('Incoming request:', req.body);

                // Validate the input using the Zod schema
                const validatedInput = CompletionRequestSchema.parse(req.body);

                // Prepare messages for the OpenAI API request
                const messagesPayload = validatedInput.messages ||
                    (validatedInput.prompt
                        ? [{ role: "user", content:
                                Array.isArray(validatedInput.prompt)
                                    ? validatedInput.prompt.join('\n')
                                    : validatedInput.prompt
                        }]
                        : []);

                // Construct payload exactly matching OpenAI API specification
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

                const apiKey = await getAPIKey();

                // Make the request to OpenAI API
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

                // Return the response back to the client
                res.status(200).json({
                    id: openaiResponse.data.id || `chatcmpl-${Date.now()}`,
                    object: "chat.completion",
                    created: Math.floor(Date.now() / 1000),
                    model: openaiResponse.data.model || validatedInput.model,
                    choices: openaiResponse.data.choices.map((choice, index) => ({
                        index,
                        ...choice
                    }))
                });
            } catch (error) {
                console.error('Error:', error);

                // Respond with appropriate error
                const statusCode = error.response?.status || 400;
                const errorMessage = error.response?.data?.message || error.message;
                res.status(statusCode).json({
                    error: errorMessage
                });
            }
        });
    });