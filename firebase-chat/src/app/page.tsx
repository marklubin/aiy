"use client"

import { useState, useEffect } from 'react'
import { useChat } from "@ai-sdk/react"
import { initializeApp } from "firebase/app"
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config"

import { ChatContainer, ChatForm, ChatMessages } from "@/components/ui/chat"
import { MessageInput } from "@/components/ui/message-input"
import { MessageList } from "@/components/ui/message-list"

// Firebase configuration
const firebaseConfig = {
    projectId: "aiy-chat-e9077",
    // Add other necessary config details
}

export default function ChatDemo() {
    const [chatEndpoint, setChatEndpoint] = useState<string | null>(null)

    // Initialize Firebase
    const app = initializeApp(firebaseConfig)

    // Fetch endpoint from Remote Config or use local emulator
    useEffect(() => {
        async function determineChatEndpoint() {
            // Check if in development environment
            const isDevelopment = process.env.NODE_ENV === 'development'

            if (isDevelopment) {
                // Local Firebase Functions Emulator endpoint
                setChatEndpoint('http://localhost:5001/aiy-chat-e9077/us-central1/chatCompletion')
                return
            }

            try {
                const remoteConfig = getRemoteConfig(app)

                // Configure fetch settings
                remoteConfig.settings = {
                    minimumFetchIntervalMillis: 3600000, // 1 hour
                    fetchTimeoutMillis: 60000 // 1 minute timeout
                }

                // Fetch and activate remote config
                await fetchAndActivate(remoteConfig)

                // Get the specific value for chat endpoint
                const endpointValue = getValue(remoteConfig, 'CHAT_COMPLETION_ENDPOINT')

                const productionEndpoint = endpointValue.asString()

                if (!productionEndpoint) {
                    throw new Error('No endpoint found in Remote Config')
                }

                setChatEndpoint(productionEndpoint)
            } catch (error) {
                console.error('Failed to fetch chat endpoint:', error)
                // Optionally, you could add a hard-coded production fallback
                setChatEndpoint('https://us-central1-aiy-chat-e9077.cloudfunctions.net/chatCompletion')
            }
        }

        determineChatEndpoint()
    }, [])

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        stop,
        isLoading,
    } = useChat({
        // Only use endpoint when it's available
        api: chatEndpoint || undefined,
        headers: {
            'Content-Type': 'application/json',
        }
    })

    const lastMessage = messages.at(-1)
    const isEmpty = messages.length === 0
    const isTyping = lastMessage?.role === "user"

    // Prevent rendering chat if endpoint is not loaded
    if (!chatEndpoint) {
        return <div>Loading chat...</div>
    }

    return (
        <ChatContainer>
            {!isEmpty ? (
                <ChatMessages>
                    <MessageList messages={messages} isTyping={isTyping} />
                </ChatMessages>
            ) : null}

            <ChatForm
                className="mt-auto"
                isPending={isLoading || isTyping}
                handleSubmit={handleSubmit}
            >
                {({ files, setFiles }) => (
                    <MessageInput
                        value={input}
                        onChange={handleInputChange}
                        allowAttachments
                        files={files}
                        setFiles={setFiles}
                        stop={stop}
                        isGenerating={isLoading}
                    />
                )}
            </ChatForm>
        </ChatContainer>
    )
}