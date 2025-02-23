// DDBRollingWindowMessageCache.test.js
import DDBRollingWindowMessageCache from '../../DDBRollingWindowMessageCache.js';
import assert from 'assert';

async function testDDBRollingWindowMessageCache() {
    console.log('🧪 Testing DDBRollingWindowMessageCache...');

    const mockDocClient = {
        query: () => ({
            promise: async () => ({
                Items: [
                    {
                        userId_segmentId: 'test_user#test_segment',
                        epochTimestamp: Date.now(),
                        role: 'user',
                        content: 'test message'
                    }
                ]
            })
        }),
        put: () => ({
            promise: async () => ({})
        }),
        batchWrite: () => ({
            promise: async () => ({})
        })
    };

    try {
        // Test constructor validation
        assert.throws(() => new DDBRollingWindowMessageCache(), Error);

        const cache = new DDBRollingWindowMessageCache(
            mockDocClient,
            'TestTable',
            'test_user',
            'test_segment'
        );

        // Test preload
        await cache.preload();
        assert(cache.messages.length > 0);
        assert.strictEqual(cache.messages[0].role, 'user');

        // Test message storage
        await cache.storeMessage({
            role: 'assistant',
            content: 'test response'
        });

        const messages = cache.getContextMessages();
        assert(Array.isArray(messages));
        assert(messages.length > 0);
        assert.strictEqual(messages[0].role, 'user');

        // Test clear messages
        await cache.clearMessages();
        assert.strictEqual(cache.messages.length, 0);

        console.log('✅ DDBRollingWindowMessageCache tests passed');
    } catch (error) {
        console.error('❌ DDBRollingWindowMessageCache test failed:', error);
        throw error;
    }
}

export { testDDBRollingWindowMessageCache };