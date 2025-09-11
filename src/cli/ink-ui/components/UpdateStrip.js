import React from 'react';
import { Box, Text } from 'ink';
import { themeManager } from '../theme.js';

export const UpdateStrip = ({ version = '1.0.0', newVersion = '1.1.0', showUpdate = true }) => {
  if (!showUpdate) return null;
  const borderColor = themeManager.getColor('borderWarning');
  const textColor = themeManager.getColor('systemMessage');
  const accent = themeManager.getColor('accent');

  return (
    React.createElement(Box, { borderStyle: 'round', borderColor, paddingX: 1, marginBottom: 1, flexDirection: 'row', justifyContent: 'space-between' },
      React.createElement(Box, { flexDirection: 'row' },
        React.createElement(Text, { color: accent }, '🚀 '),
        React.createElement(Text, { color: textColor }, `ChemCLI update available! v${version} → v${newVersion}`)
      ),
      React.createElement(Text, { dimColor: true }, 'Install via: npm update -g chem-cli')
    )
  );
};

export const Tips = ({ tips = [], currentTip = 0, showTips = true }) => {
  if (!showTips || !tips.length) return null;
  const tip = tips[currentTip] || tips[0];
  const border = themeManager.getColor('border');
  const text = themeManager.getColor('primary');
  const accent = themeManager.getColor('accent');

  return (
    React.createElement(Box, { borderStyle: 'round', borderColor: border, paddingX: 1, marginBottom: 1, flexDirection: 'row' },
      React.createElement(Text, { color: accent }, '💡 '),
      React.createElement(Text, { color: text }, tip)
    )
  );
};