import OpenAI from 'openai';
import { 
  StreamingConfig, 
  StreamingRequest, 
  StreamingResponse, 
  TextStreamingComponent as ITextStreamingComponent 
} from './types';

export class TextStreamingComponent implements ITextStreamingComponent {
  private openai: OpenAI;
  private isStreamingActive: boolean = false;
  private contentCallbacks: ((content: string) => void)[] = [];
  private doneCallbacks: (() => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];
  private currentStream: any = null;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async startStreaming(request: StreamingRequest): Promise<void> {
    if (this.isStreamingActive) {
      throw new Error('Streaming is already active');
    }

    try {
      this.isStreamingActive = true;
      
      const config: StreamingConfig = {
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        stream: true,
        ...request.config
      };

      this.currentStream = await this.openai.chat.completions.create({
        model: config.model!,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: config.stream,
      });

      for await (const chunk of this.currentStream) {
        if (!this.isStreamingActive) break;
        
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          this.contentCallbacks.forEach(callback => callback(content));
        }
      }

      this.isStreamingActive = false;
      this.doneCallbacks.forEach(callback => callback());
      
    } catch (error) {
      this.isStreamingActive = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.errorCallbacks.forEach(callback => callback(errorMessage));
      throw error;
    }
  }

  stopStreaming(): void {
    if (this.isStreamingActive && this.currentStream) {
      this.currentStream.controller?.abort();
      this.isStreamingActive = false;
    }
  }

  onContent(callback: (content: string) => void): void {
    this.contentCallbacks.push(callback);
  }

  onDone(callback: () => void): void {
    this.doneCallbacks.push(callback);
  }

  onError(callback: (error: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  isStreaming(): boolean {
    return this.isStreamingActive;
  }

  // Utility methods
  clearCallbacks(): void {
    this.contentCallbacks = [];
    this.doneCallbacks = [];
    this.errorCallbacks = [];
  }

  removeContentCallback(callback: (content: string) => void): void {
    this.contentCallbacks = this.contentCallbacks.filter(cb => cb !== callback);
  }

  removeDoneCallback(callback: () => void): void {
    this.doneCallbacks = this.doneCallbacks.filter(cb => cb !== callback);
  }

  removeErrorCallback(callback: (error: string) => void): void {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }
} 