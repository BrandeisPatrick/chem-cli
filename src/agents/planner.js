import { OpenAILLM, AnthropicLLM, OllamaLLM, MockLLM } from './llm-clients.js';
import { ChemistryPrompts } from '../prompts/index.js';
import { ResearchPlanner } from '../planning/research-planner.js';
import { ExecutionPlanner } from '../planning/execution-planner.js';
import { RunPlanner } from '../planning/run-planner.js';
import { PlanWriter } from '../planning/plan-writer.js';
import { PrecisionCalculator } from '../calculators/precision-calculator.js';
import { AbsorptionCalculator } from '../spectroscopy/absorption-calculator.js';

export class LLMAgent {
  constructor(options = {}) {
    this.provider = options.provider || 'openai';
    this.model = options.model || this.getDefaultModel();
    this.llm = this.initializeLLM();
    this.prompts = new ChemistryPrompts();
    
    // Initialize planning components
    this.researchPlanner = new ResearchPlanner();
    this.executionPlanner = new ExecutionPlanner();
    this.runPlanner = new RunPlanner();
    this.planWriter = new PlanWriter();
    this.precisionCalculator = new PrecisionCalculator();
    this.absorptionCalculator = new AbsorptionCalculator();
  }

  getDefaultModel() {
    const defaults = {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      ollama: 'llama2',
      demo: 'mock-llm'
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
      case 'demo':
        return new MockLLM(this.model);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async process(userInput, conversationHistory, tools) {
    // Check if this is a calculation request that needs the full planning workflow
    const isCalculationRequest = this.isCalculationRequest(userInput);
    
    if (isCalculationRequest) {
      return await this.processCalculationRequest(userInput, conversationHistory, tools);
    } else {
      return await this.processGeneralRequest(userInput, conversationHistory, tools);
    }
  }

  isCalculationRequest(userInput) {
    const calculationKeywords = [
      'calculate', 'absorption', 'spectrum', 'excitation', 'optimize', 'frequency',
      'homo', 'lumo', 'nmr', 'uv-vis', 'td-dft', 'dft', 'molecular orbital'
    ];
    
    const lowerInput = userInput.toLowerCase();
    return calculationKeywords.some(keyword => lowerInput.includes(keyword));
  }

  async processCalculationRequest(userInput, conversationHistory, tools) {
    try {
      // Step 1: Identify molecule
      const moleculeResult = await this.identifyMolecule(userInput, tools);
      if (!moleculeResult.success) {
        return `I need to identify the molecule first. ${moleculeResult.message}`;
      }

      const moleculeInfo = moleculeResult.data;

      // Step 2: Research Planning
      const researchResult = await this.researchPlanner.analyze(userInput, moleculeInfo);
      if (!researchResult.success) {
        return `I couldn't determine what type of calculation you need. ${researchResult.error}`;
      }

      // Step 3: Execution Planning
      const executionResult = await this.executionPlanner.plan(researchResult, moleculeInfo);
      
      // Step 4: Calculate Precision Options
      const precisionOptions = this.precisionCalculator.calculatePrecisionOptions(
        researchResult.calculationType,
        moleculeInfo,
        researchResult.theoryLevel,
        executionResult.selectedSoftware.name.toLowerCase()
      );

      // Step 5: Present options to user
      return this.formatPrecisionOptionsResponse(
        researchResult,
        executionResult,
        precisionOptions,
        moleculeInfo
      );

    } catch (error) {
      return `I encountered an error planning your calculation: ${error.message}. Please try rephrasing your request.`;
    }
  }

  async processGeneralRequest(userInput, conversationHistory, tools) {
    // Original general processing logic
    const systemPrompt = this.prompts.getSystemPrompt(tools.getAvailableTools());
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userInput }
    ];

    try {
      let response = await this.llm.chat(messages);
      
      const toolCalls = this.parseToolCalls(response);
      
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const toolResult = await tools.execute(toolCall.name, toolCall.arguments);
          
          messages.push({
            role: 'assistant',
            content: response
          });
          messages.push({
            role: 'user',
            content: `Tool "${toolCall.name}" result: ${JSON.stringify(toolResult)}`
          });
        }
        
        response = await this.llm.chat(messages);
      }
      
