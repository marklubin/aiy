// websocketHandler.test.js
import WebSocketHandler from '../../websocketHandler.js';
import assert from 'assert';

async function testWebSocketHandler() {
    console.log('🧪 Testing WebSocketHandler...');

    const mockMessages = {
        messages: [
            { role: 'user', content: 'test message' }
        ]
    };

    const mockWs = {
        sentMessages: [],
        send: function(message) {
            this.sentMessages.push(message);
        }
    };

    const mockDependencies = {
        openai: {
            chat: {
                completions: {
                    create: async () => ({
                        [Symbol.asyncIterator]: async function* () {
                            yield { choices: [{ delta: { content: 'test' } }] };
                            yield { choices: [{ delta: { content: ' response' } }] };
                            yield { choices: [{ delta: { content: null } }] };
                        }
                    })
                }
            }
        },
        rollingWindowCache: {
            preload: async () => {},
            getContextMessages: () => [],
            storeMessage: async () => {}
        },
        instructionsCache: {
            fetchFile: async () => 'test content'
        },
        pineconeClient: {
            queryPinecone: async () => ({
                result: {
                    hits: [
                        {
                            fields: { text: 'test content' },
                            _score: 0.9
                        }
                    ]
                }
            })
        }
    };

    try {
        const handler = new WebSocketHandler(mockDependencies);
        assert(handler, 'Handler should be created');

        // Test message handling
        await handler.handleMessage(JSON.stringify(mockMessages), mockWs);

        // Check if response chunks were sent
        assert(mockWs.sentMessages.includes('test'), 'Should send first chunk');
        assert(mockWs.sentMessages.includes(' response'), 'Should send second chunk');
        assert(mockWs.sentMessages.includes('__END__'), 'Should send end marker');

        // Test error handling with invalid input
        mockWs.sentMessages = [];
        await handler.handleMessage('invalid json', mockWs);
        assert(mockWs.sentMessages[0].includes('Error'), 'Should handle invalid JSON');

        // Test missing messages array
        mockWs.sentMessages = [];
        await handler.handleMessage('{}', mockWs);
        assert(mockWs.sentMessages[0].includes('Error'), 'Should handle missing messages');

        console.log('✅ WebSocketHandler tests passed');
    } catch (error) {
        console.error('❌ WebSocketHandler test failed:', error);
        throw error;
    }
}

export { testWebSocketHandler };