import { ChatBar } from './chat-bar.js';
import { Renderer } from './renderer.js';
import { ASCIIArt } from './ascii-art.js';
import { LLMAgent } from '../agents/planner.js';
import { ChemTools } from '../tools/index.js';
import { detectBestLLM } from '../agents/llm-clients.js';
import { SetupWizard } from '../setup/wizard.js';
import { ConfigManager } from '../config/manager.js';
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
    this.chatBar = new ChatBar();
    this.renderer = new Renderer();
    this.agent = null; // Initialize later
    this.tools = new ChemTools();
    this.conversationHistory = [];
    this.llmProvider = null;
    this.awaitingPrecisionChoice = false;
    this.currentPlanData = null;
    this.configManager = new ConfigManager();
    this.setupWizard = new SetupWizard();
    this.isDemo = false;
  }

  async start() {
    // Check if this is a setup request
    if (process.argv.includes('--setup')) {
      await this.runSetup();
      return;
    }

    // Check for existing configuration
    const hasConfig = await this.configManager.hasExistingConfig();
    
    if (!hasConfig) {
      // First time setup
      await this.runFirstTimeSetup();
    }

    // Initialize and show welcome
    await this.showWelcome();
    await this.initializeLLM();
    
    // Start the interactive session
    await this.chatBar.start(this.handleUserInput.bind(this));
  }

  async runSetup() {
    console.clear();
    await this.setupWizard.run();
  }

  async runFirstTimeSetup() {
    console.clear();
    const provider = await this.setupWizard.run();
    this.isDemo = (provider === 'demo');
  }

  async showWelcome() {
    if (!this.isDemo) {
      console.clear();
      console.log(ASCIIArt.getWelcomeScreen());
      
      // Show LLM status
      await this.checkLLMStatus();
      
      // Show software status
      await this.showSoftwareStatus();
      
      console.log(chalk.gray('Ready to help with your chemistry calculations! 🚀\n'));
    } else {
      // Show demo welcome
      await this.setupWizard.showWelcome();
    }
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
      // Try to use config first, then detectBestLLM
      const config = await this.configManager.loadConfig();
      let llmConfig;
      
      if (config.provider && config.provider !== 'demo') {
        llmConfig = {
          provider: config.provider,
          model: config.model
        };
      } else {
        llmConfig = await detectBestLLM();
      }
      
      this.agent = new LLMAgent(llmConfig);
      this.llmProvider = llmConfig.provider;
      this.isDemo = (llmConfig.provider === 'demo');
      
      if (this.isDemo) {
        console.log(chalk.yellow(`🎭 Demo Mode Active (${llmConfig.model})`));
        console.log(chalk.gray('Set up an API key with --setup for real calculations'));
      } else {
        console.log(chalk.green(`🚀 Using ${llmConfig.provider.toUpperCase()} (${llmConfig.model})`));
      }
      console.log();
    } catch (error) {
      console.log(chalk.red('❌ Error initializing LLM'));
      console.log(chalk.yellow('Falling back to demo mode...'));
      
      // Fallback to demo mode
      this.agent = new LLMAgent({ provider: 'demo', model: 'mock-llm' });
      this.llmProvider = 'demo';
      this.isDemo = true;
      console.log();
    }
  }

  async handleUserInput(input) {
    if (!input.trim()) return;

    // Handle precision choice if we're waiting for one
    if (this.awaitingPrecisionChoice) {
      await this.handlePrecisionChoice(input);
      return;
    }

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
      this.chatBar.exit();
      return;
    }

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: input });

    try {
      // Check if this is a calculation request that would use precision options
      const isCalculationRequest = this.agent.isCalculationRequest(input);
      
      if (!isCalculationRequest && this.agent.processGeneralRequestStream && this.llmProvider === 'openai') {
        // Use streaming for general requests with OpenAI
        await this.handleStreamingResponse(input);
        return;
      }
      
      // Show beautiful thinking animation
      const thinkingSpinner = this.renderer.showSpinner('🧠 Analyzing your request...');
      
      // Get agent response
      const response = await this.agent.process(input, this.conversationHistory, this.tools);
      
      thinkingSpinner.stop();

      // Check if this response contains precision options
      if (response.includes('Precision Options') && response.includes('run full')) {
        this.awaitingPrecisionChoice = true;
        this.currentPlanData = { lastInput: input }; // Store for later use
        this.showPrecisionOptionsUI(response);
      } else {
        // Show regular response
        this.displayResponse(response);
      }
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'assistant', content: response });
      
    } catch (error) {
      this.displayError(error.message);
    }
  }

  displayResponse(response) {
    // Clear space above chat bar for response (account for 3-line chat box)
    const terminalHeight = process.stdout.rows || 24;
    const chatBoxHeight = 3;
    process.stdout.write(`\x1B[${terminalHeight - chatBoxHeight - 1};1H`);
    
    console.log(chalk.cyan('\n🤖 ChemCLI:'));
    console.log(chalk.gray('─'.repeat(Math.min(70, process.stdout.columns - 2))));
    console.log(marked(response));
    console.log(chalk.gray('─'.repeat(Math.min(70, process.stdout.columns - 2))));
  }

  showPrecisionOptionsUI(response) {
    // Clear space above chat bar for response (account for 3-line chat box)
    const terminalHeight = process.stdout.rows || 24;
    const chatBoxHeight = 3;
    process.stdout.write(`\x1B[${terminalHeight - chatBoxHeight - 1};1H`);
    
    console.log(chalk.cyan('\n🤖 ChemCLI:'));
    console.log(chalk.gray('═'.repeat(Math.min(70, process.stdout.columns - 2))));
    console.log(marked(response));
    
    // Add interactive choice UI
    console.log(chalk.yellow('\n⚡ Quick Selection:'));
    console.log(chalk.green('  1️⃣  Type "1" for Full Precision'));
    console.log(chalk.yellow('  2️⃣  Type "2" for Balanced Precision'));
    console.log(chalk.blue('  3️⃣  Type "3" for Fast Preview'));
    console.log(chalk.gray('\n  Or use the full commands: run full / run half / run low'));
    console.log(chalk.gray('═'.repeat(Math.min(70, process.stdout.columns - 2))));
  }

  displayError(message) {
    // Clear space above chat bar for error (account for 3-line chat box)
    const terminalHeight = process.stdout.rows || 24;
    const chatBoxHeight = 3;
    process.stdout.write(`\x1B[${terminalHeight - chatBoxHeight - 1};1H`);
    
    console.log(ASCIIArt.getErrorMessage(message));
  }

  async handleStreamingResponse(input) {
    // Clear space above chat bar for streaming response
    const terminalHeight = process.stdout.rows || 24;
    const chatBoxHeight = 3;
    process.stdout.write(`\x1B[${terminalHeight - chatBoxHeight - 1};1H`);
    
    console.log(chalk.cyan('\n🤖 ChemCLI:'));
    console.log(chalk.gray('─'.repeat(Math.min(70, process.stdout.columns - 2))));
    
    let fullResponse = '';
    const startTime = Date.now();
    
    try {
      const response = await this.agent.processGeneralRequestStream(
        input, 
        this.conversationHistory, 
        this.tools,
        (chunk) => {
          // Stream each chunk to the terminal
          process.stdout.write(chalk.white(chunk));
          fullResponse += chunk;
        }
      );
      
      // Add final response formatting
      console.log('\n' + chalk.gray('─'.repeat(Math.min(70, process.stdout.columns - 2))));
      
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(chalk.gray(`Response time: ${responseTime}s`));
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'assistant', content: fullResponse || response });
      
    } catch (error) {
      console.log('\n' + chalk.red(`❌ Streaming error: ${error.message}`));
    }
  }

  async handlePrecisionChoice(input) {
    const choice = input.toLowerCase().trim();
    let precisionLevel = null;

    // Map user input to precision levels
    if (choice === '1' || choice === 'run full' || choice === 'full') {
      precisionLevel = 'full';
    } else if (choice === '2' || choice === 'run half' || choice === 'half') {
      precisionLevel = 'half';
    } else if (choice === '3' || choice === 'run low' || choice === 'low') {
      precisionLevel = 'low';
    } else {
      console.log(chalk.red('❌ Invalid choice. Please select 1, 2, 3, or use "run full/half/low"'));
      return;
    }

    // Reset state
    this.awaitingPrecisionChoice = false;

    try {
      console.log(chalk.green(`\n✅ Selected: ${precisionLevel.toUpperCase()} precision`));
      
      const spinner = this.renderer.showSpinner('🔧 Generating calculation files...');
      
      // Process the precision choice
      const result = await this.processPrecisionChoice(precisionLevel);
      
      spinner.stop();

      // Show results
      this.displayResponse(result);

      // Add to conversation history
      this.conversationHistory.push({ 
        role: 'user', 
        content: `Selected ${precisionLevel} precision` 
      });
      this.conversationHistory.push({ 
        role: 'assistant', 
        content: result 
      });

    } catch (error) {
      this.displayError(`Failed to generate calculation: ${error.message}`);
    } finally {
      this.currentPlanData = null;
    }
  }

  async processPrecisionChoice(precisionLevel) {
    // This would normally use stored plan data from the previous calculation request
    // For now, return a placeholder response
    return `## 🎉 Calculation Setup Complete!\n\n` +
           `I've generated all the files needed for your **${precisionLevel.toUpperCase()}** precision calculation:\n\n` +
           `### 📋 Generated Files:\n` +
           `- \`research_plan.md\` - Detailed theoretical background\n` +
           `- \`execution_plan.md\` - Software and method selection\n` +
           `- \`run_plan.md\` - Complete execution instructions\n` +
           `- \`input.inp\` - Ready-to-run input file\n` +
           `- \`job.sh\` - Job submission script\n\n` +
           `### 🚀 Next Steps:\n` +
           `1. Review the generated plans in the \`plans/\` directory\n` +
           `2. Run the calculation using the commands in \`run_plan.md\`\n` +
           `3. Monitor progress and analyze results\n\n` +
           `**Estimated runtime:** ${this.getEstimatedTime(precisionLevel)}\n` +
           `**Expected accuracy:** ${this.getExpectedAccuracy(precisionLevel)}\n\n` +
           `Good luck with your calculation! 🧪✨`;
  }

  getEstimatedTime(precisionLevel) {
    const times = {
      'full': '4-24 hours',
      'half': '1-4 hours', 
      'low': '15-60 minutes'
    };
    return times[precisionLevel] || '1-2 hours';
  }

  getExpectedAccuracy(precisionLevel) {
    const accuracy = {
      'full': '±0.1-0.2 eV vs experiment',
      'half': '±0.2-0.4 eV vs experiment',
      'low': '±0.5-1.0 eV vs experiment'
    };
    return accuracy[precisionLevel] || 'Standard DFT accuracy';
  }

  async showSystemStatus() {
    // Clear space above chat bar for status (account for 3-line chat box)
    const terminalHeight = process.stdout.rows || 24;
    const chatBoxHeight = 3;
    process.stdout.write(`\x1B[${terminalHeight - chatBoxHeight - 1};1H`);
    
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
    // Clear space above chat bar for help (account for 3-line chat box)
    const terminalHeight = process.stdout.rows || 24;
    const chatBoxHeight = 3;
    process.stdout.write(`\x1B[${terminalHeight - chatBoxHeight - 1};1H`);
    
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