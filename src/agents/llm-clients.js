import OpenAI from 'openai';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { MockLLM } from './mock-llm.js';

export class OpenAILLM {
  constructor(model = 'gpt-4') {
    this.model = model;
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async chat(messages) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.1,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async chatStream(messages) {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.1,
        max_tokens: 2000,
        stream: true
      });

      return stream;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

export class AnthropicLLM {
  constructor(model = 'claude-3-sonnet-20240229') {
    this.model = model;
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1';
    
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
  }

  async chat(messages) {
    // Convert OpenAI format to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: chatMessages,
        system: systemMessage?.content,
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

export class OllamaLLM {
  constructor(model = 'llama2') {
    this.model = model;
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async chat(messages) {
    try {
      // Check if Ollama is running
      await fetch(`${this.baseURL}/api/tags`);
    } catch (error) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  async ensureModelExists() {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      const data = await response.json();
      
      const modelExists = data.models?.some(m => m.name.startsWith(this.model));
      
      if (!modelExists) {
        throw new Error(`Model ${this.model} not found. Please run: ollama pull ${this.model}`);
      }
    } catch (error) {
      throw new Error(`Cannot check Ollama models: ${error.message}`);
    }
  }
}

export { MockLLM };

// Auto-detect best available LLM
export async function detectBestLLM() {
  // Check for API keys
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', model: 'gpt-4' };
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', model: 'claude-3-sonnet-20240229' };
  }
  
  // Check for local Ollama
  try {
    const response = await fetch('http://localhost:11434/api/tags', { timeout: 3000 });
    if (response.ok) {
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        return { provider: 'ollama', model: data.models[0].name };
      }
    }
  } catch (error) {
    // Ollama not available
  }
  
  // Fallback to demo mode instead of throwing error
  return { provider: 'demo', model: 'mock-llm' };
}