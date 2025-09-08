import readline from 'readline';
import chalk from 'chalk';

export class GeminiUI {
  constructor() {
    this.rl = null;
    this.history = [];
    this.historyIndex = -1;
    this.terminalWidth = process.stdout.columns || 80;
    this.currentModel = 'openai/gpt-4';
    this.status = 'Ready';
    
    // Listen for terminal resize
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns || 80;
    });
  }

  async start(handleInput) {
    this.handleInput = handleInput;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      history: this.history,
      completer: this.completer.bind(this)
    });

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      this.showHelp();
    });

    // Handle each line of input
    this.rl.on('line', async (input) => {
      if (input.trim()) {
        this.history.push(input.trim());
        // Keep only last 100 commands
        if (this.history.length > 100) {
          this.history.shift();
        }
      }
      
      try {
        this.setStatus('Thinking');
        await this.handleInput(input.trim());
      } catch (error) {
        this.showError(`Error: ${error.message}`);
      }
      
      this.setStatus('Ready');
      console.log(); // Add spacing
      this.rl.prompt();
    });

    // Handle close
    this.rl.on('close', () => {
      console.log(chalk.green('\n👋 Thanks for using ChemCLI! Happy chemistry! 🧪✨'));
      process.exit(0);
    });

    // Start the prompt
    this.rl.prompt();
  }

  getPrompt() {
    return chalk.cyan('> 🧪 ');
  }

  setModel(provider, model) {
    this.currentModel = `${provider}/${model}`;
    // Show model change as an info message instead of in prompt
    this.showInfo(`Using ${provider}/${model}`);
  }

  setStatus(status) {
    this.status = status;
    // Don't clutter the prompt with status updates
  }

  showMessage(content, type = 'response') {
    const boxWidth = Math.min(this.terminalWidth - 2, 78); // Leave some margin
    const topBorder = '╭' + '─'.repeat(boxWidth - 2) + '╮';
    const bottomBorder = '╰' + '─'.repeat(boxWidth - 2) + '╯';
    
    let color;
    switch (type) {
      case 'response':
        color = chalk.cyan;
        break;
      case 'error':
        color = chalk.red;
        break;
      case 'info':
        color = chalk.yellow;
        break;
      default:
        color = chalk.white;
    }

    console.log(color(topBorder));
    
    // Add some padding and wrap content
    const contentWidth = boxWidth - 4; // Account for borders and padding
    const lines = this.wrapText(content, contentWidth);
    
    lines.forEach(line => {
      const padding = ' '.repeat(Math.max(0, contentWidth - line.length));
      console.log(color(`│ ${line}${padding} │`));
    });
    
    console.log(color(bottomBorder));
  }

  showResponse(content) {
    this.showMessage(content, 'response');
  }

  showError(content) {
    this.showMessage(content, 'error');
  }

  showInfo(content) {
    this.showMessage(content, 'info');
  }

  showStreamingResponse(content, isComplete = false) {
    if (!this.streamingStarted) {
      const boxWidth = Math.min(this.terminalWidth - 2, 78);
      const topBorder = '╭' + '─'.repeat(boxWidth - 2) + '╮';
      console.log(chalk.cyan(topBorder));
      console.log(chalk.cyan('│'));
      this.streamingStarted = true;
    }

    // Stream content without box formatting during streaming
    process.stdout.write(chalk.white(content));

    if (isComplete) {
      const boxWidth = Math.min(this.terminalWidth - 2, 78);
      const bottomBorder = '╰' + '─'.repeat(boxWidth - 2) + '╯';
      console.log('\n' + chalk.cyan(bottomBorder));
      this.streamingStarted = false;
    }
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length ? lines : [''];
  }

  showHelp() {
    console.log(chalk.yellow('\n💡 ChemCLI Commands:'));
    console.log(chalk.gray('   • Type chemistry questions naturally'));
    console.log(chalk.gray('   • "help" - Show detailed help'));
    console.log(chalk.gray('   • "exit" - Quit ChemCLI'));
    console.log(chalk.gray('   • "status" - Show system status'));
    console.log(chalk.gray('   • Ctrl+C - Show this help'));
  }

  completer(line) {
    // Auto-completion suggestions
    const completions = [
      // Common molecules
      'benzene', 'water', 'methane', 'ethanol', 'acetone', 'caffeine', 'glucose',
      
      // Methods
      'B3LYP', 'M06-2X', 'PBE0', 'wB97XD', 'MP2', 'CCSD', 'xTB', 'GFN2-xTB',
      
      // Basis sets
      'def2-SVP', 'def2-TZVP', 'def2-QZVP', '6-31G*', '6-311++G**', 'cc-pVDZ', 'cc-pVTZ',
      
      // Calculation types
      'optimize', 'frequency', 'HOMO-LUMO', 'NMR', 'UV-Vis', 'TDDFT', 'thermochemistry',
      
      // Commands
      'help', 'clear', 'status', 'exit',
      
      // Common phrases
      'Calculate the', 'Optimize the geometry of', 'What is the', 'Compare',
      'Using B3LYP', 'with xTB', 'in water', 'SMD solvation'
    ];

    const hits = completions.filter((c) => c.toLowerCase().startsWith(line.toLowerCase()));
    
    // Show all completions, or just the matched part
    return [hits.length ? hits : completions, line];
  }

  close() {
    if (this.rl) {
      this.rl.close();
    }
  }

  exit() {
    this.close();
  }
}