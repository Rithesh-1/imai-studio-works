import { useState, useEffect, useCallback, useRef } from 'react';
import { streamingClient, StreamingState } from '@/lib/streamingClient';
import { StreamingRequest } from '../streamer_package/src/streaming/types';

export interface UseStreamingReturn {
  // State
  isStreaming: boolean;
  currentText: string;
  isComplete: boolean;
  error: string | null;
  
  // Actions
  startStreaming: (message: string, userId?: string) => Promise<void>;
  stopStreaming: () => void;
  clearStreaming: () => void;
  
  // Utilities
  hasContent: boolean;
  streamingProgress: number; // 0-100
}

export function useStreaming(): UseStreamingReturn {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    isComplete: false,
    error: null,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const textLengthRef = useRef<number>(0);

  useEffect(() => {
    // Subscribe to streaming state changes
    unsubscribeRef.current = streamingClient.onStateChange((newState) => {
      setState(newState);
      
      // Track text length for progress calculation
      if (newState.currentText.length > textLengthRef.current) {
        textLengthRef.current = newState.currentText.length;
      }
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const startStreaming = useCallback(async (message: string, userId?: string) => {
    try {
      // Reset progress tracking
      textLengthRef.current = 0;
      
      const request: StreamingRequest = {
        prompt: message,
        config: {
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7,
          stream: true,
        },
      };
      
      await streamingClient.startStreaming(request);
    } catch (error) {
      console.error('Failed to start streaming:', error);
      throw error;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    streamingClient.stopStreaming();
  }, []);

  const clearStreaming = useCallback(() => {
    streamingClient.clearState();
    textLengthRef.current = 0;
  }, []);

  // Calculate progress based on text length (rough estimate)
  const streamingProgress = state.isStreaming && textLengthRef.current > 0 
    ? Math.min((state.currentText.length / textLengthRef.current) * 100, 100)
    : 0;

  return {
    // State
    isStreaming: state.isStreaming,
    currentText: state.currentText,
    isComplete: state.isComplete,
    error: state.error,
    
    // Actions
    startStreaming,
    stopStreaming,
    clearStreaming,
    
    // Utilities
    hasContent: state.currentText.length > 0,
    streamingProgress,
  };
} 