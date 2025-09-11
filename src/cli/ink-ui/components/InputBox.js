import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { themeManager } from '../theme.js';

export const InputBox = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState([]);
  const [idx, setIdx] = useState(-1);

  // arrow-key history like Gemini's CLI
  useInput((input, key) => {
    if (key.upArrow && history.length) {
      const next = Math.min(history.length - 1, idx + 1);
      setIdx(next);
      setValue(history[history.length - 1 - next] || '');
    } else if (key.downArrow && history.length) {
      const next = Math.max(-1, idx - 1);
      setIdx(next);
      setValue(next === -1 ? '' : (history[history.length - 1 - next] || ''));
    } else if (key.ctrl && input === 'u') {
      setValue('');
    }
  });

  const submit = (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    setHistory((h) => [...h.slice(-99), trimmed]);
    setIdx(-1);
    setValue('');
    onSubmit && onSubmit(trimmed);
  };

  const promptColor = themeManager.getColor('inputPrompt');

  return (
    React.createElement(Box, { 
      borderStyle: themeManager.getComponentStyle('inputBox').borderStyle || 'round', 
      borderColor: themeManager.getColor('border'),
      paddingX: 1, 
      marginTop: 1 
    },
      React.createElement(Text, { color: promptColor }, '> '),
      React.createElement(TextInput, {
        value,
        onChange: setValue,
        onSubmit: submit,
        placeholder: 'Type your message or @path/to/file'
      })
    )
  );
};