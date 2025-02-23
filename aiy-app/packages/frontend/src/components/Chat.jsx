import { useState, useEffect, useRef } from "react";
import "./Chat.css";

const WS_URL = "ws://localhost:3000";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIndex = useRef(0);
  const currentStreamingMessage = useRef(""); // Keep track of current streaming message

  useEffect(() => {
    let storedMessages = [];
    let index = 0;

    while (localStorage.getItem(`chatMessage_${index}`)) {
      storedMessages.push(JSON.parse(localStorage.getItem(`chatMessage_${index}`)));
      index++;
    }

    console.log('Initial load from localStorage:', storedMessages);
    setMessages(storedMessages);
    messageIndex.current = index;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onopen = () => console.log("🟢 Connected to WebSocket");

    ws.current.onmessage = async (event) => {
      const data = event.data;

      if (data === "__END__") {
        console.log('Stream ended. Current streaming message:', currentStreamingMessage.current);

        // Only store if we have content
        if (currentStreamingMessage.current.trim()) {
          const finalMessage = { role: "assistant", content: currentStreamingMessage.current };
          const msgKey = `chatMessage_${messageIndex.current}`;

          localStorage.setItem(msgKey, JSON.stringify(finalMessage));
          console.log('Stored final message in localStorage:', msgKey, finalMessage);

          setMessages(prev => {
            const newMessages = [...prev, finalMessage];
            console.log('Updated messages with final message:', newMessages);
            return newMessages;
          });

          messageIndex.current += 1;
        }

        setLoading(false);
        currentStreamingMessage.current = ""; // Reset the ref
        setStreamingMessage(""); // Reset the state
        return;
      }

      // Update both the ref and the state
      currentStreamingMessage.current += data;
      setStreamingMessage(currentStreamingMessage.current);

      // Store intermediate state
      const tempMessage = { role: "assistant", content: currentStreamingMessage.current };
      localStorage.setItem(`chatMessage_${messageIndex.current}`, JSON.stringify(tempMessage));
    };

    ws.current.onclose = () => console.log("🔴 Disconnected from WebSocket");

    return () => ws.current.close();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const msgKey = `chatMessage_${messageIndex.current}`;

    localStorage.setItem(msgKey, JSON.stringify(userMessage));
    setMessages(prev => [...prev, userMessage]);
    messageIndex.current += 1;

    setInput("");
    setLoading(true);
    currentStreamingMessage.current = ""; // Reset the ref
    setStreamingMessage(""); // Reset the state

    ws.current.send(JSON.stringify({ messages: [...messages, userMessage] }));
  };

  return (
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, index) => (
              <div key={index} className={msg.role === "user" ? "chat-user-message" : "chat-assistant-message"}>
                {msg.content}
              </div>
          ))}
          {loading && <div className="chat-assistant-message">{streamingMessage}▌</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
        <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message... (Shift+Enter for newline, Enter to send)"
            className="chat-textarea"
            rows="3"
        />
          <button onClick={sendMessage} className="chat-send-button">
            Send
          </button>
        </div>
      </div>
  );
}

export default Chat;