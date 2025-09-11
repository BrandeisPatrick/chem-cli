#!/usr/bin/env node

// Demo script showing ChemCLI capabilities without requiring LLM
import { ChemTools } from '../src/tools/index.js';
import chalk from 'chalk';

console.clear();
console.log(chalk.blue.bold('🧪 ChemCLI Demo'));
console.log(chalk.gray('Demonstrating natural language chemistry capabilities'));
console.log();

const tools = new ChemTools();
// Renderer removed - using simple console output

async function demoMoleculeIdentification() {
  console.log(chalk.yellow('📝 Molecule Identification Demo'));
  console.log(chalk.gray('> "What is caffeine?"'));
  console.log();
  
  console.log(chalk.blue('🔍 Identifying caffeine...'));
  
  try {
    const result = await tools.execute('get_molecule', { molecule: 'caffeine' });
    spinner.stop();
    
    console.log('🤖 I can identify caffeine for you!');
    console.log();
    console.log(`**Molecule:** ${result.name}`);
    console.log(`**SMILES:** \`${result.smiles}\``);
    console.log(`**Source:** ${result.inputType}`);
    console.log();
    
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
}

async function demoSoftwareCheck() {
  console.log(chalk.yellow('⚙️  Software Management Demo'));
  console.log(chalk.gray('> "What chemistry software is available?"'));
  console.log();
  
  console.log(chalk.blue('⚙️ Checking installed software...'));
  
  try {
    const result = await tools.execute('check_software', { software: 'xtb' });
    spinner.stop();
    
    console.log('🤖 Here\'s what I found:');
    console.log();
    
    if (result.installed) {
      console.log(chalk.green(`✅ xTB is installed (${result.version})`));
    } else {
      console.log(chalk.yellow('⚠️ xTB is not installed - I can install it for you when needed'));
    }
    
    const pyscfResult = await tools.execute('check_software', { software: 'pyscf' });
    if (pyscfResult.installed) {
      console.log(chalk.green(`✅ PySCF is installed (${pyscfResult.version})`));
    } else {
      console.log(chalk.yellow('⚠️ PySCF is not installed - I can install it via pip when needed'));
    }
    
    console.log();
    console.log(chalk.gray('💡 I automatically install software as needed for calculations'));
    console.log();
    
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
}

async function demoStructureGeneration() {
  console.log(chalk.yellow('🧬 3D Structure Generation Demo'));
  console.log(chalk.gray('> "Generate 3D structure for water"'));
  console.log();
  
  console.log(chalk.blue('🧬 Generating 3D structure...'));
  
  try {
    const result = await tools.execute('generate_structure', { molecule: 'water' });
    spinner.stop();
    
    console.log('🤖 I generated a 3D structure for water:');
    console.log();
    console.log('```xyz');
    console.log(result.xyz);
    console.log('```');
    console.log();
    console.log(`**Atoms:** ${result.atoms.length}`);
    console.log('**Format:** XYZ coordinates ready for quantum chemistry calculations');
    console.log();
    
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
}

function demoCalculationExamples() {
  console.log(chalk.yellow('🧮 Calculation Examples'));
  console.log(chalk.gray('Here are some things you could ask me:'));
  console.log();
  
  const examples = [
    '"Calculate the HOMO-LUMO gap of benzene using B3LYP"',
    '"Optimize the geometry of caffeine with xTB"',
    '"What\'s the IR spectrum of acetone?"',
    '"Compare the stability of chair vs boat cyclohexane"',
    '"Predict the UV-Vis spectrum of anthracene using TDDFT"',
    '"Calculate NMR chemical shifts for glucose"'
  ];
  
  for (const example of examples) {
    console.log(chalk.cyan(`  ${example}`));
  }
  
  console.log();
  console.log(chalk.gray('🚀 With an LLM backend, I understand natural language and:'));
  console.log(chalk.gray('   • Choose appropriate methods and basis sets'));
  console.log(chalk.gray('   • Install software automatically'));
  console.log(chalk.gray('   • Run calculations and parse results'));
  console.log(chalk.gray('   • Present data in tables and graphs'));
  console.log(chalk.gray('   • Save everything for later reference'));
  console.log();
}

async function main() {
  await demoMoleculeIdentification();
  await demoSoftwareCheck();
  await demoStructureGeneration();
  demoCalculationExamples();
  
  console.log(chalk.green.bold('🎉 Demo completed!'));
  console.log();
  console.log(chalk.yellow('Next Steps:'));
  console.log('1. Set up an LLM provider:');
  console.log('   • OpenAI: export OPENAI_API_KEY="your-key"');
  console.log('   • Anthropic: export ANTHROPIC_API_KEY="your-key"');
  console.log('   • Local: install Ollama (free)');
  console.log();
  console.log('2. Start the full CLI: node src/index.js');
  console.log();
  console.log('3. Try natural language chemistry!');
}

main().catch(console.error);