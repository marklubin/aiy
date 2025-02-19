import React from "react";
import { Message } from "@/lib/types";

const ChatMessage: React.FC<{ message: Message; isUser: boolean }> = ({ message, isUser }) => (
    <div className={`message ${isUser ? 'user-message' : 'other-message'}`}>
        <div className="message-content">
            <span className="message-text">{message.text}</span>
            <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    </div>
);

export default ChatMessage;