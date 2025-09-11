/**
 * Layout utilities for proper terminal text measurement and message slicing
 */
import wrapAnsi from 'wrap-ansi';
import stripAnsi from 'strip-ansi';

/**
 * Measure how many lines a text string will take when rendered in terminal
 * @param {string} text - The text to measure
 * @param {number} columns - Terminal width in columns
 * @returns {number} Number of lines the text will occupy
 */
export function measureLines(text = '', columns = 80) {
  if (!text) return 1;
  
  try {
    // Remove ANSI codes before wrapping to get accurate line count
    const plain = stripAnsi(String(text));
    
    // Use wrap-ansi for proper text wrapping
    const wrapped = wrapAnsi(plain, Math.max(1, columns), {
      hard: false,
      trim: false
    });
    
    return wrapped.split('\n').length;
  } catch (error) {
    // Fallback to simple calculation if wrap-ansi fails
    const lines = String(text).split('\n');
    let totalLines = 0;
    
    for (const line of lines) {
      if (line.length === 0) {
        totalLines += 1;
      } else {
        const wrappedLines = Math.ceil(line.length / Math.max(1, columns));
        totalLines += wrappedLines;
      }
    }
    
    return Math.max(1, totalLines);
  }
}

/**
 * Calculate which messages can fit in the available terminal space
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Layout options
 * @param {number} options.columns - Terminal width
 * @param {number} options.availableRows - Available rows for messages
 * @param {number} options.gutter - Left/right padding
 * @param {number} options.padPerMessage - Vertical spacing per message
 * @returns {Array} Sliced array of messages that fit
 */
export function sliceMessagesToFit(messages, {
  columns = 80,
  availableRows = 10,
  gutter = 4,
  padPerMessage = 1,
}) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  const result = [];
  let usedRows = 0;
  const effectiveWidth = Math.max(20, columns - gutter);

  // Work backwards from the most recent message
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    
    // Calculate lines needed for message content
    const contentLines = measureLines(message.content, effectiveWidth);
    
    // Add lines for response time if it's an assistant message
    const metaLines = (message.type === 'assistant' && message.responseTime) ? 1 : 0;
    
    // Total lines for this message including padding
    const totalLines = contentLines + metaLines + padPerMessage;
    
    // Check if this message would fit
    if (usedRows + totalLines > availableRows) {
      break; // Stop if this message won't fit
    }
    
    usedRows += totalLines;
    result.unshift(message); // Add to beginning since we're working backwards
  }
  
  return result;
}

/**
 * Calculate row budget for different UI sections
 * @param {number} totalRows - Total terminal height
 * @param {Object} sections - Different UI sections
 * @returns {Object} Row allocations
 */
export function calculateRowBudget(totalRows, {
  hasMessages = false,
  isStreaming = false,
  fullHeaderRows = 8,  // Full header when no messages
  compactHeaderRows = 1, // Compact header when messages exist
  inputRows = 1,
  statusRows = 1,
  streamingRows = 2,
  minMessageRows = 3,
}) {
  const reservedRows = inputRows + statusRows + (isStreaming ? streamingRows : 0);
  
  // Always reserve space for header - compact when messages exist, full when none
  const headerRows = hasMessages ? compactHeaderRows : fullHeaderRows;
  
  const availableForMessages = Math.max(
    minMessageRows,
    totalRows - reservedRows - headerRows
  );
  
  return {
    header: headerRows,
    messages: availableForMessages,
    streaming: isStreaming ? streamingRows : 0,
    input: inputRows,
    status: statusRows,
    total: totalRows
  };
}