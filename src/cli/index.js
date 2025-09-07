import { REPL } from './repl.js';
import { Renderer } from './renderer.js';
import { ASCIIArt } from './ascii-art.js';
import { LLMAgent } from '../agents/planner.js';
import { ChemTools } from '../tools/index.js';
import { detectBestLLM } from '../agents/llm-clients.js';
import chalk from 'chalk';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

marked.setOptions({
  renderer: new markedTerminal({
    emoji: false,
    width: 80,
    reflowText: true
  })
});

export class ChemCLI {
  constructor() {
    this.repl = new REPL();
    this.renderer = new Renderer();
    this.agent = null; // Initialize later
    this.tools = new ChemTools();
    this.conversationHistory = [];
    this.llmProvider = null;
  }

  async start() {
    await this.showWelcome();
    await this.initializeLLM();
    await this.repl.start(this.handleUserInput.bind(this));
  }

  async showWelcome() {
    console.clear();
    console.log(ASCIIArt.getWelcomeScreen());
    
    // Show LLM status
    await this.checkLLMStatus();
    
    // Show software status
    await this.showSoftwareStatus();
    
    console.log(chalk.gray('Ready to help with your chemistry calculations! 🚀\n'));
  }

  async checkLLMStatus() {
    console.log(chalk.yellow.bold('🤖 AI Provider Status:'));
    
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    
    if (hasOpenAI) {
      console.log(chalk.green('✅ OpenAI API key detected'));
    } else {
      console.log(chalk.gray('❌ OpenAI API key not found'));
    }
    
    if (hasAnthropic) {
      console.log(chalk.green('✅ Anthropic API key detected'));
    } else {
      console.log(chalk.gray('❌ Anthropic API key not found'));
    }
    
    // Check for Ollama
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
      if (response.ok) {
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          console.log(chalk.green(`✅ Ollama detected with ${data.models.length} models`));
        }
      }
    } catch (error) {
      console.log(chalk.gray('❌ Ollama not running locally'));
    }
    
    if (!hasOpenAI && !hasAnthropic) {
      console.log(chalk.yellow('⚠️  No API keys found. Install Ollama for free local AI:'));
      console.log(chalk.cyan('   curl -fsSL https://ollama.ai/install.sh | sh'));
      console.log(chalk.cyan('   ollama pull llama3.1'));
    }
    
    console.log();
  }

  async showSoftwareStatus() {
    console.log(chalk.yellow.bold('⚙️  Chemistry Software Status:'));
    
    const installer = this.tools.installer;
    const software = ['xtb', 'pyscf', 'orca'];
    
    for (const sw of software) {
      const status = await installer.check(sw);
      console.log(`  ${ASCIIArt.getSoftwareStatus(sw, status)}`);
    }
    
    console.log(chalk.gray('   💡 Software installs automatically when needed\n'));
  }

  async initializeLLM() {
    try {
      const llmConfig = await detectBestLLM();
      this.agent = new LLMAgent(llmConfig);
      this.llmProvider = llmConfig.provider;
      
      console.log(chalk.green(`🚀 Using ${llmConfig.provider.toUpperCase()} (${llmConfig.model})`));
      console.log();
    } catch (error) {
      console.log(chalk.red('❌ No LLM provider available'));
      console.log(chalk.yellow('Please set up an API key or install Ollama to continue.'));
      console.log();
      process.exit(1);
    }
  }

  async handleUserInput(input) {
    if (!input.trim()) return;

    // Handle special commands
    if (input.toLowerCase() === 'help') {
      this.showHelp();
      return;
    }
    
    if (input.toLowerCase() === 'clear') {
      console.clear();
      await this.showWelcome();
      return;
    }

    if (input.toLowerCase() === 'status') {
      await this.showSystemStatus();
      return;
    }

    if (input.toLowerCase() === 'exit') {
      console.log(ASCIIArt.getSuccessMessage('Thanks for using ChemCLI! 🧪'));
      process.exit(0);
    }

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: input });

    try {
      // Show beautiful thinking animation
      const thinkingSpinner = this.renderer.showSpinner('🧠 Analyzing your request...');
      
      // Get agent response
      const response = await this.agent.process(input, this.conversationHistory, this.tools);
      
      thinkingSpinner.stop();
      
      // Show response with beautiful formatting
      console.log(chalk.cyan('\n🤖 ChemCLI:'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(marked(response));
      console.log(chalk.gray('─'.repeat(60)));
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'assistant', content: response });
      
    } catch (error) {
      console.log(ASCIIArt.getErrorMessage(error.message));
    }
  }

  async showSystemStatus() {
    console.log(chalk.yellow.bold('\n📊 System Status Report'));
    console.log(chalk.yellow('═'.repeat(50)));
    
    // LLM Status
    console.log(chalk.cyan.bold('\n🤖 AI Provider:'));
    console.log(`   Provider: ${this.llmProvider || 'None'}`);
    console.log(`   Conversations: ${Math.floor(this.conversationHistory.length / 2)}`);
    
    // Software Status
    console.log(chalk.cyan.bold('\n⚙️  Software Status:'));
    const installer = this.tools.installer;
    const software = ['xtb', 'pyscf', 'orca'];
    
    for (const sw of software) {
      const status = await installer.check(sw);
      console.log(`   ${ASCIIArt.getSoftwareStatus(sw, status)}`);
    }
    
    // Tools Status
    const tools = this.tools.getAvailableTools();
    console.log(chalk.cyan.bold('\n🛠️  Available Tools:'));
    console.log(`   Chemistry tools: ${tools.length}`);
    
    console.log(chalk.yellow('═'.repeat(50)));
    console.log();
  }

  showHelp() {
    console.log(chalk.cyan.bold(`
╭──────────────────────────────────────────────────────────────╮
│                        🧪 CHEMCLI HELP                       │
╰──────────────────────────────────────────────────────────────╯
`));

    console.log(chalk.yellow.bold('🗣️  Natural Language Examples:'));
    const examples = [
      '"Calculate the HOMO-LUMO gap of benzene"',
      '"Optimize the geometry of water using B3LYP"', 
      '"What\'s the IR spectrum of methanol?"',
      '"Compare the stability of chair vs boat cyclohexane"',
      '"Predict UV-Vis spectrum of anthracene with TDDFT"',
      '"Calculate NMR shifts for glucose"'
    ];
    
    examples.forEach(example => {
      console.log(chalk.green(`   ✨ ${example}`));
    });

    console.log(chalk.yellow.bold('\n💬 Special Commands:'));
    const commands = [
      ['help', 'Show this help message'],
      ['clear', 'Clear screen and show welcome'],
      ['status', 'Show system status'],
      ['exit', 'Exit ChemCLI']
    ];
    
    commands.forEach(([cmd, desc]) => {
      console.log(chalk.blue(`   ${cmd.padEnd(8)} `) + chalk.gray(`- ${desc}`));
    });

    console.log(chalk.yellow.bold('\n🧮 Supported Calculations:'));
    const calculations = [
      'Geometry optimization',
      'Frequency analysis (IR spectra)',
      'Electronic properties (HOMO/LUMO, charges)',
      'Thermochemistry (ΔH, ΔG, ΔS)',
      'UV-Vis spectra (TDDFT)',
      'NMR predictions (chemical shifts)',
      'Reaction energetics'
    ];
    
    calculations.forEach(calc => {
      console.log(chalk.cyan(`   ⚛️  ${calc}`));
    });

    console.log(chalk.yellow.bold('\n⚙️  Available Software:'));
    console.log(chalk.green('   ⚡ xTB      ') + chalk.gray('- Fast semi-empirical calculations'));
    console.log(chalk.green('   🐍 PySCF    ') + chalk.gray('- Accurate DFT calculations'));  
    console.log(chalk.green('   🦋 ORCA     ') + chalk.gray('- Professional quantum chemistry'));

    console.log(chalk.yellow.bold('\n🎯 Pro Tips:'));
    console.log(chalk.magenta('   • Be specific about methods: "B3LYP/def2-TZVP"'));
    console.log(chalk.magenta('   • Mention solvation: "in water" or "SMD(acetone)"'));
    console.log(chalk.magenta('   • Ask for comparisons: "compare xTB vs DFT results"'));
    console.log(chalk.magenta('   • Request visualizations: "show IR spectrum"'));

    console.log(chalk.cyan('─'.repeat(70)));
    console.log();
  }
}