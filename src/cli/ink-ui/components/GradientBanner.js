import React from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import { themeManager } from '../theme.js';

export const GradientBanner = ({ compact = false }) => {
  const style = themeManager.getComponentStyle('banner');
  const banner = themeManager.getGradient('banner');
  const subtitle = themeManager.getGradient('subtitle');

  if (compact) {
    return (
      React.createElement(Box, { 
        flexDirection: 'column',
        marginTop: 2,
        marginBottom: 2
      },
        React.createElement(Box, { 
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        },
          React.createElement(Gradient, { name: banner }, React.createElement(Text, { bold: true }, 'ChemCLI')),
          React.createElement(Text, null, ' '),
          React.createElement(Gradient, { name: subtitle }, React.createElement(Text, null, '⚛️ Natural Language Computational Chemistry'))
        )
      )
    );
  }

  return (
    React.createElement(Box, { flexDirection: 'column', alignItems: style.alignItems || 'center', marginBottom: style.marginBottom || 1 },
      React.createElement(Gradient, { name: banner }, React.createElement(BigText, { text: 'CHEMCLI' })),
      React.createElement(Box, { marginTop: 1 },
        React.createElement(Gradient, { name: subtitle }, React.createElement(Text, null, '⚛️  Natural Language Computational Chemistry  ⚛️'))
      )
    )
  );
};