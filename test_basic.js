#!/usr/bin/env node

// Basic test of ChemCLI components
import { ChemTools } from './src/tools/index.js';
import { MoleculeHandler } from './src/chemistry/molecule.js';
import { SoftwareInstaller } from './src/tools/installer.js';

console.log('🧪 Testing ChemCLI Components...\n');

async function testMoleculeHandler() {
  console.log('1. Testing Molecule Handler...');
  const molHandler = new MoleculeHandler();
  
  try {
    // Test common molecule identification
    const water = await molHandler.identify('water');
    console.log(`   ✓ Water identified: ${water.smiles} (${water.found ? 'found' : 'not found'})`);
    
    const benzene = await molHandler.identify('benzene');
    console.log(`   ✓ Benzene identified: ${benzene.smiles} (${benzene.found ? 'found' : 'not found'})`);
    
    // Test SMILES
    const caffeine = await molHandler.identify('CN1C=NC2=C1C(=O)N(C(=O)N2C)C');
    console.log(`   ✓ Caffeine SMILES processed: ${caffeine.found ? 'found' : 'not found'}`);
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  console.log();
}

async function testSoftwareInstaller() {
  console.log('2. Testing Software Installer...');
  const installer = new SoftwareInstaller();
  
  try {
    // Check what software is available
    const installed = await installer.listInstalled();
    
    for (const [name, info] of Object.entries(installed)) {
      const status = info.installed ? '✓' : '✗';
      console.log(`   ${status} ${info.name}: ${info.installed ? info.version || 'installed' : 'not installed'}`);
    }
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  console.log();
}

async function testChemTools() {
  console.log('3. Testing Chemistry Tools...');
  const tools = new ChemTools();
  
  try {
    // Test tool listing
    const availableTools = tools.getAvailableTools();
    console.log(`   ✓ Available tools: ${availableTools.length}`);
    
    for (const tool of availableTools.slice(0, 5)) { // Show first 5
      console.log(`     - ${tool.name}: ${tool.description}`);
    }
    
    // Test molecule identification through tools
    const result = await tools.execute('get_molecule', { molecule: 'water' });
    console.log(`   ✓ Tool execution test: ${result.found ? 'success' : 'failed'}`);
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  console.log();
}

async function main() {
  await testMoleculeHandler();
  await testSoftwareInstaller();
  await testChemTools();
  
  console.log('🎉 Basic component testing completed!');
  console.log('\nNext steps:');
  console.log('1. Set up an LLM provider (OPENAI_API_KEY, ANTHROPIC_API_KEY, or install Ollama)');
  console.log('2. Run: node src/index.js');
  console.log('3. Start chatting: "Calculate the HOMO-LUMO gap of benzene"');
}

main().catch(console.error);