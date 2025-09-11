import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { themeManager } from '../theme.js';

export const StreamingMessage = ({
  content = '',
  isStreaming = false,
  isComplete = false,
  onComplete = null,
  width = 76
}) => {
  const [display, setDisplay] = useState('');
  const [cursor, setCursor] = useState(false);

  const borderColor = themeManager.getColor('border');
  const header = themeManager.getColor('primary');
  const text = themeManager.getColor('primary');
  const caret = themeManager.getColor('accent');

  useEffect(() => {
    if (isStreaming) {
      setDisplay(content);
    } else if (isComplete) {
      setDisplay(content);
      setCursor(false);
      onComplete && onComplete();
    }
  }, [content, isStreaming, isComplete, onComplete]);

  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(id);
  }, [isStreaming]);

  if (!content && !isStreaming) return null;

  return (
    React.createElement(Box, {
      borderStyle: 'round',
      borderColor,
      paddingX: 1,
      paddingY: 0,
      marginBottom: 1,
      flexDirection: 'column'
    },
      React.createElement(Box, { alignItems: 'center', marginBottom: 1 },
        React.createElement(Spinner, { type: 'dots' }),
        React.createElement(Text, { color: text, dimColor: true, marginLeft: 1 }, 'Responding...')
      ),
      React.createElement(Text, { color: text, wrap: 'wrap' },
        display,
        isStreaming && cursor && React.createElement(Text, { color: caret }, '│')
      )
    )
  );
};