"use client";

import { useEffect, useRef } from 'react';
import { useStreaming } from '@/hooks/useStreaming';

interface StreamingMessageProps {
  message: string;
  userId?: string;
  onComplete?: (finalText: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function StreamingMessage({
  message,
  userId,
  onComplete,
  onError,
  className = "",
}: StreamingMessageProps) {
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

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current && message) {
      hasStartedRef.current = true;
      
      startStreaming(message, userId).catch((error) => {
        console.error('Streaming failed:', error);
        onError?.(error.message || 'Streaming failed');
      });
    }

    return () => {
      if (hasStartedRef.current) {
        stopStreaming();
        clearStreaming();
        hasStartedRef.current = false;
      }
    };
  }, [message, userId, startStreaming, stopStreaming, clearStreaming, onError]);

  useEffect(() => {
    if (isComplete && hasContent) {
      onComplete?.(currentText);
    }
  }, [isComplete, hasContent, currentText, onComplete]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Show loading state while starting
  if (!hasContent && !isStreaming && !error) {
    return (
      <div className={`flex justify-start mb-2 ${className}`}>
        <div className="flex items-end gap-2">
          <div className="max-w-[75%] bg-transparent text-primary-foreground rounded-2xl px-4 py-3">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-gray-500">Starting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`flex justify-start mb-2 ${className}`}>
        <div className="flex items-end gap-2">
          <div className="max-w-[75%] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3">
            <div className="text-sm">
              <p>❌ {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show streaming content
  return (
    <div className={`flex justify-start mb-2 ${className}`}>
      <div className="flex items-end gap-2">
        <div className="max-w-[75%] bg-transparent text-primary-foreground rounded-2xl py-2">
          <div className="text-sm leading-relaxed">
            <p className="text-black dark:text-white">
              {currentText}
              {isStreaming && (
                <span className="animate-pulse ml-1">▊</span>
              )}
            </p>
            {isStreaming && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${streamingProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {Math.round(streamingProgress)}% complete
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 