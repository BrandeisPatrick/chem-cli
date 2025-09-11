import React from 'react';
import { Box } from 'ink';
import { ChatMessage } from './ChatMessage.js';
import { StreamingMessage } from './StreamingMessage.js';
import { ThinkingMessage } from './ThinkingMessage.js';

export const ScrollableChat = ({
  messages = [],
  streamingContent = '',
  isStreaming = false,
  isThinking = false
}) => {
  // Early return if no messages and not streaming/thinking
  if (messages.length === 0 && !isStreaming && !isThinking) {
    return React.createElement(Box, { flexDirection: 'column' });
  }

  return (
    React.createElement(Box, {
      flexDirection: 'column'
    },
      // Render all messages naturally without viewport limitations
      ...messages.map((message, index) =>
        React.createElement(ChatMessage, {
          key: `msg-${index}-${message.type}-${message.content?.slice(0, 20)}`,
          type: message.type,
          message: message.content,
          responseTime: message.responseTime
        })
      ),

      // Streaming message (always visible when active)
      isStreaming && React.createElement(StreamingMessage, {
        content: streamingContent,
        isStreaming: true,
        isComplete: false
      }),

      // Thinking indicator (always visible when active)
      isThinking && !isStreaming && React.createElement(ThinkingMessage)
    )
  );
};