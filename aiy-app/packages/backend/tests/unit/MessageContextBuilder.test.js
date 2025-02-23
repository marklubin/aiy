// MessageContextBuilder.test.js
import MessageContextBuilder from '../../MessageContextBuilder.js';
import { PineconeClient } from '../../pinecone.js';
import assert from 'assert';

async function testMessageContextBuilder() {
    console.log('🧪 Testing MessageContextBuilder...');

    const mockAxios = {
        post: async () => ({
            data: {
                result: {
                    hits: [
                        {
                            fields: { text: 'test content' },
                            _score: 0.9
                        }
                    ]
                }
            }
        })
    };

    const mockDeps = {
        rollingWindowCache: {
            preload: async () => {},
            getContextMessages: () => []
        },
        pineconeClient: new PineconeClient(mockAxios),
        fileCache: {
            fetchFile: async () => 'test content'
        },
        userId: 'test_user',
        segmentId: 'test_segment'
    };

    try {
        // Test constructor validation
        assert.throws(() => new MessageContextBuilder({}), Error);

        const builder = new MessageContextBuilder(mockDeps);
        const context = await builder.buildContext([
            { role: 'user', content: 'test message' }
        ]);

        assert.strictEqual(typeof context.session_id, 'string');
        assert.strictEqual(context.user_id, 'test_user');
        assert.strictEqual(context.system_instructions, 'test content');
        assert(Array.isArray(context.retrieved_context));
        assert.strictEqual(context.retrieved_context[0].content, 'test content');

        console.log('✅ MessageContextBuilder tests passed');
    } catch (error) {
        console.error('❌ MessageContextBuilder test failed:', error);
        throw error;
    }
}

export { testMessageContextBuilder };