"use client"

import { useState, useEffect, useRef } from 'react'
import { initializeApp } from "firebase/app"
import { firebaseConfig } from "@/lib/firebase";
import ChatMessage from "@/components/ChatMessage";
import { Message } from "@/lib/types";

// Main Chat component
export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const ENDPOINT = "http://127.0.0.1:5001/aiy-chat-e9077/us-central1/createChatCompletio";
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Auto-scnopmroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            role: "user",
            timestamp: Date.now(),
        };

        setMessages([...messages, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();
            const assistantMessage: Message = {
                id: Date.now().toString(),
                text: data.reply,
                role: "assistant",
                timestamp: Date.now(),
            };

            setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Chat</h2>
                <span className="online-indicator">
                    {isLoading ? 'Typing...' : 'Online'}
                </span>
            </div>

            <div className="messages-container">
                {messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                        isUser={message.role === "user"}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
}