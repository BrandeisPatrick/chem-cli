import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { themeManager } from '../theme.js';

export const ThinkingMessage = ({ width = 76 }) => {
  const borderColor = themeManager.getColor('border');
  const header = themeManager.getColor('primary');
  const text = themeManager.getColor('secondary');

  return (
    React.createElement(Box, { flexDirection: 'row', marginBottom: 1, alignItems: 'center' },
      React.createElement(Spinner, { type: 'dots' }),
      React.createElement(Text, { color: text, dimColor: true, marginLeft: 1 }, 'Thinking...')
    )
  );
};