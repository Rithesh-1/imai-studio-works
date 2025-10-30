"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextStreamingComponent = void 0;
const openai_1 = __importDefault(require("openai"));
class TextStreamingComponent {
    constructor(apiKey) {
        this.isStreamingActive = false;
        this.contentCallbacks = [];
        this.doneCallbacks = [];
        this.errorCallbacks = [];
        this.currentStream = null;
        this.openai = new openai_1.default({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
    }
    async startStreaming(request) {
        if (this.isStreamingActive) {
            throw new Error('Streaming is already active');
        }
        try {
            this.isStreamingActive = true;
            const config = {
                model: 'gpt-3.5-turbo',
                maxTokens: 1000,
                temperature: 0.7,
                stream: true,
                ...request.config
            };
            this.currentStream = await this.openai.chat.completions.create({
                model: config.model,
                messages: [{ role: 'user', content: request.prompt }],
                max_tokens: config.maxTokens,
                temperature: config.temperature,
                stream: config.stream,
            });
            for await (const chunk of this.currentStream) {
                if (!this.isStreamingActive)
                    break;
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    this.contentCallbacks.forEach(callback => callback(content));
                }
            }
            this.isStreamingActive = false;
            this.doneCallbacks.forEach(callback => callback());
        }
        catch (error) {
            this.isStreamingActive = false;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.errorCallbacks.forEach(callback => callback(errorMessage));
            throw error;
        }
    }
    stopStreaming() {
        if (this.isStreamingActive && this.currentStream) {
            this.currentStream.controller?.abort();
            this.isStreamingActive = false;
        }
    }
    onContent(callback) {
        this.contentCallbacks.push(callback);
    }
    onDone(callback) {
        this.doneCallbacks.push(callback);
    }
    onError(callback) {
        this.errorCallbacks.push(callback);
    }
    isStreaming() {
        return this.isStreamingActive;
    }
    // Utility methods
    clearCallbacks() {
        this.contentCallbacks = [];
        this.doneCallbacks = [];
        this.errorCallbacks = [];
    }
    removeContentCallback(callback) {
        this.contentCallbacks = this.contentCallbacks.filter(cb => cb !== callback);
    }
    removeDoneCallback(callback) {
        this.doneCallbacks = this.doneCallbacks.filter(cb => cb !== callback);
    }
    removeErrorCallback(callback) {
        this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    }
}
exports.TextStreamingComponent = TextStreamingComponent;
//# sourceMappingURL=TextStreamingComponent.js.map