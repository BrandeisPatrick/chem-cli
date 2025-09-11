import React from 'react';
import { Box, Text } from 'ink';
import { themeManager } from '../theme.js';

export const ChatMessage = ({ message, type = 'assistant', responseTime = null }) => {
  const isUser = type === 'user';
  const isError = type === 'error';
  const isInfo = type === 'info';

  const color =
    isUser ? themeManager.getColor('userMessage') :
    isError ? themeManager.getColor('errorMessage') :
    isInfo ? themeManager.getColor('systemMessage') :
    themeManager.getColor('assistantMessage');

  const prefix =
    isUser ? '>' :
    isError ? '!' :
    isInfo ? '•' :
    '•';

  const boxStyle = themeManager.getComponentStyle('chatMessage');

  // Split message by line breaks and handle multi-line content
  const messageContent = String(message ?? '').trim();
  const lines = messageContent.split('\n');

  return (
    React.createElement(Box, {
      borderStyle: boxStyle.borderStyle || 'round',
      borderColor: themeManager.getColor('border'),
      paddingX: boxStyle.paddingX ?? 1,
      paddingY: boxStyle.paddingY ?? 0,
      marginBottom: boxStyle.marginBottom ?? 1,
      flexDirection: 'column'
    },
      // Render first line with prefix
      React.createElement(Text, { color, wrap: 'wrap' }, `${prefix} ${lines[0] || ''}`),
      // Render subsequent lines without prefix, preserving indentation
      ...lines.slice(1).map((line, index) =>
        React.createElement(Text, { 
          key: index, 
          color, 
          wrap: 'wrap' 
        }, line || ' ') // Use space for empty lines to preserve spacing
      ),
      responseTime != null && React.createElement(Text, { dimColor: true }, `(${responseTime} ms)`)
    )
  );
};