import { OpenAILLM, AnthropicLLM, OllamaLLM } from './llm-clients.js';
import { ChemistryPrompts } from '../prompts/index.js';

export class LLMAgent {
  constructor(options = {}) {
    this.provider = options.provider || 'openai';
    this.model = options.model || this.getDefaultModel();
    this.llm = this.initializeLLM();
    this.prompts = new ChemistryPrompts();
  }

  getDefaultModel() {
    const defaults = {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      ollama: 'llama2'
    };
    return defaults[this.provider];
  }

  initializeLLM() {
    switch (this.provider) {
      case 'openai':
        return new OpenAILLM(this.model);
      case 'anthropic':
        return new AnthropicLLM(this.model);
      case 'ollama':
        return new OllamaLLM(this.model);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async process(userInput, conversationHistory, tools) {
    // Create the system prompt with available tools
    const systemPrompt = this.prompts.getSystemPrompt(tools.getAvailableTools());
    
    // Format conversation history for the LLM
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userInput }
    ];

    try {
      // Get initial LLM response
      let response = await this.llm.chat(messages);
      
      // Check if the LLM wants to use tools
      const toolCalls = this.parseToolCalls(response);
      
      if (toolCalls.length > 0) {
        // Execute tool calls
        for (const toolCall of toolCalls) {
          const toolResult = await tools.execute(toolCall.name, toolCall.arguments);
          
          // Add tool result to conversation
          messages.push({
            role: 'assistant',
            content: response
          });
          messages.push({
            role: 'user',
            content: `Tool "${toolCall.name}" result: ${JSON.stringify(toolResult)}`
          });
        }
        
        // Get final response after tool execution
        response = await this.llm.chat(messages);
      }
      
      return response;
      
    } catch (error) {
      return `I encountered an error: ${error.message}. Please try rephrasing your request or check if required software is installed.`;
    }
  }

  parseToolCalls(response) {
    // Parse tool calls from LLM response
    // Format: <tool>toolName(arg1="value1", arg2="value2")</tool>
    const toolCallRegex = /<tool>(\w+)\((.*?)\)<\/tool>/g;
    const toolCalls = [];
    let match;

    while ((match = toolCallRegex.exec(response)) !== null) {
      const toolName = match[1];
      const argsString = match[2];
      
      // Parse arguments
      const args = {};
      const argRegex = /(\w+)="([^"]*)"/g;
      let argMatch;
      
      while ((argMatch = argRegex.exec(argsString)) !== null) {
        args[argMatch[1]] = argMatch[2];
      }
      
      toolCalls.push({
        name: toolName,
        arguments: args
      });
    }

    return toolCalls;
  }

  async createPlan(userInput, context) {
    const planningPrompt = this.prompts.getPlanningPrompt(userInput, context);
    const response = await this.llm.chat([
      { role: 'system', content: planningPrompt },
      { role: 'user', content: userInput }
    ]);

    try {
      return JSON.parse(response);
    } catch (error) {
      // If JSON parsing fails, return a basic plan
      return {
        steps: [{
          type: 'analyze',
          description: 'Analyze user request',
          tool: 'analyze_request',
          arguments: { input: userInput }
        }],
        confidence: 0.5
      };
    }
  }
}