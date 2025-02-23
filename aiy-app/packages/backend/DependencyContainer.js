// dependencyContainer.js
import AWS from 'aws-sdk';
import OpenAI from 'openai';
import axios from 'axios';
import S3FileCache from './S3FileCache.js';
import DDBRollingWindowMessageCache from './DDBRollingWindowMessageCache.js';
import { PineconeClient } from './pinecone.js';

class DependencyContainer {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPEN_AI_API_KEY,
        });

        const docClient = new AWS.DynamoDB.DocumentClient();
        this.rollingWindowCache = new DDBRollingWindowMessageCache(
            docClient,
            "AIYMessages",
            "user_456",
            "default_segment"
        );

        this.instructionsCache = new S3FileCache(process.env.S3_BUCKET, 3600);
        this.pineconeClient = new PineconeClient(axios);
    }

    async initialize() {
        await this.rollingWindowCache.preload();
    }

    getDependencies() {
        return {
            openai: this.openai,
            rollingWindowCache: this.rollingWindowCache,
            instructionsCache: this.instructionsCache,
            pineconeClient: this.pineconeClient
        };
    }
}

export default DependencyContainer;