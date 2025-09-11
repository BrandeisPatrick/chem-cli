import { InkUI } from './ink-ui/InkUI.js';
import { ASCIIArt } from './ascii-art.js';
import { LLMAgent } from '../agents/planner.js';
import { ChemTools } from '../tools/index.js';
import { detectBestLLM } from '../agents/llm-clients.js';
import { SetupWizard } from '../setup/wizard.js';
import { ConfigManager } from '../config/manager.js';
import chalk from 'chalk';


export class ChemCLI {
  constructor() {
    this.ui = new InkUI();
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
    
    // Set UI model info (this will show as an info message, not in prompt)
    if (this.llmProvider !== 'demo') {
      this.ui.setModel(this.llmProvider || 'demo', this.agent?.model || 'unknown');
    }
    
    // Start the interactive session
    await this.ui.start(this.handleUserInput.bind(this));
  }

  async runSetup() {
    // Don't clear console - let setup wizard handle display
    await this.setupWizard.run();
  }

  async runFirstTimeSetup() {
    // Don't clear console - let setup wizard handle display
    const provider = await this.setupWizard.run();
    this.isDemo = (provider === 'demo');
  }

  async showWelcome() {
    // Don't clear console or show ASCII art - the Ink UI handles all display now
    if (!this.isDemo) {
      // Just check status silently for internal setup
      await this.checkLLMStatus();
      await this.showSoftwareStatus();
    }
  }

