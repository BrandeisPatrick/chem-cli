#!/usr/bin/env node

// Simple demo to show the chat box appearance
import chalk from 'chalk';

function showChatBoxDemo() {
  const terminalWidth = process.stdout.columns || 80;
  
  console.clear();
  console.log(chalk.cyan.bold('🧪 ChemCLI Chat Box Demo\n'));
  console.log('This is how your chat box will appear at the bottom of the terminal:\n');
  
  // Simulate some conversation history
  console.log(chalk.cyan('🤖 ChemCLI:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('Welcome to ChemCLI! I can help you with computational chemistry calculations.\n');
  console.log('Try asking me: "Calculate absorption spectrum of benzene"');
  console.log(chalk.gray('─'.repeat(60)));
  console.log();
  
  // Show the bordered chat box
  console.log('Here\'s the chat box that will appear at the bottom:');
  console.log();
  
  // Draw the chat box
  const topBorder = chalk.gray('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  const inputLine = chalk.gray('│ ') + chalk.cyan.bold('🧪 ') + chalk.white('Type your chemistry question here...') + ' '.repeat(Math.max(0, terminalWidth - 42)) + chalk.gray('│');
  const bottomBorder = chalk.gray('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  console.log(topBorder);
  console.log(inputLine);
  console.log(bottomBorder);
  
  console.log();
  console.log(chalk.yellow('Features:'));
  console.log('• Fixed position at bottom of terminal');
  console.log('• Visual border like Claude Code');
  console.log('• Real-time typing with cursor navigation');
  console.log('• Command history with ↑↓ arrows');
  console.log('• Responsive to terminal resizing');
  console.log('• Ctrl+C for help, Ctrl+D to exit');
  
  console.log();
  console.log(chalk.green('🚀 Start ChemCLI: ') + chalk.cyan('npm start'));
}

showChatBoxDemo();