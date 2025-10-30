export interface StreamingConfig {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
}
export interface StreamingRequest {
    prompt: string;
    config?: StreamingConfig;
}
export interface StreamingResponse {
    type: 'content' | 'done' | 'error';
    content?: string;
    error?: string;
    metadata?: {
        model: string;
        usage?: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
}
export interface StreamingEvent {
    id: string;
    type: 'start' | 'content' | 'done' | 'error' | 'stopped';
    data: any;
    timestamp: number;
}
export interface TextStreamingComponent {
    startStreaming(request: StreamingRequest): Promise<void>;
    stopStreaming(): void;
    onContent(callback: (content: string) => void): void;
    onDone(callback: () => void): void;
    onError(callback: (error: string) => void): void;
    isStreaming(): boolean;
}
//# sourceMappingURL=types.d.ts.map