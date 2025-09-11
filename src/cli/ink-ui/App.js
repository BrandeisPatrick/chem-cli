import React, { useEffect, useState } from 'react';
import { Box, useStdout } from 'ink';
import { GradientBanner } from './components/GradientBanner.js';
import { ChatMessage } from './components/ChatMessage.js';
import { InputBox } from './components/InputBox.js';
import { StatusBar } from './components/StatusBar.js';
import { StreamingMessage } from './components/StreamingMessage.js';
import { ThinkingMessage } from './components/ThinkingMessage.js';
import { UpdateStrip, Tips } from './components/UpdateStrip.js';
import { STARTUP_TIPS } from '../../shared/help-content.js';

export const App = (props) => {
  const {
    onUserInput,
    messages = [],
    streamingContent = '',
    isStreaming = false,
    isThinking = false,
    status = 'ready',
    model = 'openai/gpt-4',
    errors = 0,
    showUpdate = true,
    showTips = true
  } = props;

  const { stdout } = useStdout();
  const width = Math.max(60, stdout?.columns ?? 80);
  const height = Math.max(18, stdout?.rows ?? 24);
  const contentWidth = Math.min(80, width - 4); // keeps tips/update at a nice measure

  const [live, setLive] = useState('');
  useEffect(() => setLive(isStreaming ? streamingContent : ''), [isStreaming, streamingContent]);

  const handleUserInput = (t) => onUserInput && onUserInput(t);

  return (
    React.createElement(Box, { flexDirection: 'column', width, height },
      messages.length === 0 ? (
        React.createElement(React.Fragment, null,
          // HERO region fills the middle and centers its children
          React.createElement(Box, {
            flexDirection: 'column',
            flexGrow: 1,
            alignItems: 'center',        // horizontal center
            justifyContent: 'center'     // vertical center
          },
            React.createElement(GradientBanner),

            // Keep text blocks narrower but centered
            React.createElement(Box, { width: contentWidth, flexDirection: 'column', marginTop: 1 },
              React.createElement(Tips, { tips: STARTUP_TIPS, currentTip: 0, showTips }),
              React.createElement(UpdateStrip, { version: '1.0.0', newVersion: '1.1.0', showUpdate: false })
            )
          ),

          // Input + footer are pinned to bottom by not growing
          React.createElement(Box, { flexShrink: 0 },
            React.createElement(InputBox, { onSubmit: handleUserInput })
          ),
          React.createElement(StatusBar, {
            cwd: process.cwd(),
            status,
            model,
            contextUsage: '1% context (36k/3M limit)',
            errors,
            showFooter: true
          })
        )
      ) : (
        React.createElement(React.Fragment, null,
          // Compact header once conversation begins
          React.createElement(GradientBanner, { compact: true }),

          React.createElement(Box, { flexDirection: 'column', flexGrow: 1 },
            messages.map((m, i) =>
              React.createElement(ChatMessage, {
                key: `${i}-${m.type}`,
                type: m.type,
                message: m.content,
                responseTime: m.responseTime
              })
            ),
            isStreaming && React.createElement(StreamingMessage, {
              content: live,
              isStreaming: true,
              isComplete: false
            }),
            isThinking && !isStreaming && React.createElement(ThinkingMessage),
            React.createElement(InputBox, { onSubmit: handleUserInput })
          ),

          React.createElement(StatusBar, {
            cwd: process.cwd(),
            status,
            model,
            contextUsage: '1% context (36k/3M limit)',
            errors,
            showFooter: true
          })
        )
      )
    )
  );
};