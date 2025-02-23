// tests/e2e/utils.js
export async function waitForServer(port, maxAttempts = 10) {
    const delay = 500;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const ws = new WebSocket(`ws://localhost:${port}`);
            await new Promise((resolve, reject) => {
                ws.on('open', () => {
                    ws.close();
                    resolve();
                });
                ws.on('error', reject);
            });
            return true;
        } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Server failed to start');
}