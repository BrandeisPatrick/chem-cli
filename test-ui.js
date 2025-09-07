#!/usr/bin/env node

// Test the beautiful UI without requiring LLM
import { ChemCLI } from './src/cli/index.js';

// Mock the LLM detection to avoid requiring API keys
const originalDetectBestLLM = (await import('./src/agents/llm-clients.js')).detectBestLLM;

// Override to show demo mode
const mockDetectBestLLM = async () => ({
  provider: 'demo',
  model: 'demo-model'
});

// Patch the import
const llmClients = await import('./src/agents/llm-clients.js');
llmClients.detectBestLLM = mockDetectBestLLM;

// Create a demo CLI that just shows the welcome screen
class DemoCLI extends ChemCLI {
  async initializeLLM() {
    this.llmProvider = 'demo';
    console.log('🎭 Demo Mode - Showing Beautiful UI');
    console.log();
  }

  async handleUserInput(input) {
    if (input.toLowerCase() === 'exit') {
      process.exit(0);
    }
    
    if (input.toLowerCase() === 'help') {
      this.showHelp();
      return;
    }
    
    if (input.toLowerCase() === 'status') {
      await this.showSystemStatus();
      return;
    }
    
    console.log('🤖 ChemCLI Demo: In full version, I would process your chemistry request!');
    console.log('   Your request: "' + input + '"');
    console.log('   Try "help", "status", or "exit"');
  }
}

const cli = new DemoCLI();
cli.start();