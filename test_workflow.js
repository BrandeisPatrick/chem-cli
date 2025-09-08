#!/usr/bin/env node

// Simple workflow test for the computational chemistry CLI
import { ResearchPlanner } from './src/planning/research-planner.js';
import { ExecutionPlanner } from './src/planning/execution-planner.js';
import { PrecisionCalculator } from './src/calculators/precision-calculator.js';
import { MoleculeHandler } from './src/chemistry/molecule.js';

async function testWorkflow() {
  console.log('🧪 Testing ChemCLI Workflow\n');

  try {
    // Test 1: Molecule identification
    console.log('1️⃣ Testing molecule identification...');
    const moleculeHandler = new MoleculeHandler();
    const benzene = await moleculeHandler.identify('benzene');
    
    if (benzene.found) {
      console.log(`✅ Successfully identified: ${benzene.name} (${benzene.smiles})`);
    } else {
      console.log('❌ Failed to identify benzene');
      return;
    }

    // Test 2: Research planning
    console.log('\n2️⃣ Testing research planning...');
    const researchPlanner = new ResearchPlanner();
    const researchResult = await researchPlanner.analyze('calculate absorption spectrum of benzene', benzene);
    
    if (researchResult.success) {
      console.log(`✅ Research plan created for: ${researchResult.calculationType}`);
      console.log(`   Method: ${researchResult.theoryLevel.functional}/${researchResult.theoryLevel.basisSet}`);
    } else {
      console.log('❌ Research planning failed');
      return;
    }

    // Test 3: Execution planning
    console.log('\n3️⃣ Testing execution planning...');
    const executionPlanner = new ExecutionPlanner();
    const executionResult = await executionPlanner.plan(researchResult, benzene);
    
    if (executionResult.success) {
      console.log(`✅ Execution plan created using: ${executionResult.selectedSoftware.name}`);
      console.log(`   Score: ${executionResult.selectedSoftware.score}`);
    } else {
      console.log('❌ Execution planning failed');
      return;
    }

    // Test 4: Precision calculation
    console.log('\n4️⃣ Testing precision calculation...');
    const precisionCalculator = new PrecisionCalculator();
    const precisionOptions = precisionCalculator.calculatePrecisionOptions(
      researchResult.calculationType,
      benzene,
      researchResult.theoryLevel,
      executionResult.selectedSoftware.name.toLowerCase()
    );

    if (precisionOptions && precisionOptions.length === 3) {
      console.log('✅ Precision options generated:');
      for (const option of precisionOptions) {
        console.log(`   ${option.name}: ${option.estimatedTime} (${option.basisSet})`);
      }
    } else {
      console.log('❌ Precision calculation failed');
      return;
    }

    // Test 5: 3D structure generation (if available)
    console.log('\n5️⃣ Testing 3D structure generation...');
    try {
      const structure3D = await moleculeHandler.generate3D(benzene.smiles);
      if (structure3D.atoms && structure3D.atoms.length > 0) {
        console.log(`✅ Generated 3D structure with ${structure3D.atoms.length} atoms`);
      }
    } catch (error) {
      console.log(`⚠️  3D structure generation failed: ${error.message} (this is expected without RDKit)`);
    }

    console.log('\n🎉 All core workflow tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Molecule: ${benzene.name} (${benzene.smiles})`);
    console.log(`   • Calculation: ${researchResult.calculationType.replace(/_/g, ' ')}`);
    console.log(`   • Software: ${executionResult.selectedSoftware.name}`);
    console.log(`   • Method: ${researchResult.theoryLevel.functional}/${researchResult.theoryLevel.basisSet}`);
    console.log(`   • Options: ${precisionOptions.length} precision levels`);

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    console.error(error.stack);
  }
}

// Example of how the user interaction would work
function demonstrateUserFlow() {
  console.log('\n' + '='.repeat(50));
  console.log('🎯 Example User Flow:');
  console.log('='.repeat(50));
  
  console.log('\nUser: "Calculate the absorption spectrum of benzene"');
  console.log('\n🤖 ChemCLI would respond with:');
  console.log('   1. Identify benzene molecule');
  console.log('   2. Determine this is a TD-DFT calculation');
  console.log('   3. Select appropriate software (Psi4/ORCA)');
  console.log('   4. Present 3 precision options:');
  console.log('      • Full Precision (24+ hours, ±0.1 eV)');
  console.log('      • Balanced (2-4 hours, ±0.3 eV)');
  console.log('      • Fast Preview (30 min, ±0.8 eV)');
  console.log('\nUser selects option, then ChemCLI generates:');
  console.log('   • research_plan.md');
  console.log('   • execution_plan.md');
  console.log('   • run_plan.md');
  console.log('   • input files and job scripts');
}

// Run the test
testWorkflow().then(() => {
  demonstrateUserFlow();
}).catch(console.error);