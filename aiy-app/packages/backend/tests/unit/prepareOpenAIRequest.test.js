// prepareOpenAIRequest.test.js
import prepareOpenAIRequest from '../../prepareOpenAIRequest.js';
import assert from 'assert';

function testPrepareOpenAIRequest() {
    console.log('🧪 Testing prepareOpenAIRequest...');

    try {
        const testMessages = [
            { role: 'user', content: 'hello' }
        ];

        const testContext = {
            system_instructions: 'system test',
            context_usage_instructions: 'usage test',
            retrieved_context: [
                { content: 'context1' },
                { content: 'context2' }
            ],
            rolling_window: [
                { role: 'user', content: 'previous' }
            ]
        };

        const result = prepareOpenAIRequest(testMessages, testContext);

        assert(Array.isArray(result));
        assert.strictEqual(result[0].role, 'system');
        assert.strictEqual(result[0].content, 'system test');
        assert(result.some(msg => msg.content.includes('context1')));
        assert.strictEqual(result[result.length - 1].content, 'hello');

        // Test validation
        assert.throws(() => prepareOpenAIRequest([], {}), Error);
        assert.throws(() => prepareOpenAIRequest([], {
            system_instructions: 'test'
        }), Error);

        console.log('✅ prepareOpenAIRequest tests passed');
    } catch (error) {
        console.error('❌ prepareOpenAIRequest test failed:', error);
        throw error;
    }
}

export { testPrepareOpenAIRequest };