"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useStreaming } from '@/hooks/useStreaming';

interface StreamingContextType {
  // State
  isStreaming: boolean;
  currentText: string;
  isComplete: boolean;
  error: string | null;
  streamingProgress: number;
  hasContent: boolean;
  
  // Actions
  startStreaming: (message: string, userId?: string) => Promise<void>;
  stopStreaming: () => void;
  clearStreaming: () => void;
  
  // Message management
  streamingMessageId: string | null;
  setStreamingMessageId: (id: string | null) => void;
  
  // Utilities
  isStreamingMessage: (messageId: string) => boolean;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

export function StreamingProvider({ children }: { children: ReactNode }) {
  const {
    isStreaming,
    currentText,
    isComplete,
    error,
    startStreaming,
    stopStreaming,
    clearStreaming,
    hasContent,
    streamingProgress,
  } = useStreaming();

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const isStreamingMessage = useCallback((messageId: string) => {
    return streamingMessageId === messageId;
  }, [streamingMessageId]);

  const value: StreamingContextType = {
    // State
    isStreaming,
    currentText,
    isComplete,
    error,
    streamingProgress,
    hasContent,
    
    // Actions
    startStreaming,
    stopStreaming,
    clearStreaming,
    
    // Message management
    streamingMessageId,
    setStreamingMessageId,
    
    // Utilities
    isStreamingMessage,
  };

  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
}

export function useStreamingContext() {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error('useStreamingContext must be used within a StreamingProvider');
  }
  return context;
} 