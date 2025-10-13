#!/usr/bin/env node
/**
 * Test Gemini MCP Server
 */

const { spawn } = require('child_process');
const readline = require('readline');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_KEY_HERE';

console.log('🧪 Testing Gemini MCP Server...\n');

// Start server
const server = spawn('node', ['./mcp-servers/gemini-server.js'], {
    env: { ...process.env, GEMINI_API_KEY },
    stdio: ['pipe', 'pipe', 'inherit']
});

let requestId = 1;

function sendRequest(method, params) {
    const request = {
        id: requestId++,
        method,
        params
    };

    server.stdin.write(JSON.stringify(request) + '\n');
}

// Read responses
const rl = readline.createInterface({
    input: server.stdout,
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    if (!line.trim()) return;

    try {
        const response = JSON.parse(line);

        if (response.error) {
            console.error('❌ Error:', response.error.message);
        } else {
            console.log('✅ Response:', JSON.stringify(response.result, null, 2));
        }
    } catch (e) {
        console.log('📝 Log:', line);
    }
});

// Test 1: List models
console.log('📋 Test 1: List Models');
sendRequest('models/list', {});

// Test 2: Generate text
setTimeout(() => {
    console.log('\n💬 Test 2: Generate Text');
    sendRequest('generate', {
        prompt: 'Giải thích ngắn gọn về căng thẳng và cách quản lý',
        maxTokens: 200,
        temperature: 0.7
    });
}, 2000);

// Test 3: Chat
setTimeout(() => {
    console.log('\n💭 Test 3: Chat');
    sendRequest('chat', {
        messages: [
            { role: 'user', content: 'Xin chào! Tôi cảm thấy lo lắng' }
        ],
        maxTokens: 200
    });
}, 5000);

// Cleanup
setTimeout(() => {
    console.log('\n✅ Tests completed!');
    server.kill();
    process.exit(0);
}, 10000);

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

