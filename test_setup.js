#!/usr/bin/env node

// Test script to demonstrate the setup process and chat interface

import { MockLLM } from './src/agents/mock-llm.js';
import { ConfigManager } from './src/config/manager.js';

async function testSetup() {
  console.log('🧪 Testing ChemCLI Setup Process\n');

  try {
    // Test 1: Config Manager
    console.log('1️⃣ Testing ConfigManager...');
    const configManager = new ConfigManager();
    
    // Test demo mode setup
    await configManager.setDemoMode();
    console.log('✅ Demo mode configuration saved');
    
    const config = await configManager.loadConfig();
    console.log(`✅ Configuration loaded: ${config.provider} (${config.model})`);

    // Test 2: MockLLM
    console.log('\n2️⃣ Testing MockLLM responses...');
    const mockLLM = new MockLLM();
    
    const testQueries = [
      'hello',
      'calculate absorption spectrum of benzene', 
      'optimize geometry of water',
      'run half',
      'help'
    ];

    for (const query of testQueries) {
      const response = await mockLLM.chat([{ role: 'user', content: query }]);
      console.log(`✅ Query: "${query}"`);
      console.log(`   Response: ${response.substring(0, 100)}...`);
    }

    // Test 3: Cleanup
    console.log('\n3️⃣ Cleaning up...');
    await configManager.deleteConfig();
    console.log('✅ Configuration cleaned up');

    console.log('\n🎉 All setup tests passed!');
    console.log('\n📋 The CLI now supports:');
    console.log('   • Interactive setup wizard (like Claude CLI)');
    console.log('   • API key management and storage');
    console.log('   • Demo mode with MockLLM responses');
    console.log('   • Immediate chat interface availability');
    console.log('   • Fallback to demo mode when no API key available');

  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.error(error.stack);
  }
}

function showUsageInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 HOW TO USE THE NEW SETUP:');
  console.log('='.repeat(60));
  
  console.log('\n📋 First Run:');
  console.log('   node src/index.js');
  console.log('   → Will show setup wizard automatically');
  console.log('   → Choose API provider or Demo Mode');
  console.log('   → Chat interface starts immediately');

  console.log('\n🔧 Manual Setup:');
  console.log('   node src/index.js --setup');
  console.log('   → Re-run setup wizard');
  console.log('   → Change API provider');

  console.log('\n🎭 Demo Mode Features:');
  console.log('   • Works without any API key');
  console.log('   • Realistic chemistry responses');
  console.log('   • Shows full precision options workflow');
  console.log('   • Demonstrates file generation process');

  console.log('\n💬 Example Demo Conversation:');
  console.log('   User: "Calculate absorption spectrum of benzene"');
  console.log('   ChemCLI: Shows 3 precision options with estimates');
  console.log('   User: "2" (selects balanced precision)');
  console.log('   ChemCLI: Shows generated files and next steps');

  console.log('\n🔑 With API Key:');
  console.log('   • Real AI responses');
  console.log('   • Actual file generation');
  console.log('   • Full computational chemistry workflow');
}

// Run the test
testSetup().then(() => {
  showUsageInstructions();
}).catch(console.error);