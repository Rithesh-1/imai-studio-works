import { StreamingRequest, StreamingConfig } from '../streamer_package/src/streaming/types';

export interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  isComplete: boolean;
  error: string | null;
}

export class StreamingClient {
  private stateCallbacks: ((state: StreamingState) => void)[] = [];
  private currentState: StreamingState = {
    isStreaming: false,
    currentText: '',
    isComplete: false,
    error: null,
  };
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;

  private setupCallbacks() {
    // Callbacks will be handled by the streaming API
  }

  private notifyStateChange() {
    this.stateCallbacks.forEach(callback => callback({ ...this.currentState }));
  }

  async startStreaming(request: StreamingRequest): Promise<void> {
    // Reset state
    this.currentState = {
      isStreaming: true,
      currentText: '',
      isComplete: false,
      error: null,
    };
    this.notifyStateChange();

    try {
      console.log("🚀 Starting streaming request:", request.prompt);
      
      // Create a proper streaming request using fetch with streaming
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.prompt,
          userId: 'test-user', // This will be passed from the component
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("✅ Response received, starting to read stream");

      // Check if the response is streamable
      if (!response.body) {
        throw new Error('Response body is not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log("✅ Stream reading complete");
            this.currentState.isStreaming = false;
            this.currentState.isComplete = true;
            this.notifyStateChange();
            break;
          }

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          console.log("📥 Received chunk:", chunk);
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue; // Skip empty lines
            
            console.log("📋 Processing line:", line);
            
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // Remove 'data: ' prefix
                console.log("🔍 Parsing JSON:", jsonData);
                const data = JSON.parse(jsonData);
                
                if (data.content !== undefined) {
                  console.log("📝 Adding content:", data.content);
                  this.currentState.currentText += data.content;
                  this.currentState.isStreaming = true;
                  this.currentState.isComplete = false;
                  this.currentState.error = null;
                  this.notifyStateChange();
                  
                  // Add a small delay to make streaming more visible
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                if (data.done === true) {
                  console.log("✅ Stream complete");
                  this.currentState.isStreaming = false;
                  this.currentState.isComplete = true;
                  this.notifyStateChange();
                  return;
                }
                
                if (data.error) {
                  console.error("❌ Stream error:", data.error);
                  this.currentState.isStreaming = false;
                  this.currentState.isComplete = false;
                  this.currentState.error = data.error;
                  this.notifyStateChange();
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError, 'Line:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("❌ Streaming error:", error);
      this.currentState.isStreaming = false;
      this.currentState.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyStateChange();
      throw error;
    }
  }

  stopStreaming(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.currentState.isStreaming = false;
    this.notifyStateChange();
  }

  onStateChange(callback: (state: StreamingState) => void): () => void {
    this.stateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter(cb => cb !== callback);
    };
  }

  getCurrentState(): StreamingState {
    return { ...this.currentState };
  }

  isStreaming(): boolean {
    return this.currentState.isStreaming;
  }

  clearState(): void {
    this.currentState = {
      isStreaming: false,
      currentText: '',
      isComplete: false,
      error: null,
    };
    this.notifyStateChange();
  }
}

// Create a singleton instance
export const streamingClient = new StreamingClient(); 