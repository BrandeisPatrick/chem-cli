import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.chemcli');
    this.configFile = path.join(this.configDir, 'config.json');
    this.envFile = path.join(process.cwd(), '.env');
  }

  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      // Directory already exists or permission error
    }
  }

  async hasExistingConfig() {
    try {
      await fs.access(this.configFile);
      return true;
    } catch {
      // Check for .env file as fallback
      try {
        const envContent = await fs.readFile(this.envFile, 'utf8');
        return envContent.includes('OPENAI_API_KEY') || envContent.includes('ANTHROPIC_API_KEY');
      } catch {
        return false;
      }
    }
  }

  async loadConfig() {
    // Try to load from config file first
    try {
      const configData = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configData);
      
      // Decrypt API key if it exists
      if (config.apiKey && config.encrypted) {
        config.apiKey = this.decrypt(config.apiKey);
      }
      
      // Set environment variable for compatibility
      if (config.provider === 'openai' && config.apiKey) {
        process.env.OPENAI_API_KEY = config.apiKey;
      } else if (config.provider === 'anthropic' && config.apiKey) {
        process.env.ANTHROPIC_API_KEY = config.apiKey;
      }
      
      return config;
    } catch {
      // Fallback to environment variables
      return this.loadFromEnvironment();
    }
  }

  async loadFromEnvironment() {
    const config = {
      provider: null,
      model: null,
      apiKey: null,
      demo: false
    };

    // Check environment variables
    if (process.env.OPENAI_API_KEY) {
      config.provider = 'openai';
      config.model = 'gpt-4';
      config.apiKey = process.env.OPENAI_API_KEY;
    } else if (process.env.ANTHROPIC_API_KEY) {
      config.provider = 'anthropic';
      config.model = 'claude-3-sonnet-20240229';
      config.apiKey = process.env.ANTHROPIC_API_KEY;
    }

    // Check for Ollama
    if (!config.provider) {
      try {
        const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
        if (response.ok) {
          const data = await response.json();
          if (data.models && data.models.length > 0) {
            config.provider = 'ollama';
            config.model = data.models[0].name;
          }
        }
      } catch {
        // Ollama not available
      }
    }

    return config;
  }

  async saveConfig(provider, options = {}) {
    await this.ensureConfigDir();

    const config = {
      provider: provider,
      model: options.model || this.getDefaultModel(provider),
      demo: provider === 'demo',
      encrypted: false,
      lastUpdated: new Date().toISOString()
    };

    // Handle API key encryption
    if (options.apiKey) {
      config.apiKey = this.encrypt(options.apiKey);
      config.encrypted = true;
    }

    // Save to config file
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), 'utf8');

    // Also save to .env for compatibility
    await this.saveToEnv(provider, options.apiKey);
  }

  async saveToEnv(provider, apiKey) {
    if (!apiKey) return;

    try {
      let envContent = '';
      
      // Read existing .env if it exists
      try {
        envContent = await fs.readFile(this.envFile, 'utf8');
      } catch {
        // File doesn't exist, create new
      }

      const envVar = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
      const newLine = `${envVar}=${apiKey}\n`;

      // Remove existing key if present
      const lines = envContent.split('\n').filter(line => 
        !line.startsWith('OPENAI_API_KEY=') && 
        !line.startsWith('ANTHROPIC_API_KEY=')
      );

      // Add new key
      lines.push(envVar + '=' + apiKey);
      
      // Write back to file
      await fs.writeFile(this.envFile, lines.filter(line => line.trim()).join('\n') + '\n', 'utf8');
    } catch (error) {
      console.warn('Could not save to .env file:', error.message);
    }
  }

  async setDemoMode() {
    const config = {
      provider: 'demo',
      model: 'mock-llm',
      demo: true,
      encrypted: false,
      lastUpdated: new Date().toISOString()
    };

    await this.ensureConfigDir();
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), 'utf8');
  }

  getDefaultModel(provider) {
    const defaults = {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      ollama: 'llama2',
      demo: 'mock-llm'
    };
    return defaults[provider] || 'gpt-4';
  }

  encrypt(text) {
    if (!text) return text;
    
    try {
      // Use a simple encryption for local storage
      // In production, you'd want more robust encryption
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch {
      // Fallback to plain text if encryption fails
      return text;
    }
  }

  decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    
    try {
      const key = this.getEncryptionKey();
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch {
      // Fallback to returning as-is if decryption fails
      return encryptedText;
    }
  }

  getEncryptionKey() {
    // Simple key generation based on machine info
    // In production, use a more robust key management system
    const machineId = os.hostname() + os.platform() + os.arch();
    return crypto.createHash('sha256').update(machineId).digest('hex');
  }

  async deleteConfig() {
    try {
      await fs.unlink(this.configFile);
    } catch {
      // Config file doesn't exist
    }
  }

  async getProviderInfo() {
    const config = await this.loadConfig();
    
    return {
      provider: config.provider,
      model: config.model,
      hasApiKey: !!config.apiKey,
      isDemo: config.demo || config.provider === 'demo',
      lastUpdated: config.lastUpdated
    };
  }

  async validateConfig() {
    const config = await this.loadConfig();
    
    if (config.demo || config.provider === 'demo') {
      return { valid: true, provider: 'demo' };
    }

    if (!config.provider) {
      return { valid: false, error: 'No provider configured' };
    }

    if ((config.provider === 'openai' || config.provider === 'anthropic') && !config.apiKey) {
      return { valid: false, error: 'API key required but not found' };
    }

    if (config.provider === 'ollama') {
      try {
        const response = await fetch('http://localhost:11434/api/tags', { timeout: 3000 });
        if (!response.ok) {
          return { valid: false, error: 'Ollama is not running' };
        }
      } catch {
        return { valid: false, error: 'Ollama is not accessible' };
      }
    }

    return { valid: true, provider: config.provider };
  }

  async resetConfig() {
    await this.deleteConfig();
    
    // Also clean up .env
    try {
      let envContent = await fs.readFile(this.envFile, 'utf8');
      const lines = envContent.split('\n').filter(line => 
        !line.startsWith('OPENAI_API_KEY=') && 
        !line.startsWith('ANTHROPIC_API_KEY=')
      );
      await fs.writeFile(this.envFile, lines.join('\n'), 'utf8');
    } catch {
      // .env doesn't exist or can't be modified
    }
  }
}