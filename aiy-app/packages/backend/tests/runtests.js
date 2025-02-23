// runTests.js
import { testMessageContextBuilder } from './unit/MessageContextBuilder.test.js';
import { testS3FileCache } from './unit/S3FileCache.test.js';
import { testPrepareOpenAIRequest } from './unit/prepareOpenAIRequest.test.js';
import { testPineconeQuery } from './unit/pinecone.test.js';
import { testDDBRollingWindowMessageCache } from './unit/DDBRollingWindowMessageCache.test.js';
import {testWebSocketHandler} from "./unit/WebSocketHandler.test.js";

async function runAllTests() {
    try {
        await testMessageContextBuilder();
        await testS3FileCache();
        await testPrepareOpenAIRequest();
        await testPineconeQuery();
        await testDDBRollingWindowMessageCache();
        await testWebSocketHandler()
        console.log('✅ All tests passed successfully');
    } catch (error) {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    }
}

runAllTests();