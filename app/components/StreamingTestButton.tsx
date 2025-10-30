"use client";

import { useState } from 'react';
import { useStreamingContext } from '@/contexts/StreamingContext';

interface StreamingTestButtonProps {
  message: string;
  userId?: string;
  className?: string;
}

export default function StreamingTestButton({ 
  message, 
  userId = 'test-user',
  className = "" 
}: StreamingTestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { startStreaming, stopStreaming, clearStreaming, isStreaming, currentText } = useStreamingContext();

  const handleStream = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    clearStreaming();
    
    try {
      await startStreaming(message, userId);
    } catch (error) {
      console.error('Streaming failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    stopStreaming();
  };

  const handleClear = () => {
    clearStreaming();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex space-x-2">
        <button
          onClick={handleStream}
          disabled={isStreaming || isLoading || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Starting...' : 'Start Streaming'}
        </button>
        
        <button
          onClick={handleStop}
          disabled={!isStreaming}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop
        </button>
        
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Clear
        </button>
      </div>
      
      {currentText && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {currentText}
            {isStreaming && <span className="animate-pulse ml-1">▊</span>}
          </p>
        </div>
      )}
    </div>
  );
} 