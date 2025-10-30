import { StreamingRequest, TextStreamingComponent as ITextStreamingComponent } from './types';
export declare class TextStreamingComponent implements ITextStreamingComponent {
    private openai;
    private isStreamingActive;
    private contentCallbacks;
    private doneCallbacks;
    private errorCallbacks;
    private currentStream;
    constructor(apiKey?: string);
    startStreaming(request: StreamingRequest): Promise<void>;
    stopStreaming(): void;
    onContent(callback: (content: string) => void): void;
    onDone(callback: () => void): void;
    onError(callback: (error: string) => void): void;
    isStreaming(): boolean;
    clearCallbacks(): void;
    removeContentCallback(callback: (content: string) => void): void;
    removeDoneCallback(callback: () => void): void;
    removeErrorCallback(callback: (error: string) => void): void;
}
//# sourceMappingURL=TextStreamingComponent.d.ts.map