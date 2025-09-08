import readline from 'readline';
import chalk from 'chalk';

export class ChatBar {
  constructor() {
    this.rl = null;
    this.currentInput = '';
    this.cursorPosition = 0;
    this.history = [];
    this.historyIndex = -1;
    this.isVisible = false;
    this.terminalWidth = process.stdout.columns || 80;
    this.terminalHeight = process.stdout.rows || 24;
    
    // Listen for terminal resize
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns || 80;
      this.terminalHeight = process.stdout.rows || 24;
      if (this.isVisible) {
        this.redraw();
      }
    });
  }

  async start(handleInput) {
    this.handleInput = handleInput;
    
    // Enable raw mode to capture all keystrokes
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // Hide cursor initially
    process.stdout.write('\x1B[?25l');
    
    this.isVisible = true;
    this.drawChatBar();
    
    // Handle keystrokes
    process.stdin.on('data', this.handleKeypress.bind(this));
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      this.showHelp();
    });
  }

  handleKeypress(key) {
    const char = key.toString();
    
    // Handle special keys
    if (char === '\u0003') { // Ctrl+C
      this.showHelp();
      return;
    }
    
    if (char === '\u0004') { // Ctrl+D
      this.exit();
      return;
    }
    
    if (char === '\r' || char === '\n') { // Enter
      this.submitInput();
      return;
    }
    
    if (char === '\u007f' || char === '\b') { // Backspace/Delete
      this.handleBackspace();
      return;
    }
    
    if (char === '\u001b[A') { // Up arrow
      this.navigateHistory('up');
      return;
    }
    
    if (char === '\u001b[B') { // Down arrow
      this.navigateHistory('down');
      return;
    }
    
    if (char === '\u001b[C') { // Right arrow
      this.moveCursor('right');
      return;
    }
    
    if (char === '\u001b[D') { // Left arrow
      this.moveCursor('left');
      return;
    }
    
    if (char === '\u001b[H') { // Home
      this.cursorPosition = 0;
      this.redrawInput();
      return;
    }
    
    if (char === '\u001b[F') { // End
      this.cursorPosition = this.currentInput.length;
      this.redrawInput();
      return;
    }
    
    // Handle escape sequences (skip them)
    if (char.charCodeAt(0) === 27) {
      return;
    }
    
    // Handle regular characters
    if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127) {
      this.insertCharacter(char);
    }
  }

  insertCharacter(char) {
    this.currentInput = 
      this.currentInput.slice(0, this.cursorPosition) + 
      char + 
      this.currentInput.slice(this.cursorPosition);
    this.cursorPosition++;
    this.redrawInput();
  }

  handleBackspace() {
    if (this.cursorPosition > 0) {
      this.currentInput = 
        this.currentInput.slice(0, this.cursorPosition - 1) + 
        this.currentInput.slice(this.cursorPosition);
      this.cursorPosition--;
      this.redrawInput();
    }
  }

  moveCursor(direction) {
    if (direction === 'left' && this.cursorPosition > 0) {
      this.cursorPosition--;
    } else if (direction === 'right' && this.cursorPosition < this.currentInput.length) {
      this.cursorPosition++;
    }
    this.redrawInput();
  }

  navigateHistory(direction) {
    if (direction === 'up' && this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentInput = this.history[this.history.length - 1 - this.historyIndex] || '';
    } else if (direction === 'down' && this.historyIndex >= 0) {
      this.historyIndex--;
      if (this.historyIndex === -1) {
        this.currentInput = '';
      } else {
        this.currentInput = this.history[this.history.length - 1 - this.historyIndex] || '';
      }
    }
    this.cursorPosition = this.currentInput.length;
    this.redrawInput();
  }

  async submitInput() {
    const input = this.currentInput.trim();
    
    if (!input) {
      return;
    }
    
    // Add to history
    if (this.history[this.history.length - 1] !== input) {
      this.history.push(input);
      // Keep only last 100 commands
      if (this.history.length > 100) {
        this.history.shift();
      }
    }
    this.historyIndex = -1;
    
    // Clear the input
    this.currentInput = '';
    this.cursorPosition = 0;
    
    // Hide chat bar temporarily
    this.clearChatBar();
    
    try {
      // Process the input
      await this.handleInput(input);
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
    
    // Redraw chat bar
    console.log(); // Add spacing
    this.drawChatBar();
  }

  drawChatBar() {
    const boxHeight = 3; // Top border, input line, bottom border
    const startLine = this.terminalHeight - boxHeight + 1;
    
    // Draw top border
    process.stdout.write(`\x1B[${startLine};1H`);
    const topBorder = chalk.gray('┌' + '─'.repeat(this.terminalWidth - 2) + '┐');
    process.stdout.write(topBorder);
    
    // Draw input line with side borders
    process.stdout.write(`\x1B[${startLine + 1};1H`);
    process.stdout.write(chalk.gray('│ '));
    
    // Draw prompt
    const prompt = chalk.cyan.bold('🧪 ');
    process.stdout.write(prompt);
    
    this.redrawInput();
    
    // Draw bottom border
    process.stdout.write(`\x1B[${startLine + 2};1H`);
    const bottomBorder = chalk.gray('└' + '─'.repeat(this.terminalWidth - 2) + '┘');
    process.stdout.write(bottomBorder);
    
    // Position cursor back to input area
    this.positionCursor();
  }

  redrawInput() {
    const borderWidth = 2; // '│ ' 
    const promptWidth = 3; // '🧪 '
    const rightBorderWidth = 1; // ' │'
    const availableWidth = this.terminalWidth - borderWidth - promptWidth - rightBorderWidth - 1;
    
    // Calculate which part of the input to show
    let displayInput = this.currentInput;
    let displayCursor = this.cursorPosition;
    
    if (displayInput.length > availableWidth) {
      if (this.cursorPosition > availableWidth - 10) {
        const start = Math.max(0, this.cursorPosition - availableWidth + 20);
        displayInput = '...' + displayInput.slice(start);
        displayCursor = this.cursorPosition - start + 3;
      } else {
        displayInput = displayInput.slice(0, availableWidth - 3) + '...';
      }
    }
    
    const inputLine = this.terminalHeight - 2; // Middle line of the 3-line box
    
    // Clear the input area (everything after prompt)
    process.stdout.write(`\x1B[${inputLine};${borderWidth + promptWidth + 1}H\x1B[0K`);
    
    // Write input text
    process.stdout.write(chalk.white(displayInput));
    
    // Add padding and right border
    const padding = Math.max(0, availableWidth - displayInput.length);
    process.stdout.write(' '.repeat(padding));
    process.stdout.write(chalk.gray('│'));
    
    this.positionCursor();
  }

  positionCursor() {
    const borderWidth = 2; // '│ '
    const promptWidth = 3; // '🧪 '
    const inputLine = this.terminalHeight - 2; // Middle line of the 3-line box
    const availableWidth = this.terminalWidth - borderWidth - promptWidth - 2;
    
    let displayCursor = this.cursorPosition;
    
    if (this.currentInput.length > availableWidth) {
      if (this.cursorPosition > availableWidth - 10) {
        const start = Math.max(0, this.cursorPosition - availableWidth + 20);
        displayCursor = this.cursorPosition - start + 3;
      }
    }
    
    // Position cursor in the input area
    process.stdout.write(`\x1B[${inputLine};${borderWidth + promptWidth + 1 + displayCursor}H`);
    
    // Show cursor
    process.stdout.write('\x1B[?25h');
  }

  clearChatBar() {
    const boxHeight = 3;
    const startLine = this.terminalHeight - boxHeight + 1;
    
    // Clear all 3 lines of the chat box
    for (let i = 0; i < boxHeight; i++) {
      process.stdout.write(`\x1B[${startLine + i};1H\x1B[2K`);
    }
    
    // Move cursor to just above the chat bar
    process.stdout.write(`\x1B[${startLine - 1};1H`);
  }

  redraw() {
    this.drawChatBar();
  }

  showHelp() {
    this.clearChatBar();
    console.log(chalk.yellow('\n💡 ChemCLI Commands:'));
    console.log(chalk.gray('   • Type chemistry questions naturally'));
    console.log(chalk.gray('   • "help" - Show detailed help'));
    console.log(chalk.gray('   • "exit" - Quit ChemCLI'));
    console.log(chalk.gray('   • Ctrl+D - Quick exit'));
    console.log(chalk.gray('   • ↑↓ arrows - Navigate history'));
    this.drawChatBar();
  }

  exit() {
    this.clearChatBar();
    process.stdout.write('\x1B[?25h'); // Show cursor
    process.stdin.setRawMode(false);
    console.log(chalk.green('\n👋 Thanks for using ChemCLI! Happy chemistry! 🧪✨'));
    process.exit(0);
  }

  close() {
    if (this.isVisible) {
      this.clearChatBar();
      process.stdout.write('\x1B[?25h'); // Show cursor
      process.stdin.setRawMode(false);
      this.isVisible = false;
    }
  }
}