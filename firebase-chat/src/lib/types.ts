export type Message = {
    id: string;                // Unique identifier of the message
    text: string;              // Content of the message
    timestamp: number;         // Timestamp as a number
    role: "user" | "assistant"; // Role of the sender ("user" or "assistant")
};


