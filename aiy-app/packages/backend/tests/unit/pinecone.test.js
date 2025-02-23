// pinecone.test.js
import { PineconeClient } from '../../pinecone.js';
import assert from 'assert';

async function testPineconeQuery() {
    console.log('🧪 Testing Pinecone Query...');

    try {
        const searchText = 'test query';
        process.env.PINECONE_API_KEY = 'test-key';

        const mockAxios = {
            post: async (url) => {
                if (url.includes('/search')) {
                    return {
                        data: {
                            result: {
                                hits: [
                                    {
                                        _id: 'test-id',
                                        _score: 0.24277694523334503,
                                        fields: {
                                            text: 'This is a test'
                                        }
                                    }
                                ]
                            },
                            usage: {
                                embed_total_tokens: 5,
                                read_units: 6
                            }
                        }
                    };
                }
                return { data: { success: true } };
            }
        };

        const pinecone = new PineconeClient(mockAxios);

        // Test query
        const result = await pinecone.queryPinecone(searchText);
        assert(result.result);
        assert(Array.isArray(result.result.hits));
        assert.strictEqual(result.result.hits[0].fields.text, 'This is a test');

        // Test upsert
        const upsertResult = await pinecone.upsertDocumentToPinecone(
            'test content',
            'test-id',
            'http://test.com'
        );
        assert(upsertResult.success);
        assert(upsertResult.chunksProcessed > 0);

        console.log('✅ Pinecone tests passed');
    } catch (error) {
        console.error('❌ Pinecone test failed:', error);
        throw error;
    }
}

export { testPineconeQuery };