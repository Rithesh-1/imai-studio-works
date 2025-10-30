# Streaming Integration Documentation

## Overview

This document describes the integration of the streamer package with the IMAI web UI to provide real-time text streaming functionality.

## Architecture

### 1. Streamer Package (`streamer_package/`)
- **TextStreamingComponent**: Core streaming class that handles OpenAI API calls
- **Types**: TypeScript interfaces for streaming requests and responses
- **Features**: Callback-based streaming with error handling

### 2. Streaming Client (`lib/streamingClient.ts`)
- **StreamingClient**: Wrapper around TextStreamingComponent with React state management
- **State Management**: Tracks streaming state (isStreaming, currentText, isComplete, error)
- **Callback System**: Notifies React components of state changes

### 3. React Hook (`hooks/useStreaming.ts`)
- **useStreaming**: Custom React hook that provides streaming functionality
- **State Integration**: Manages streaming state in React components
- **Progress Tracking**: Calculates streaming progress percentage

### 4. React Context (`contexts/StreamingContext.tsx`)
- **StreamingProvider**: Provides streaming state across the entire app
- **useStreamingContext**: Hook to access streaming functionality from any component
- **Message Management**: Tracks which message is currently streaming

### 5. UI Components
- **StreamingMessage**: Component for displaying streaming text with progress
- **ChatWindow**: Updated to show real-time streaming content
- **Test Page**: `/test-streaming` for testing streaming functionality

## Key Features

### Real-time Text Streaming
```typescript
// Start streaming
const request: StreamingRequest = {
  prompt: "Hello, how can you help me?",
  config: {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    stream: true,
  },
};

await startStreaming(request);
```

### Progress Tracking
- Visual progress bar showing completion percentage
- Real-time text updates with typing cursor animation
- Error handling with user-friendly messages

### State Management
```typescript
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
```

## Integration Points

### 1. Form Submission (`app/page.tsx`)
- Automatically starts streaming for casual conversations
- Integrates with existing API calls
- Handles both streaming and non-streaming responses

### 2. Message Display (`app/components/chat/chatwindow.tsx`)
- Shows real-time streaming text
- Displays progress bar during streaming
- Handles streaming cursor animation

### 3. Context Provider (`app/layout.tsx`)
- Wraps the entire app with StreamingProvider
- Enables streaming functionality across all components

## Usage Examples

### Basic Streaming
```typescript
import { useStreamingContext } from '@/contexts/StreamingContext';

function MyComponent() {
  const { startStreaming, currentText, isStreaming } = useStreamingContext();
  
  const handleStream = async () => {
    await startStreaming({
      prompt: "Tell me a story",
      config: { model: 'gpt-3.5-turbo', stream: true }
    });
  };
  
  return (
    <div>
      <button onClick={handleStream}>Start Streaming</button>
      {isStreaming && <p>{currentText}▊</p>}
    </div>
  );
}
```

### Message Integration
```typescript
// In ChatWindow component
{isStreamingMessage(msg.id) && hasContent 
  ? currentText 
  : msg.text}
{isStreamingMessage(msg.id) && isStreaming && (
  <span className="animate-pulse ml-1">▊</span>
)}
```

## Testing

### Test Page
Visit `/test-streaming` to test streaming functionality:
- Enter a test message
- Start streaming
- View real-time updates
- Monitor progress and status

### Manual Testing
1. Start the development server
2. Navigate to `/test-streaming`
3. Enter a message and click "Start Streaming"
4. Observe real-time text updates
5. Test error handling and stopping functionality

## Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Model Configuration
```typescript
const config: StreamingConfig = {
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
  stream: true,
};
```

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- User-friendly error messages
- Graceful fallback to non-streaming mode

### API Errors
- Detailed error logging
- Context-aware error messages
- Recovery mechanisms

## Performance Considerations

### Memory Management
- Automatic cleanup of streaming connections
- State reset on component unmount
- Efficient re-rendering with React state

### Network Optimization
- Streaming over HTTP/2 for better performance
- Connection pooling for multiple requests
- Automatic reconnection on network issues

## Future Enhancements

### Planned Features
1. **Multi-streaming**: Support for multiple concurrent streams
2. **Streaming History**: Save and replay streaming sessions
3. **Custom Models**: Support for different AI models
4. **Advanced UI**: More sophisticated progress indicators
5. **Offline Support**: Queue streaming requests when offline

### Technical Improvements
1. **WebSocket Support**: Real-time bidirectional communication
2. **Streaming Analytics**: Track streaming performance metrics
3. **Caching**: Cache streaming responses for better UX
4. **Compression**: Optimize streaming data transfer

## Troubleshooting

### Common Issues

1. **Streaming not starting**
   - Check OpenAI API key configuration
   - Verify network connectivity
   - Check browser console for errors

2. **Text not updating**
   - Ensure StreamingProvider is properly configured
   - Check React state updates
   - Verify callback registration

3. **Progress bar not showing**
   - Check streamingProgress calculation
   - Verify CSS classes and styling
   - Ensure proper state management

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Streaming state:', { isStreaming, currentText, error });
```

## Conclusion

The streaming integration provides a seamless real-time experience for users interacting with the AI. The modular architecture allows for easy maintenance and future enhancements while maintaining high performance and reliability. 