// S3FileCache.test.js
import S3FileCache from '../../S3FileCache.js';
import assert from 'assert';

async function testS3FileCache() {
    console.log('🧪 Testing S3FileCache...');

    try {
        // Test constructor validation
        assert.throws(() => new S3FileCache(), Error);

        const cache = new S3FileCache('test-bucket', 1);

        // Test cache mechanism
        const testFile = 'test.txt';
        cache.cache.set(testFile, {
            data: 'cached content',
            timestamp: Date.now()
        });

        const cachedContent = await cache.fetchFile(testFile);
        assert.strictEqual(cachedContent, 'cached content');

        // Test cache expiry
        await new Promise(resolve => setTimeout(resolve, 1100));
        cache.cache.set(testFile, {
            data: 'old content',
            timestamp: Date.now() - 2000
        });

        // Should trigger S3 fetch (which will fail in test environment)
        const expiredContent = await cache.fetchFile(testFile);
        assert.strictEqual(expiredContent, null);

        console.log('✅ S3FileCache tests passed');
    } catch (error) {
        console.error('❌ S3FileCache test failed:', error);
        throw error;
    }
}

export { testS3FileCache };