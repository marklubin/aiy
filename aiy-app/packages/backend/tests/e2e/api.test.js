import { request } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

function sendRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            headers: {
                "Content-Type": "application/json",
            },
        };

        const req = request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testCompleteEndpoint() {
    console.log("🟢 Testing /complete endpoint...");

    try {
        const response = await sendRequest("POST", "/complete", {
            model: "gpt-4",
            messages: [{ role: "user", content: "Hello!" }]
        });

        console.log("Response:", response);

        if (response.status !== 200) {
            throw new Error(`❌ Expected 200 but got ${response.status}`);
        }

        // ✅ Extract the assistant's message
        const assistantMessage = response.body?.choices?.[0]?.message?.content;

        if (!assistantMessage || typeof assistantMessage !== "string") {
            throw new Error("❌ Response does not contain a valid assistant 'message' field");
        }

        console.log("✅ Assistant Message:", assistantMessage);
        console.log("✅ /complete test passed!");
    } catch (error) {
        console.error("❌ /complete test failed:", error);
    }
}

// ❌ Test invalid data handling
async function testInvalidCompleteRequest() {
    console.log("🟢 Testing invalid /complete request...");

    try {
        const response = await sendRequest("POST", "/complete", { model: 123 });

        console.log("Response:", response);

        if (response.status !== 500) {
            throw new Error(`❌ Expected 500 but got ${response.status}`);
        }
        if (!response.body.error) {
            throw new Error("❌ Expected an error message in response");
        }

        console.log("✅ Invalid /complete request test passed!");
    } catch (error) {
        console.error("❌ Invalid /complete test failed:", error);
    }
}

// Run the tests
(async () => {
    await testCompleteEndpoint();
    await testInvalidCompleteRequest();
})();