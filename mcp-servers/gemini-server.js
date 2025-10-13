#!/usr/bin/env node
/**
 * Gemini MCP Server
 * Model Context Protocol server for Google Gemini AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiMCPServer {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    async handleRequest(request) {
        const { method, params } = request;

        switch (method) {
            case 'generate':
                return await this.generate(params);
            case 'chat':
                return await this.chat(params);
            case 'embed':
                return await this.embed(params);
            case 'models/list':
                return this.listModels();
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }

    async generate(params) {
        const { prompt, maxTokens = 500, temperature = 0.7 } = params;

        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
                },
            });

            const response = result.response;
            return {
                text: response.text(),
                finishReason: response.candidates[0]?.finishReason,
                safetyRatings: response.candidates[0]?.safetyRatings,
            };
        } catch (error) {
            throw new Error(`Gemini generation failed: ${error.message}`);
        }
    }

    async chat(params) {
        const { messages, maxTokens = 500, temperature = 0.7 } = params;

        try {
            const chat = this.model.startChat({
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
                },
            });

            const lastMessage = messages[messages.length - 1];
            const result = await chat.sendMessage(lastMessage.content);

            return {
                text: result.response.text(),
                role: 'assistant',
            };
        } catch (error) {
            throw new Error(`Gemini chat failed: ${error.message}`);
        }
    }

    async embed(params) {
        const { text } = params;

        try {
            const embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
            const result = await embeddingModel.embedContent(text);

            return {
                embedding: result.embedding.values,
            };
        } catch (error) {
            throw new Error(`Gemini embedding failed: ${error.message}`);
        }
    }

    listModels() {
        return {
            models: [
                'gemini-1.5-flash',
                'gemini-1.5-pro',
                'gemini-pro',
                'embedding-001',
            ],
        };
    }

    start() {
        // MCP Server Communication via stdio
        process.stdin.setEncoding('utf8');

        let buffer = '';

        process.stdin.on('data', async (chunk) => {
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;

                let request;
                try {
                    request = JSON.parse(line);
                    const response = await this.handleRequest(request);

                    process.stdout.write(JSON.stringify({
                        id: request.id,
                        result: response,
                    }) + '\n');
                } catch (error) {
                    process.stdout.write(JSON.stringify({
                        id: request?.id || 0,
                        error: {
                            code: -32603,
                            message: error.message,
                        },
                    }) + '\n');
                }
            }
        });

        console.error('Gemini MCP Server started');
    }
}

// Start server
const server = new GeminiMCPServer();
server.start();

