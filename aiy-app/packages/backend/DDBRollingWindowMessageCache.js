import AWS from 'aws-sdk';
import awsConfig from './awsConfig.js';

class DDBRollingWindowMessageCache {
    constructor(tableName, userId, segmentId, flushThreshold = 10) {
        if (!tableName || !userId || !segmentId) {
            throw new Error("❌ Table name, user ID, and segment ID are required.");
        }

        this.db = new AWS.DynamoDB.DocumentClient(awsConfig);
        this.tableName = tableName;
        this.partitionKey = `${userId}#${segmentId}`; // ✅ Concat userId + segmentId
        this.flushThreshold = flushThreshold;
        this.messages = [];
    }

    async preload() {
        try {
            console.log(`📂 Preloading last 50 messages for: ${this.partitionKey}`);
    
            const params = {
                TableName: this.tableName,
                KeyConditionExpression: "#pk = :partitionKey",
                ExpressionAttributeNames: {
                    "#pk": "userId#segmentId"  // ✅ Alias for partition key
                },
                ExpressionAttributeValues: {
                    ":partitionKey": this.partitionKey
                },
                Limit: 50,
                ScanIndexForward: false
            };
    
            const data = await this.db.query(params).promise();
            this.messages = data.Items || [];
            console.log(`✅ Loaded ${this.messages.length} messages from DynamoDB.`);
        } catch (error) {
            console.error(`❌ Error preloading messages from DynamoDB:`, error);
        }
    }
    
    addMessage(message) {
        const newMessage = {
            userId_segmentId: this.partitionKey,
            epochTimestamp: Date.now(),
            message: message
        };

        this.messages.push(newMessage);

        if (this.messages.length >= this.flushThreshold) {
            this.flushToDynamoDB();
        }
    }

    async flushToDynamoDB() {
        try {
            console.log(`💾 Flushing ${this.messages.length} messages to DynamoDB...`);

            const putRequests = this.messages.map(msg => ({
                PutRequest: {
                    Item: msg
                }
            }));

            const params = {
                RequestItems: {
                    [this.tableName]: putRequests
                }
            };

            await this.db.batchWrite(params).promise();

            this.messages = []; // ✅ Clear cache after flush
            console.log("✅ Messages successfully written to DynamoDB.");
        } catch (error) {
            console.error("❌ Error writing messages to DynamoDB:", error);
        }
    }

    getMessages() {
        return this.messages;
    }
}

export default DDBRollingWindowMessageCache;