"use client";

import { useState } from 'react';
import { useStreamingContext } from '@/contexts/StreamingContext';
import StreamingTestButton from '../components/StreamingTestButton';

export default function TestStreamingPage() {
  const [testMessage, setTestMessage] = useState('');
  
  const {
    isStreaming,
    currentText,
    isComplete,
    error,
    streamingProgress,
    hasContent,
  } = useStreamingContext();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Streaming Test Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Streaming
          </h2>
          
          <div className="space-y-4">
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
            
            <StreamingTestButton 
              message={testMessage}
              userId="test-user"
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Streaming Status
          </h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={isStreaming ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                {isStreaming ? 'Streaming' : 'Idle'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Complete:</span>
              <span className={isComplete ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                {isComplete ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Has Content:</span>
              <span className={hasContent ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                {hasContent ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round(streamingProgress)}%
              </span>
            </div>
            
            {error && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Error:</span>
                <span className="text-red-600">{error}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Streaming Output
          </h2>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 min-h-[200px]">
            {currentText ? (
              <div className="text-gray-900 dark:text-white">
                <p className="whitespace-pre-wrap">{currentText}</p>
                {isStreaming && (
                  <span className="animate-pulse ml-1">▊</span>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No streaming content yet...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 