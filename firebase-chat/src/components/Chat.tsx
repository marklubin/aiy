import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import { Message } from "@/lib/types";

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            text: newMessage,
            role: "user",
            timestamp: Date.now(),
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Chat</h2>
                <span className="online-indicator">Online</span>
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

            <form onSubmit={handleSend} className="input-container">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button type="submit" className="send-button">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;