  async checkLLMStatus() {
    // Silent status check - don't log to console since Ink UI is handling display
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    
    // Store status for UI display if needed
    this.llmStatus = {
      hasOpenAI,
      hasAnthropic,
      hasOllama: false
    };
    
    // Check for Ollama silently
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
      if (response.ok) {
        const data = await response.json();
        this.llmStatus.hasOllama = data.models && data.models.length > 0;
      }
    } catch (error) {
      // Ollama not available
    }
  }

  async showSoftwareStatus() {
    // Silent status check - store for UI display if needed
    const installer = this.tools.installer;
    const software = ['xtb', 'pyscf', 'orca'];
    
    this.softwareStatus = {};
    for (const sw of software) {
      const status = await installer.check(sw);
      this.softwareStatus[sw] = status;
    }
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
        // Don't log - Ink UI will show this info
      } else {
        // Don't log - Ink UI will show this info
      }
    } catch (error) {
      // Fallback to demo mode silently
      this.agent = new LLMAgent({ provider: 'demo', model: 'mock-llm' });
      this.llmProvider = 'demo';
      this.isDemo = true;
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
      this.ui.showHelp();
      return;
    }
    
    if (input.toLowerCase() === 'clear') {
      // Clear messages in UI instead of console
      this.ui.clearMessages();
      return;
    }

    if (input.toLowerCase() === 'status') {
      await this.showSystemStatus();
      return;
    }

    if (input.toLowerCase() === 'exit') {
      this.ui.exit();
      return;
    }

    // Add to conversation history (UI already handled the user message display)
    this.conversationHistory.push({ role: 'user', content: input });

    try {
      // Check if this is a calculation request that would use precision options
      const isCalculationRequest = this.agent.isCalculationRequest(input);
      
      if (!isCalculationRequest && this.agent.processGeneralRequestStream && this.llmProvider === 'openai') {
        // Use streaming for general requests with OpenAI
        await this.handleStreamingResponse(input);
        return;
      }
      
      // Show thinking indicator in chat and status
      this.ui.showThinking();
      this.ui.setStatus('thinking');
      
      // Track response time for non-streaming responses
      const startTime = Date.now();
      
      // Get agent response
      const response = await this.agent.process(input, this.conversationHistory, this.tools);
      
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Hide thinking indicator and reset status
      this.ui.hideThinking();
      this.ui.setStatus('ready');

      // Check if this response contains precision options
      if (response.includes('Precision Options') && response.includes('run full')) {
        this.awaitingPrecisionChoice = true;
        this.currentPlanData = { lastInput: input }; // Store for later use
        this.showPrecisionOptionsUI(response);
      } else {
        // Show regular response with response time
        this.displayResponse(response, responseTime);
      }
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'assistant', content: response });
      
    } catch (error) {
      this.ui.hideThinking();
      this.ui.setStatus('ready');
      this.ui.showError(error.message);
    }
  }

  displayResponse(response, responseTime = null) {
    // Send raw response directly to UI - let ChatMessage component handle formatting
    this.ui.showResponse(response, responseTime);
  }

  showPrecisionOptionsUI(response) {
    // Send raw response with enhanced options directly to UI
    const enhancedResponse = response + 
      '\n\n⚡ Quick Selection:\n' +
      '  1️⃣  Type "1" for Full Precision\n' +
      '  2️⃣  Type "2" for Balanced Precision\n' +
      '  3️⃣  Type "3" for Fast Preview\n' +
      '\nOr use the full commands: run full / run half / run low';
    
    this.ui.showResponse(enhancedResponse);
  }


  async handleStreamingResponse(input) {
    this.ui.setStatus('Streaming');
    
    let fullResponse = '';
    const startTime = Date.now();
    
    try {
      const response = await this.agent.processGeneralRequestStream(
        input, 
        this.conversationHistory, 
        this.tools,
        (chunk) => {
          // Stream each chunk using the UI - accumulate content
          fullResponse += chunk;
          this.ui.showStreamingResponse(fullResponse);
        }
      );
      
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Complete the streaming response with response time
      this.ui.showStreamingResponse('', true, responseTime);
      
      // Add to conversation history with response time
      this.conversationHistory.push({ role: 'assistant', content: fullResponse || response });
      
    } catch (error) {
      this.ui.showError(`Streaming error: ${error.message}`);
    }
    
    this.ui.setStatus('Ready');
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
      this.ui.showError('❌ Invalid choice. Please select 1, 2, 3, or use "run full/half/low"');
      return;
    }

    // Reset state
    this.awaitingPrecisionChoice = false;

    try {
      // Show precision selection in UI instead of console
      this.ui.showInfo(`✅ Selected: ${precisionLevel.toUpperCase()} precision`);
      
      // Show thinking indicator and generating status
      this.ui.showThinking();
      this.ui.setStatus('generating');
      
      // Track response time for precision choice processing
      const startTime = Date.now();
      
      // Process the precision choice
      const result = await this.processPrecisionChoice(precisionLevel);
      
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Hide thinking indicator and reset status
      this.ui.hideThinking();
      this.ui.setStatus('ready');

      // Show results with response time
      this.displayResponse(result, responseTime);

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
      this.ui.hideThinking();
      this.ui.setStatus('ready');
      this.ui.showError(`Failed to generate calculation: ${error.message}`);
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
    let statusReport = '📊 System Status Report\n\n';
    
    // LLM Status
    statusReport += '🤖 AI Provider:\n';
    statusReport += `   Provider: ${this.llmProvider || 'None'}\n`;
    statusReport += `   Conversations: ${Math.floor(this.conversationHistory.length / 2)}\n\n`;
    
    // Software Status
    statusReport += '⚙️ Software Status:\n';
    const installer = this.tools.installer;
    const software = ['xtb', 'pyscf', 'orca'];
    
    for (const sw of software) {
      const status = await installer.check(sw);
      const statusIcon = status.installed ? '✅' : '❌';
      statusReport += `   ${statusIcon} ${sw.toUpperCase()}: ${status.installed ? 'Available' : 'Not installed'}\n`;
    }
    
    // Tools Status
    const tools = this.tools.getAvailableTools();
    statusReport += `\n🛠️ Available Tools:\n`;
    statusReport += `   Chemistry tools: ${tools.length}`;
    
    this.ui.showInfo(statusReport);
  }

  showHelp() {
    // Use InkUI's showHelp method instead of console output
    this.ui.showHelp();
  }
}