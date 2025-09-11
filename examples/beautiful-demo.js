#!/usr/bin/env node

// Beautiful UI Demo for ChemCLI
import { ASCIIArt } from '../src/cli/ascii-art.js';
import { ChemTools } from '../src/tools/index.js';
import chalk from 'chalk';

console.clear();

// Show welcome screen
console.log(ASCIIArt.getWelcomeScreen());

// Renderer removed - using simple console output
const tools = new ChemTools();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoBeautifulUI() {
  console.log(chalk.cyan.bold('🎨 Beautiful UI Demo'));
  console.log(chalk.gray('══════════════════════════════════════'));
  
  // Demo 1: Software Status
  console.log(chalk.yellow('\n📊 System Status:'));
  console.log(ASCIIArt.getSoftwareStatus('xtb', { installed: true, version: '6.6.1' }));
  console.log(ASCIIArt.getSoftwareStatus('pyscf', { installed: false }));
  console.log(ASCIIArt.getSoftwareStatus('orca', { installed: true, version: '5.0.3' }));
  
  await sleep(2000);
  
  // Demo 2: Calculation Banner
  console.log('\n' + ASCIIArt.getCalculationBanner('optimization'));
  console.log(chalk.blue('🔄 Running geometry optimization...'));
  await sleep(3000);
  spinner1.stop();
  console.log(chalk.green('✅ Geometry optimization completed!'));
  
  await sleep(1000);
  
  // Demo 3: Results Table
  console.log(ASCIIArt.getResultsTable('Benzene Properties', {
    'HOMO Energy': '-6.42 eV',
    'LUMO Energy': '-0.89 eV',
    'HOMO-LUMO Gap': '5.53 eV',
    'Dipole Moment': '0.00 D',
    'Total Energy': '-232.157 Eh'
  }));
  
  await sleep(2000);
  
  // Demo 4: Frequency Analysis
  console.log(ASCIIArt.getCalculationBanner('frequencies'));
  console.log(chalk.blue('🎵 Calculating vibrational frequencies...'));
  await sleep(2500);
  spinner2.stop();
  
  // Show beautiful table
  const freqData = [
    { Mode: '1', Frequency: '3047.2 cm⁻¹', Intensity: 'Strong', Assignment: 'C-H stretch' },
    { Mode: '2', Frequency: '1596.4 cm⁻¹', Intensity: 'Medium', Assignment: 'C=C stretch' },
    { Mode: '3', Frequency: '1178.9 cm⁻¹', Intensity: 'Weak', Assignment: 'C-H bend' },
    { Mode: '4', Frequency: '967.2 cm⁻¹', Intensity: 'Strong', Assignment: 'Ring breathing' }
  ];
  
  console.table(freqData);
  
  await sleep(2000);
  
  // Demo 5: Progress Bar
  console.log(chalk.yellow('\n⚡ Electronic Structure Calculation:'));
  for (let i = 0; i <= 100; i += 10) {
    process.stdout.write('\\r' + ASCIIArt.getProgressBar(i, 100, 'SCF Convergence'));
    await sleep(200);
  }
  console.log();
  
  await sleep(1000);
  
  // Demo 6: Success Message
  console.log(ASCIIArt.getSuccessMessage('All calculations completed successfully! \\nResults saved to: ./results/benzene_b3lyp_2024-01-15.json'));
  
  await sleep(2000);
  
  // Demo 7: Beautiful help system
  console.log(chalk.cyan.bold(`
╭──────────────────────────────────────────────────────────────╮
│                     🌟 FEATURES SHOWCASE                     │
╰──────────────────────────────────────────────────────────────╯
`));

  console.log(chalk.yellow.bold('✨ Beautiful Visual Elements:'));
  console.log(chalk.green('   • Gorgeous ASCII art logo and banners'));
  console.log(chalk.green('   • Color-coded results and status indicators'));
  console.log(chalk.green('   • Interactive progress bars and spinners'));
  console.log(chalk.green('   • Professional table formatting'));
  console.log(chalk.green('   • Molecular structure visualizations'));
  
  console.log(chalk.yellow.bold('\\n🚀 Enhanced User Experience:'));
  console.log(chalk.cyan('   • Auto-completion for molecules and methods'));
  console.log(chalk.cyan('   • Contextual help and tips'));
  console.log(chalk.cyan('   • Graceful error handling'));
  console.log(chalk.cyan('   • Real-time calculation status'));
  
  console.log(chalk.yellow.bold('\\n🧪 Professional Chemistry Features:'));
  console.log(chalk.magenta('   • Support for all major QC packages'));
  console.log(chalk.magenta('   • Automatic software installation'));
  console.log(chalk.magenta('   • Results export and visualization'));
  console.log(chalk.magenta('   • Natural language understanding'));
  
  console.log(chalk.cyan('─'.repeat(70)));
  
  // Demo molecule visualization
  console.log(ASCIIArt.getMoleculeArt());
  
  console.log(chalk.green.bold('🎉 ChemCLI - Where Chemistry Meets Beautiful Design! 🎉'));
  console.log();
  
  console.log(chalk.yellow('To try the full experience:'));
  console.log(chalk.cyan('1. Set up an LLM: export OPENAI_API_KEY="your-key"'));
  console.log(chalk.cyan('2. Run: node src/index.js'));
  console.log(chalk.cyan('3. Ask: "Calculate the HOMO-LUMO gap of caffeine"'));
}

demoBeautifulUI().catch(console.error);