import readline from 'readline';
import chalk from 'chalk';

export class REPL {
  constructor() {
    this.rl = null;
  }

  async start(handleInput) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan.bold('🧪 You → '),
      history: [],
      completer: this.completer.bind(this)
    });

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n💡 Use "exit" to quit ChemCLI or "help" for assistance'));
      console.log(chalk.gray('   Press Ctrl+C again to force quit'));
      this.rl.prompt();
    });

    // Handle each line of input
    this.rl.on('line', async (input) => {
      try {
        await handleInput(input.trim());
      } catch (error) {
        console.log(chalk.red(`❌ Error: ${error.message}`));
      }
      
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
}