// tests/e2e/websocket.test.js
import WebSocket from 'ws';
import assert from 'assert';
import { spawn } from 'child_process';

async function testWebSocketE2E() {
    console.log('🧪 Running E2E WebSocket Test...');

    // Start server in test mode
    const server = spawn('node', ['server.js'], {
        env: { ...process.env, NODE_ENV: 'test', PORT: '3001' }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    const ws = new WebSocket('ws://localhost:3001');
    let messages = [];
    let endMarkerReceived = false;

    try {
        await new Promise((resolve, reject) => {
            ws.on('open', async () => {
                console.log('🔌 Connected to WebSocket server');

                ws.on('message', (data) => {
                    const message = data.toString();
                    if (message === '__END__') {
                        endMarkerReceived = true;
                        resolve();
                    } else if (!message.includes('Error')) {
                        messages.push(message);
                    }
                });

                ws.on('error', reject);

                // Send test message
                const testPayload = {
                    messages: [
                        { role: 'user', content: 'Hello, this is a test message.' }
                    ]
                };
                ws.send(JSON.stringify(testPayload));
            });

            // Set test timeout
            setTimeout(() => reject(new Error('Test timeout')), 10000);
        });

        // Assertions
        assert(messages.length > 0, 'Should receive response chunks');
        assert(endMarkerReceived, 'Should receive end marker');
        const fullResponse = messages.join('');
        assert(fullResponse.length > 0, 'Should have complete response');

        console.log('✅ E2E WebSocket test passed');
    } catch (error) {
        console.error('❌ E2E WebSocket test failed:', error);
        throw error;
    } finally {
        ws.close();
        server.kill();
    }
}

// Run test
testWebSocketE2E().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});