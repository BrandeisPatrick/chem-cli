import inquirer from 'inquirer';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { ConfigManager } from '../config/manager.js';

export class SetupWizard {
  constructor() {
    this.configManager = new ConfigManager();
  }

  async run() {
    console.log(chalk.cyan.bold(`
╭──────────────────────────────────────────────────────────────╮
│                    🧪 Welcome to ChemCLI!                   │
╰──────────────────────────────────────────────────────────────╯
`));

    console.log(chalk.white('This appears to be your first time using ChemCLI.'));
    console.log(chalk.white('Let\'s set up your AI provider to get started!\n'));

    // Check if user wants to proceed with setup
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Would you like to configure an AI provider now?',
        default: true
      }
    ]);

    if (!proceed) {
      console.log(chalk.yellow('\n🎭 Starting in Demo Mode'));
      console.log(chalk.gray('You can run setup later with: chem-cli --setup\n'));
      await this.configManager.setDemoMode();
      return 'demo';
    }

    // Select AI provider
    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Which AI provider would you like to use?',
        choices: [
          {
            name: '🤖 OpenAI (GPT-4) - Best overall performance',
            value: 'openai'
          },
          {
            name: '🧠 Anthropic (Claude) - Great for scientific tasks',
            value: 'anthropic'
          },
          {
            name: '🏠 Ollama (Local) - Free, runs on your machine',
            value: 'ollama'
          },
          {
            name: '🎭 Demo Mode - No API key required',
            value: 'demo'
          }
        ],
        default: 'openai'
      }
    ]);

    if (provider === 'demo') {
      console.log(chalk.yellow('\n🎭 Demo Mode Selected'));
      console.log(chalk.gray('ChemCLI will simulate responses for testing purposes.'));
      console.log(chalk.gray('You can add a real AI provider later with: chem-cli --setup\n'));
      await this.configManager.setDemoMode();
      return 'demo';
    }

    if (provider === 'ollama') {
      return await this.setupOllama();
    }

    // Setup API key for OpenAI or Anthropic
    return await this.setupAPIProvider(provider);
  }

  async setupAPIProvider(provider) {
    const providerInfo = {
      openai: {
        name: 'OpenAI',
        keyName: 'OPENAI_API_KEY',
        website: 'https://platform.openai.com/api-keys',
        description: 'Get your API key from OpenAI Platform'
      },
      anthropic: {
        name: 'Anthropic',
        keyName: 'ANTHROPIC_API_KEY', 
        website: 'https://console.anthropic.com/',
        description: 'Get your API key from Anthropic Console'
      }
    };

    const info = providerInfo[provider];
    
    console.log(chalk.blue(`\n🔑 ${info.name} API Key Setup`));
    console.log(chalk.gray(`${info.description}`));
    console.log(chalk.gray(`Visit: ${info.website}\n`));

    // Check if user already has the key
    const { hasKey } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasKey',
        message: `Do you have your ${info.name} API key ready?`,
        default: true
      }
    ]);

    if (!hasKey) {
      console.log(chalk.yellow(`\n📋 To get your ${info.name} API key:`));
      console.log(chalk.white(`1. Visit ${info.website}`));
      console.log(chalk.white(`2. Sign up or log in to your account`));
      console.log(chalk.white(`3. Create a new API key`));
      console.log(chalk.white(`4. Copy the key and return here\n`));

      const { ready } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ready',
          message: 'Ready to enter your API key?',
          default: true
        }
      ]);

      if (!ready) {
        console.log(chalk.yellow('\n🎭 Switching to Demo Mode'));
        await this.configManager.setDemoMode();
        return 'demo';
      }
    }

    // Get the API key
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: `Enter your ${info.name} API key:`,
        mask: '•',
        validate: (input) => {
          if (!input.trim()) {
            return 'API key cannot be empty';
          }
          if (provider === 'openai' && !input.startsWith('sk-')) {
            return 'OpenAI API keys typically start with "sk-"';
          }
          if (provider === 'anthropic' && !input.startsWith('sk-ant-')) {
            return 'Anthropic API keys typically start with "sk-ant-"';
          }
          return true;
        }
      }
    ]);

    // Test the API key
    console.log(chalk.yellow('\n🧪 Testing API key...'));
    
    try {
      const isValid = await this.testAPIKey(provider, apiKey);
      
      if (isValid) {
        console.log(chalk.green('✅ API key validated successfully!'));
        await this.configManager.saveConfig(provider, { apiKey });
        
        console.log(chalk.cyan('\n🎉 Setup Complete!'));
        console.log(chalk.white(`ChemCLI is now configured to use ${info.name}.`));
        console.log(chalk.gray('Your API key has been saved securely.\n'));
        
        return provider;
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      console.log(chalk.red(`❌ API key test failed: ${error.message}`));
      
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Would you like to try again?',
          default: true
        }
      ]);

      if (retry) {
        return await this.setupAPIProvider(provider);
      } else {
        console.log(chalk.yellow('\n🎭 Switching to Demo Mode'));
        await this.configManager.setDemoMode();
        return 'demo';
      }
    }
  }

  async setupOllama() {
    console.log(chalk.blue('\n🏠 Ollama (Local AI) Setup'));
    console.log(chalk.gray('Ollama runs AI models locally on your machine.\n'));

    // Check if Ollama is installed
    try {
      const response = await fetch('http://localhost:11434/api/tags', { timeout: 3000 });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.models && data.models.length > 0) {
          console.log(chalk.green('✅ Ollama is running!'));
          console.log(chalk.white(`Found ${data.models.length} model(s):`));
          
          data.models.forEach(model => {
            console.log(chalk.gray(`  • ${model.name}`));
          });

          // Select model
          const modelChoices = data.models.map(model => ({
            name: model.name,
            value: model.name
          }));

          const { selectedModel } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedModel',
              message: 'Which model would you like to use?',
              choices: modelChoices,
              default: data.models[0].name
            }
          ]);

          await this.configManager.saveConfig('ollama', { model: selectedModel });
          
          console.log(chalk.cyan('\n🎉 Setup Complete!'));
          console.log(chalk.white(`ChemCLI is now configured to use Ollama with ${selectedModel}.`));
          console.log(chalk.gray('No API key required - everything runs locally!\n'));
          
          return 'ollama';
        }
      }
    } catch (error) {
      // Ollama not running
    }

    // Ollama not available
    console.log(chalk.yellow('⚠️  Ollama is not running or not installed'));
    console.log(chalk.white('\nTo install Ollama:'));
    console.log(chalk.gray('1. Visit https://ollama.ai'));
    console.log(chalk.gray('2. Download and install Ollama'));
    console.log(chalk.gray('3. Run: ollama pull llama2'));
    console.log(chalk.gray('4. Run: ollama serve\n'));

    const { waitForOllama } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'waitForOllama',
        message: 'Have you installed and started Ollama?',
        default: false
      }
    ]);

    if (waitForOllama) {
      return await this.setupOllama(); // Try again
    } else {
      console.log(chalk.yellow('\n🎭 Switching to Demo Mode'));
      await this.configManager.setDemoMode();
      return 'demo';
    }
  }

  async testAPIKey(provider, apiKey) {
    const testPrompts = [{ role: 'user', content: 'Hello' }];

    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: testPrompts,
            max_tokens: 5
          }),
          timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(chalk.red(`API Error (${response.status}): ${errorText}`));
        }

        return response.ok;
      }

      if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            messages: testPrompts,
            max_tokens: 5
          }),
          timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(chalk.red(`API Error (${response.status}): ${errorText}`));
        }

        return response.ok;
      }

      return false;
    } catch (error) {
      console.log(chalk.red(`Network error: ${error.message}`));
      return false;
    }
  }

  async showWelcome() {
    console.log(chalk.cyan.bold(`
╭────────────────────────────────────────────────────╮
│             🧪 ChemCLI Ready to Go! 🧪             │
╰────────────────────────────────────────────────────╯
`));
    
    console.log(chalk.white('Try asking me something like:'));
    console.log(chalk.green('  • "Calculate the absorption spectrum of benzene"'));
    console.log(chalk.green('  • "Optimize the geometry of water"'));
    console.log(chalk.green('  • "What\'s the HOMO-LUMO gap of anthracene?"'));
    console.log(chalk.gray('\nType "help" for more examples or "exit" to quit.\n'));
  }
}