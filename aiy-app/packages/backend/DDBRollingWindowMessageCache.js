import AWS from 'aws-sdk';
import awsConfig from './awsConfig.js';

class DDBRollingWindowMessageCache {
    constructor(docClient, tableName, userId, segmentId, windowSize = 10) {
        if (!tableName || !userId || !segmentId) {
            throw new Error("❌ Table name, user ID, and segment ID are required.");
        }
        if (!docClient) {
            throw new Error("❌ DynamoDB DocumentClient is required");
        }

        this.db = docClient;
        this.tableName = tableName;
        this.partitionKey = `${userId}#${segmentId}`;
        this.windowSize = windowSize;
        this.messages = [];
    }
    async preload() {
        try {
            console.log(`📂 Preloading last ${this.windowSize} messages for: ${this.partitionKey}`);

            const params = {
                TableName: this.tableName,
                KeyConditionExpression: "#pk = :partitionKey",
                ExpressionAttributeNames: {
                    "#pk": "userId_segmentId"
                },
                ExpressionAttributeValues: {
                    ":partitionKey": this.partitionKey
                },
                Limit: this.windowSize,
                ScanIndexForward: false // Get most recent messages first
            };

            const data = await this.db.query(params).promise();
            this.messages = data.Items || [];
            console.log(`✅ Loaded ${this.messages.length} messages from DynamoDB.`);
        } catch (error) {
            console.error(`❌ Error preloading messages from DynamoDB:`, error);
        }
    }

    async storeMessage(message) {
        try {
            const newMessage = {
                userId_segmentId: this.partitionKey,
                epochTimestamp: Date.now(),
                role: message.role,
                content: message.content
            };

            // Store in DynamoDB
            await this.db.put({
                TableName: this.tableName,
                Item: newMessage
            }).promise();

            // Update in-memory window
            this.messages.push(newMessage);
            if (this.messages.length > this.windowSize) {
                this.messages.shift();
            }

            console.log(`✅ Message stored successfully`);
        } catch (error) {
            console.error("❌ Error storing message:", error);
            throw error;
        }
    }

    getContextMessages() {
        // Return messages in format suitable for OpenAI context
        return this.messages
            .sort((a, b) => a.epochTimestamp - b.epochTimestamp) // Ensure chronological order
            .map(msg => ({
                role: msg.role,
                content: msg.content
            }));
    }

    async clearMessages() {
        try {
            const params = {
                TableName: this.tableName,
                KeyConditionExpression: "#pk = :partitionKey",
                ExpressionAttributeNames: {
                    "#pk": "userId_segmentId"
                },
                ExpressionAttributeValues: {
                    ":partitionKey": this.partitionKey
                }
            };

            const data = await this.db.query(params).promise();

            // Delete items in batches of 25 (DynamoDB limit)
            const items = data.Items || [];
            const batchSize = 25;

            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const deleteRequests = batch.map(item => ({
                    DeleteRequest: {
                        Key: {
                            userId_segmentId: item.userId_segmentId,
                            epochTimestamp: item.epochTimestamp
                        }
                    }
                }));

                await this.db.batchWrite({
                    RequestItems: {
                        [this.tableName]: deleteRequests
                    }
                }).promise();
            }

            this.messages = [];
            console.log("✅ All messages cleared");
        } catch (error) {
            console.error("❌ Error clearing messages:", error);
            throw error;
        }
    }
}

export default DDBRollingWindowMessageCache;