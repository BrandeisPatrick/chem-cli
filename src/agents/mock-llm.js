export class MockLLM {
  constructor(model = 'demo-mode') {
    this.model = model;
    this.responses = this.setupResponses();
  }

  async chat(messages) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Find best matching response
    const response = this.findBestResponse(userMessage);
    
    return response;
  }

  findBestResponse(userInput) {
    // Check for specific molecule + calculation patterns
    for (const [pattern, response] of this.responses) {
      if (this.matchesPattern(userInput, pattern)) {
        return typeof response === 'function' ? response(userInput) : response;
      }
    }

    // Default fallback response
    return this.responses.get('default');
  }

  matchesPattern(input, pattern) {
    if (typeof pattern === 'string') {
      return input.includes(pattern);
    }
    
    if (pattern instanceof RegExp) {
      return pattern.test(input);
    }
    
    if (typeof pattern === 'function') {
      return pattern(input);
    }
    
    return false;
  }

  setupResponses() {
    const responses = new Map();

    // Specific calculation + molecule combinations
    responses.set(
      (input) => input.includes('absorption') && input.includes('benzene'),
      () => this.generateAbsorptionResponse('benzene')
    );

    responses.set(
      (input) => input.includes('absorption') && input.includes('anthracene'),
      () => this.generateAbsorptionResponse('anthracene')
    );

    responses.set(
      (input) => input.includes('absorption') && input.includes('naphthalene'),
      () => this.generateAbsorptionResponse('naphthalene')
    );

    responses.set(
      (input) => input.includes('optimize') && input.includes('water'),
      () => this.generateGeometryResponse('water')
    );

    responses.set(
      (input) => input.includes('optimize') && input.includes('methane'),
      () => this.generateGeometryResponse('methane')
    );

    responses.set(
      (input) => input.includes('homo') && input.includes('lumo'),
      (input) => this.generateHOMOLUMOResponse(this.extractMolecule(input))
    );

    responses.set(
      (input) => input.includes('frequency') || input.includes('ir spectrum'),
      (input) => this.generateFrequencyResponse(this.extractMolecule(input))
    );

    responses.set(
      (input) => input.includes('nmr'),
      (input) => this.generateNMRResponse(this.extractMolecule(input))
    );

    // General patterns
    responses.set(
      /calculate|compute/,
      () => this.generateGeneralCalculationResponse()
    );

    responses.set('help', this.getHelpResponse());
    responses.set('status', this.getStatusResponse());
    responses.set('hello', this.getGreetingResponse());
    responses.set('hi', this.getGreetingResponse());

    // Selection responses for precision choices
    responses.set('1', this.getPrecisionSelectionResponse('full'));
    responses.set('2', this.getPrecisionSelectionResponse('half'));
    responses.set('3', this.getPrecisionSelectionResponse('low'));
    responses.set('run full', this.getPrecisionSelectionResponse('full'));
    responses.set('run half', this.getPrecisionSelectionResponse('half'));
    responses.set('run low', this.getPrecisionSelectionResponse('low'));

    // Default response
    responses.set('default', this.getDefaultResponse());

    return responses;
  }

  generateAbsorptionResponse(molecule) {
    const molecules = {
      benzene: {
        smiles: 'c1ccccc1',
        peaks: ['255 nm (B2u ← A1g)', '204 nm (E1u ← A1g)'],
        method: 'CAM-B3LYP'
      },
      anthracene: {
        smiles: 'c1cc2cc3ccccc3cc2cc1',
        peaks: ['377 nm (La)', '252 nm (Bb)'],
        method: 'CAM-B3LYP'
      },
      naphthalene: {
        smiles: 'c1ccc2ccccc2c1',
        peaks: ['311 nm (La)', '275 nm (Lb)', '220 nm (Bb)'],
        method: 'CAM-B3LYP'
      }
    };

    const mol = molecules[molecule] || molecules.benzene;

    return `## 🧪 Calculation Plan for ${molecule}

**Calculation Type:** ABSORPTION SPECTRUM
**Recommended Software:** Psi4
**Method:** ${mol.method}

## ⚙️ Precision Options

I've prepared 3 precision levels for your calculation:

### 🔴 Full Precision (full)
- **Description:** Maximum accuracy using large basis sets and tight convergence
- **Estimated Time:** 4-8 hours
- **Accuracy vs Experiment:** ±0.15 eV
- **Memory Required:** 8 GB
- **Basis Set:** def2-QZVP

### 🟡 Balanced Precision (half)  
- **Description:** Good accuracy with reasonable computational cost
- **Estimated Time:** 1-2 hours
- **Accuracy vs Experiment:** ±0.25 eV
- **Memory Required:** 4 GB
- **Basis Set:** def2-TZVP
- **✅ Recommended balance of accuracy and computational efficiency**

### 🟢 Fast Preview (low)
- **Description:** Quick results using smaller basis sets for initial screening  
- **Estimated Time:** 15-30 minutes
- **Accuracy vs Experiment:** ±0.5 eV
- **Memory Required:** 2 GB
- **Basis Set:** def2-SVP

## 🚀 Next Steps

Please choose your preferred precision level by typing one of:
- \`run full\` - Maximum accuracy (may take hours/days)
- \`run half\` - Balanced accuracy and speed (recommended) 
- \`run low\` - Quick preview (minutes to hours)

I'll then generate all the input files and commands needed to run your calculation!

*Expected major transitions: ${mol.peaks.join(', ')}*`;
  }

  generateGeometryResponse(molecule) {
    return `## 🧪 Calculation Plan for ${molecule}

**Calculation Type:** GEOMETRY OPTIMIZATION
**Recommended Software:** Psi4
**Method:** B3LYP

## ⚙️ Precision Options

I've prepared 3 precision levels for your calculation:

### 🔴 Full Precision (full)
- **Description:** Tight convergence criteria and large basis set
- **Estimated Time:** 2-4 hours
- **Accuracy vs Experiment:** ±0.005 Å
- **Memory Required:** 6 GB
- **Basis Set:** def2-QZVP

### 🟡 Balanced Precision (half)  
- **Description:** Standard convergence with good basis set
- **Estimated Time:** 30-60 minutes
- **Accuracy vs Experiment:** ±0.01 Å
- **Memory Required:** 3 GB
- **Basis Set:** def2-TZVP
- **✅ Recommended for most geometry optimizations**

### 🟢 Fast Preview (low)
- **Description:** Quick optimization for initial screening
- **Estimated Time:** 5-15 minutes
- **Accuracy vs Experiment:** ±0.02 Å
- **Memory Required:** 1 GB
- **Basis Set:** def2-SVP

## 🚀 Next Steps

Please choose your preferred precision level by typing one of:
- \`run full\` - Maximum accuracy
- \`run half\` - Balanced accuracy and speed (recommended) 
- \`run low\` - Quick preview

I'll then generate all the input files and commands needed to run your calculation!`;
  }

  generateHOMOLUMOResponse(molecule) {
    return `## 🧪 Calculation Plan for HOMO-LUMO Gap

**Calculation Type:** FRONTIER MOLECULAR ORBITALS
**Molecule:** ${molecule || 'your molecule'}
**Recommended Software:** Psi4
**Method:** B3LYP

## ⚙️ Precision Options

### 🔴 Full Precision (full)
- **Estimated Time:** 1-3 hours
- **Accuracy:** ±0.1 eV vs experiment
- **Basis Set:** def2-QZVP

### 🟡 Balanced Precision (half)
- **Estimated Time:** 20-40 minutes  
- **Accuracy:** ±0.2 eV vs experiment
- **Basis Set:** def2-TZVP
- **✅ Recommended for HOMO-LUMO calculations**

### 🟢 Fast Preview (low)
- **Estimated Time:** 5-10 minutes
- **Accuracy:** ±0.4 eV vs experiment
- **Basis Set:** def2-SVP

Please choose your preferred precision level!`;
  }

  generateFrequencyResponse(molecule) {
    return `## 🧪 Frequency Analysis Plan

**Calculation Type:** VIBRATIONAL FREQUENCIES
**Molecule:** ${molecule || 'your molecule'}
**Will calculate:** IR spectrum, thermodynamic properties

## ⚙️ Precision Options

### 🔴 Full Precision (full)
- **Estimated Time:** 3-6 hours
- **Frequency Accuracy:** ±10 cm⁻¹
- **Includes:** Full thermochemistry analysis

### 🟡 Balanced Precision (half)
- **Estimated Time:** 1-2 hours
- **Frequency Accuracy:** ±20 cm⁻¹  
- **✅ Good for most IR predictions**

### 🟢 Fast Preview (low)
- **Estimated Time:** 15-30 minutes
- **Frequency Accuracy:** ±40 cm⁻¹
- **Quick screening only**

Please choose your preferred precision level!`;
  }

  generateNMRResponse(molecule) {
    return `## 🧪 NMR Prediction Plan

**Calculation Type:** NMR CHEMICAL SHIFTS
**Molecule:** ${molecule || 'your molecule'}
**Will predict:** ¹H and ¹³C chemical shifts

## ⚙️ Precision Options

### 🔴 Full Precision (full)
- **Estimated Time:** 2-5 hours
- **Accuracy:** ±0.2 ppm (¹H), ±2 ppm (¹³C)
- **Method:** B3LYP/def2-TZVP with GIAO

### 🟡 Balanced Precision (half)
- **Estimated Time:** 45-90 minutes
- **Accuracy:** ±0.3 ppm (¹H), ±4 ppm (¹³C)
- **✅ Good for chemical shift assignment**

### 🟢 Fast Preview (low)
- **Estimated Time:** 15-30 minutes
- **Accuracy:** ±0.5 ppm (¹H), ±8 ppm (¹³C)
- **Rough estimates only**

Please choose your preferred precision level!`;
  }

  generateGeneralCalculationResponse() {
    return `## 🤔 I'd be happy to help with your calculation!

Could you be more specific about what you'd like to calculate? For example:

**Popular calculations:**
- "Calculate the absorption spectrum of benzene"
- "Optimize the geometry of water"
- "What's the HOMO-LUMO gap of anthracene?"
- "Predict the IR spectrum of methanol"
- "Calculate NMR shifts for glucose"

**Supported molecules:**
- Simple: water, methane, ammonia, ethanol
- Aromatic: benzene, naphthalene, anthracene
- Complex: caffeine, glucose, aspirin
- Or use SMILES notation: c1ccccc1 (benzene)

Just tell me the molecule and calculation type!`;
  }

  getPrecisionSelectionResponse(level) {
    const details = {
      full: { name: 'Full Precision', time: '4-24 hours', accuracy: '±0.1-0.2 eV' },
      half: { name: 'Balanced Precision', time: '1-4 hours', accuracy: '±0.2-0.4 eV' },
      low: { name: 'Fast Preview', time: '15-60 minutes', accuracy: '±0.5-1.0 eV' }
    };

    const choice = details[level];

    return `## 🎉 Calculation Setup Complete!

✅ **Selected: ${choice.name}**

I've generated all the files needed for your **${choice.name.toUpperCase()}** calculation:

### 📋 Generated Files:
- \`research_plan.md\` - Detailed theoretical background
- \`execution_plan.md\` - Software and method selection
- \`run_plan.md\` - Complete execution instructions
- \`input.inp\` - Ready-to-run input file
- \`job.sh\` - Job submission script

### 🚀 Next Steps:
1. Review the generated plans in the \`plans/\` directory
2. Run the calculation using the commands in \`run_plan.md\`
3. Monitor progress and analyze results

**Estimated runtime:** ${choice.time}
**Expected accuracy:** ${choice.accuracy}

### 💡 Demo Note:
*This is a demonstration of ChemCLI's workflow. In real use with an API key, actual calculation files would be generated and you could run real quantum chemistry calculations!*

Good luck with your calculation! 🧪✨`;
  }

  getHelpResponse() {
    return `## 🧪 ChemCLI Help

**Natural Language Examples:**
- "Calculate the absorption spectrum of benzene"
- "Optimize the geometry of water using B3LYP"
- "What's the IR spectrum of methanol?"
- "Compare the stability of chair vs boat cyclohexane"
- "Predict UV-Vis spectrum of anthracene with TDDFT"
- "Calculate NMR shifts for glucose"

**Supported Calculations:**
⚛️ Geometry optimization | 📊 Frequency analysis (IR spectra)
🌈 UV-Vis spectra (TD-DFT) | 🧲 NMR predictions  
⚡ HOMO/LUMO gaps | 🔬 Reaction energetics

**Commands:**
- \`help\` - Show this help
- \`clear\` - Clear screen  
- \`status\` - System status
- \`exit\` - Exit ChemCLI

**Demo Mode:** You're currently in demo mode. Set up an API key to run real calculations!`;
  }

  getStatusResponse() {
    return `## 📊 System Status (Demo Mode)

**🎭 Demo Mode Active**
- Provider: Mock LLM
- Real calculations: Not available
- Planning workflow: ✅ Functional

**🧪 Available Features:**
- Molecule identification: ✅
- Research planning: ✅  
- Execution planning: ✅
- Precision options: ✅
- File generation: ✅ (simulated)

**🚀 To enable real calculations:**
Run \`chem-cli --setup\` to configure an API key.

All core functionality is demonstrated in this mode!`;
  }

  getGreetingResponse() {
    return `## 👋 Hello! Welcome to ChemCLI!

I'm your computational chemistry assistant. I can help you plan and set up quantum chemistry calculations using natural language.

**Try asking me something like:**
- "Calculate the absorption spectrum of benzene"
- "Optimize the geometry of water" 
- "What's the HOMO-LUMO gap of anthracene?"

**Currently in Demo Mode** - I'll show you how the workflow works, but you'll need to set up an API key to run real calculations.

What would you like to calculate today? 🧪`;
  }

  getDefaultResponse() {
    return `## 🤔 I'm not sure I understand that request.

I'm a computational chemistry assistant. I can help with:

**Calculations I can plan:**
- Absorption/emission spectra (TD-DFT)
- Geometry optimizations 
- Frequency analysis (IR spectra)
- HOMO-LUMO gaps
- NMR chemical shifts
- Reaction energetics

**Try something like:**
- "Calculate the absorption spectrum of [molecule]"
- "Optimize the geometry of [molecule]"
- "What's the HOMO-LUMO gap of [molecule]?"

Type \`help\` for more examples! 🧪`;
  }

  extractMolecule(input) {
    // Simple molecule extraction
    const molecules = ['benzene', 'water', 'methane', 'ethanol', 'acetone', 'caffeine', 
                     'glucose', 'anthracene', 'naphthalene', 'toluene', 'phenol'];
    
    for (const mol of molecules) {
      if (input.includes(mol)) {
        return mol;
      }
    }
    
    // Check for common patterns like "of X" or "for X"
    const matches = input.match(/(?:of|for)\s+([a-zA-Z0-9\-\+\[\]()=]+)/i);
    if (matches) {
      return matches[1];
    }
    
    return null;
  }
}