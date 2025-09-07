import chalk from 'chalk';
import ora from 'ora';

export class Renderer {
  constructor() {
    this.currentSpinner = null;
  }

  showSpinner(text) {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
    }
    
    this.currentSpinner = ora({
      text: chalk.cyan(text),
      color: 'cyan',
      spinner: {
        interval: 100,
        frames: ['⚛', '⚛', '⚛', '⚛', '⚛', '⚛']
      }
    }).start();
    
    return this.currentSpinner;
  }

  showCalculationSpinner(calculationType) {
    const messages = {
      optimization: '🔧 Optimizing molecular geometry...',
      frequencies: '📊 Calculating vibrational frequencies...',
      homo_lumo: '⚡ Computing electronic structure...',
      nmr: '🧲 Predicting NMR chemical shifts...',
      uvvis: '🌈 Computing UV-Vis spectrum...',
      install: '📦 Installing quantum chemistry software...',
      parsing: '📋 Parsing calculation results...'
    };
    
    const message = messages[calculationType] || '🧪 Running calculation...';
    
    return this.showSpinner(message);
  }

  stopSpinner() {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
  }

  success(message) {
    console.log(chalk.green(`✓ ${message}`));
  }

  error(message) {
    console.log(chalk.red(`✗ ${message}`));
  }

  info(message) {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  warning(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
  }

  table(data, headers) {
    // Beautiful table rendering for terminal
    const columnWidths = headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      return Math.max(maxLength, 8);
    });

    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + (headers.length - 1) * 3 + 4;

    // Header
    console.log(chalk.cyan(`╭${'─'.repeat(totalWidth - 2)}╮`));
    
    const headerRow = headers.map((header, i) => 
      chalk.bold.yellow(header.padEnd(columnWidths[i]))
    ).join(chalk.cyan(' │ '));
    
    console.log(chalk.cyan(`│ `) + headerRow + chalk.cyan(` │`));
    console.log(chalk.cyan(`├${'─'.repeat(totalWidth - 2)}┤`));

    // Data rows
    data.forEach((row, index) => {
      const dataRow = headers.map((header, i) => {
        const value = String(row[header] || '');
        const colored = this.colorizeValue(value);
        return colored.padEnd(columnWidths[i] + (colored.length - value.length));
      }).join(chalk.cyan(' │ '));
      
      console.log(chalk.cyan(`│ `) + dataRow + chalk.cyan(` │`));
    });

    console.log(chalk.cyan(`╰${'─'.repeat(totalWidth - 2)}╯`));
  }

  colorizeValue(value) {
    // Colorize different types of values
    if (value.includes('eV')) return chalk.yellow(value);
    if (value.includes('Eh')) return chalk.green(value);
    if (value.includes('kcal/mol')) return chalk.blue(value);
    if (value.includes('cm⁻¹') || value.includes('cm-1')) return chalk.magenta(value);
    if (value.includes('Å')) return chalk.cyan(value);
    if (value.match(/^\d+\.?\d*$/)) return chalk.white.bold(value);
    if (value.includes('✓')) return chalk.green(value);
    if (value.includes('✗')) return chalk.red(value);
    if (value.includes('⚠')) return chalk.yellow(value);
    
    return chalk.white(value);
  }

  progress(current, total, label) {
    const percentage = Math.round((current / total) * 100);
    const filledLength = Math.round((current / total) * 20);
    const bar = '█'.repeat(filledLength) + '░'.repeat(20 - filledLength);
    
    process.stdout.write(`\r${chalk.blue(label)} [${bar}] ${percentage}%`);
    
    if (current === total) {
      console.log(); // New line when complete
    }
  }
}