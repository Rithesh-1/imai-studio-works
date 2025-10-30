"use client";

import { useState } from 'react';
import { useStreamingContext } from '@/contexts/StreamingContext';

export default function StreamingDemo() {
  const [testMessage, setTestMessage] = useState('Hello, can you help me with image processing?');
  
  const {
    isStreaming,
    currentText,
    isComplete,
    error,
    streamingProgress,
    hasContent,
    startStreaming,
    stopStreaming,
    clearStreaming,
  } = useStreamingContext();

  const handleStartStreaming = async () => {
    if (!testMessage.trim()) return;
    
    clearStreaming();
    try {
      await startStreaming(testMessage, 'demo-user');
    } catch (error) {
      console.error('Streaming failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Streaming Text Demo
      </h2>
      
      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Message
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>

        {/* Controls */}
        <div className="flex space-x-4">
          <button
            onClick={handleStartStreaming}
            disabled={isStreaming || !testMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? 'Streaming...' : 'Start Streaming'}
          </button>
          
          <button
            onClick={stopStreaming}
            disabled={!isStreaming}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
          
          <button
            onClick={clearStreaming}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        {/* Status */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Streaming Status
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`ml-2 ${isStreaming ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {isStreaming ? 'Streaming' : 'Idle'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Complete:</span>
              <span className={`ml-2 ${isComplete ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {isComplete ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Has Content:</span>
              <span className={`ml-2 ${hasContent ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {hasContent ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {Math.round(streamingProgress)}%
              </span>
            </div>
          </div>
          
          {error && (
            <div className="mt-2">
              <span className="text-gray-600 dark:text-gray-400">Error:</span>
              <span className="ml-2 text-red-600">{error}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isStreaming && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${streamingProgress}%` }}
            ></div>
          </div>
        )}

        {/* Streaming Output */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 min-h-[200px]">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Streaming Output
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 min-h-[150px]">
            {currentText ? (
              <div className="text-gray-900 dark:text-white">
                <p className="whitespace-pre-wrap text-lg leading-relaxed">
                  {currentText}
                  {isStreaming && (
                    <span className="animate-pulse ml-1 text-blue-600">▊</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No streaming content yet. Click "Start Streaming" to begin...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 