# ChemCLI Examples

This document shows examples of how to use the natural language computational chemistry CLI.

## Basic Usage

Start the CLI:
```bash
npm start
# or
node src/index.js
```

## Example Conversations

### 1. Absorption Spectrum Calculation

**User:** "Calculate the absorption spectrum of benzene"

**ChemCLI Response:**
```
🧪 Calculation Plan for benzene

Calculation Type: ABSORPTION_SPECTRUM
Recommended Software: Psi4
Method: CAM-B3LYP

⚙️ Precision Options

I've prepared 3 precision levels for your calculation:

🔴 Full Precision (full)
- Description: Maximum accuracy using large basis sets and tight convergence
- Estimated Time: 4-8 hours
- Accuracy vs Experiment: Excellent
- Memory Required: 8 GB
- Basis Set: def2-QZVP

🟡 Balanced Precision (half)  
- Description: Good accuracy with reasonable computational cost
- Estimated Time: 1-2 hours
- Accuracy vs Experiment: Good
- Memory Required: 4 GB
- Basis Set: def2-TZVP
- ✅ Recommended balance of accuracy and computational efficiency

🟢 Fast Preview (low)
- Description: Quick results using smaller basis sets for initial screening  
- Estimated Time: 15-30 minutes
- Accuracy vs Experiment: Fair
- Memory Required: 2 GB
- Basis Set: def2-SVP

🚀 Next Steps

Please choose your preferred precision level by typing one of:
- `run full` - Maximum accuracy (may take hours/days)
- `run half` - Balanced accuracy and speed (recommended) 
- `run low` - Quick preview (minutes to hours)

I'll then generate all the input files and commands needed to run your calculation!
```

**User:** "2" or "run half"

**ChemCLI Response:**
```
🎉 Calculation Setup Complete!

I've generated all the files needed for your HALF precision calculation:

📋 Generated Files:
- `research_plan.md` - Detailed theoretical background
- `execution_plan.md` - Software and method selection
- `run_plan.md` - Complete execution instructions
- `input.inp` - Ready-to-run input file
- `job.sh` - Job submission script

🚀 Next Steps:
1. Review the generated plans in the `plans/` directory
2. Run the calculation using the commands in `run_plan.md`
3. Monitor progress and analyze results

Estimated runtime: 1-4 hours
Expected accuracy: ±0.2-0.4 eV vs experiment

Good luck with your calculation! 🧪✨
```

### 2. Geometry Optimization

**User:** "Optimize the geometry of water"

**ChemCLI Response:**
- Identifies water molecule (H2O)
- Determines geometry optimization needed
- Recommends B3LYP/def2-TZVP method
- Shows precision options for optimization
- Generates input files when user chooses

### 3. HOMO-LUMO Gap

**User:** "What's the HOMO-LUMO gap of anthracene?"

**ChemCLI Response:**
- Identifies anthracene molecule
- Sets up single point energy calculation
- Recommends appropriate method for frontier orbitals
- Provides precision options
- Generates calculation files

## Supported Calculation Types

1. **Absorption Spectrum** - TD-DFT calculations for UV-Vis spectra
2. **Emission Spectrum** - Excited state optimization + TD-DFT
3. **Geometry Optimization** - Find minimum energy structure
4. **Frequency Analysis** - Vibrational frequencies and IR spectra
5. **HOMO-LUMO Gap** - Frontier molecular orbital energies
6. **NMR Prediction** - Chemical shift calculations
7. **Reaction Energy** - Energy differences between species

## Supported Software

- **Psi4** - Open source quantum chemistry (recommended)
- **ORCA** - Free for academic use, powerful features
- **xTB** - Fast semi-empirical calculations
- **PySCF** - Python-based DFT calculations

## Precision Levels

### Full Precision
- **Purpose:** Publication-quality results
- **Time:** Hours to days
- **Accuracy:** ±0.1-0.2 eV vs experiment
- **Resources:** High memory, large basis sets
- **Use when:** Final results needed, method validation

### Balanced Precision (Recommended)
- **Purpose:** Routine research calculations
- **Time:** Minutes to hours  
- **Accuracy:** ±0.2-0.4 eV vs experiment
- **Resources:** Moderate memory and CPU
- **Use when:** Most research applications

### Fast Preview
- **Purpose:** Initial screening, proof of concept
- **Time:** Seconds to minutes
- **Accuracy:** ±0.5-1.0 eV vs experiment  
- **Resources:** Low memory, small basis sets
- **Use when:** Testing, large datasets, initial exploration

## File Outputs

When you run a calculation, ChemCLI generates:

1. **research_plan.md** - Theoretical background and method justification
2. **execution_plan.md** - Software selection and computational setup
3. **run_plan.md** - Step-by-step execution instructions
4. **Input files** - Ready-to-run calculation inputs (`.inp`, `.in`, etc.)
5. **Job scripts** - Batch submission scripts for clusters

## Tips

- Be specific about molecules: "benzene", "C6H6", "c1ccccc1"
- Mention solvation if needed: "in water", "in acetone"
- Ask for comparisons: "compare B3LYP vs CAM-B3LYP"
- Request specific properties: "dipole moment", "oscillator strengths"

## Special Commands

- `help` - Show help information
- `status` - Check system and software status
- `clear` - Clear screen and restart
- `exit` - Exit ChemCLI

## Testing the Implementation

Run the workflow test:
```bash
node test_workflow.js
```

This will test:
- Molecule identification
- Research planning  
- Execution planning
- Precision calculations
- 3D structure generation (if available)