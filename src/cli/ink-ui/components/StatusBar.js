import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { themeManager } from '../theme.js';

export const StatusBar = ({
  cwd = process.cwd(),
  status = 'ready',
  model = 'openai/gpt-4',
  contextUsage = '1% context (36k/3M limit)',
  errors = 0,
  showFooter = true
}) => {
  if (!showFooter) return null;

  const style = themeManager.getComponentStyle('statusBar');
  const gradient = themeManager.getGradient('footer');

  const short = cwd.replace(process.env.HOME || '/Users', '~');
  const parts = [
    short,
    status.toLowerCase(),
    model,
    contextUsage,
    errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : null
  ].filter(Boolean);

  return (
    React.createElement(Box, {
      borderStyle: style.borderStyle || 'single',
      borderTop: style.borderTop ?? true,
      paddingX: style.paddingX ?? 1,
      marginTop: style.marginTop ?? 1
    },
      React.createElement(Gradient, { name: gradient },
        React.createElement(Text, null, parts.join(' | '))
      )
    )
  );
};