      return response;
      
    } catch (error) {
      return `I encountered an error: ${error.message}. Please try rephrasing your request.`;
    }
  }

  async processGeneralRequestStream(userInput, conversationHistory, tools, onChunk) {
    // Streaming version for real-time responses
    if (this.provider !== 'openai' || !this.llm.chatStream) {
      // Fallback to regular processing for non-OpenAI providers
      return await this.processGeneralRequest(userInput, conversationHistory, tools);
    }

    const systemPrompt = this.prompts.getSystemPrompt(tools.getAvailableTools());
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userInput }
    ];

    try {
      const stream = await this.llm.chatStream(messages);
      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }
      
      // Handle tool calls if present
      const toolCalls = this.parseToolCalls(fullResponse);
      
      if (toolCalls.length > 0) {
        if (onChunk) {
          onChunk('\n\n🛠️ Using tools...\n');
        }
        
        for (const toolCall of toolCalls) {
          const toolResult = await tools.execute(toolCall.name, toolCall.arguments);
          
          messages.push({
            role: 'assistant',
            content: fullResponse
          });
          messages.push({
            role: 'user',
            content: `Tool "${toolCall.name}" result: ${JSON.stringify(toolResult)}`
          });
        }
        
        // Get final response after tool execution
        const finalStream = await this.llm.chatStream(messages);
        let finalResponse = '';
        
        for await (const chunk of finalStream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            finalResponse += content;
            if (onChunk) {
              onChunk(content);
            }
          }
        }
        
        return finalResponse;
      }
      
      return fullResponse;
      
    } catch (error) {
      return `I encountered an error: ${error.message}. Please try rephrasing your request.`;
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

  async identifyMolecule(userInput, tools) {
    // Extract molecule name/SMILES from user input
    const moleculePattern = /(?:of|for)\s+([a-zA-Z0-9\-\+\[\]()=]+)/i;
    const match = userInput.match(moleculePattern);
    
    if (match) {
      return await tools.execute('identify_molecule', { molecule: match[1] });
    } else {
      // Ask user for molecule
      return {
        success: false,
        message: 'Please specify which molecule you would like to analyze.'
      };
    }
  }

  formatPrecisionOptionsResponse(researchResult, executionResult, precisionOptions, moleculeInfo) {
    let response = `## 🧪 Calculation Plan for ${moleculeInfo.name || 'your molecule'}\n\n`;
    
    // Research summary
    response += `**Calculation Type:** ${researchResult.calculationType.replace(/_/g, ' ').toUpperCase()}\n`;
    response += `**Recommended Software:** ${executionResult.selectedSoftware.name}\n`;
    response += `**Method:** ${researchResult.theoryLevel.functional}\n\n`;

    // Precision options
    response += `## ⚙️ Precision Options\n\nI've prepared 3 precision levels for your calculation:\n\n`;
    
    for (let i = 0; i < precisionOptions.length; i++) {
      const option = precisionOptions[i];
      const emoji = ['🔴', '🟡', '🟢'][i]; // Red, Yellow, Green
      
      response += `### ${emoji} ${option.name} (${option.level})\n`;
      response += `- **Description:** ${option.description}\n`;
      response += `- **Estimated Time:** ${option.estimatedTime}\n`;
      response += `- **Accuracy vs Experiment:** ${option.accuracyVsExperiment.category}\n`;
      response += `- **Memory Required:** ${option.memoryRequirement}\n`;
      response += `- **Basis Set:** ${option.basisSet}\n`;
      
      if (option.recommended) {
        response += `- ✅ **${option.recommended}**\n`;
      }
      
      if (option.warnings.length > 0) {
        response += `- ⚠️ **Warnings:** ${option.warnings.join(', ')}\n`;
      }
      
      response += `\n`;
    }

    // Next steps
    response += `## 🚀 Next Steps\n\n`;
    response += `Please choose your preferred precision level by typing one of:\n`;
    response += `- \`run full\` - Maximum accuracy (may take hours/days)\n`;
    response += `- \`run half\` - Balanced accuracy and speed (recommended)\n`;
    response += `- \`run low\` - Quick preview (minutes to hours)\n\n`;
    response += `I'll then generate all the input files and commands needed to run your calculation!\n`;

    return response;
  }

  async executeCalculation(precisionLevel, previousPlanData, tools) {
    try {
      // Generate run plan
      const runResult = await this.runPlanner.plan(
        previousPlanData.executionResult.executionPlan,
        previousPlanData.moleculeInfo,
        precisionLevel
      );

      // Write all plan files
      const planFiles = await this.planWriter.writeAllPlans(
        previousPlanData.researchResult.researchPlan,
        previousPlanData.executionResult.executionPlan,
        runResult.runPlan,
        previousPlanData.moleculeInfo
      );

      return {
        success: true,
        runPlan: runResult.runPlan,
        files: planFiles,
        message: `Generated ${planFiles.files.length} plan files and input files for your calculation.`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
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