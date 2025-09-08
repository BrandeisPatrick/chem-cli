export class ResearchPlanner {
  constructor() {
    this.calculationTypes = {
      'absorption_spectrum': {
        name: 'UV-Vis Absorption Spectrum',
        methods: ['TD-DFT', 'CIS', 'EOM-CCSD'],
        description: 'Time-dependent density functional theory for electronic excitations',
        requiredSteps: ['geometry_optimization', 'frequency_analysis', 'td_dft'],
        keywords: ['absorption', 'uv-vis', 'spectrum', 'excitation', 'electronic transition']
      },
      'emission_spectrum': {
        name: 'Fluorescence/Phosphorescence Spectrum', 
        methods: ['TD-DFT', 'excited_state_optimization'],
        description: 'Excited state optimization followed by TD-DFT',
        requiredSteps: ['geometry_optimization', 'excited_state_optimization', 'td_dft'],
        keywords: ['emission', 'fluorescence', 'phosphorescence', 'excited state']
      },
      'geometry_optimization': {
        name: 'Molecular Geometry Optimization',
        methods: ['DFT', 'HF', 'MP2', 'xTB'],
        description: 'Find minimum energy molecular structure',
        requiredSteps: ['geometry_optimization'],
        keywords: ['optimize', 'geometry', 'structure', 'minimum', 'equilibrium']
      },
      'frequency_analysis': {
        name: 'Vibrational Frequency Analysis',
        methods: ['DFT', 'HF', 'xTB'],
        description: 'Calculate vibrational frequencies and IR spectrum',
        requiredSteps: ['geometry_optimization', 'frequency_analysis'],
        keywords: ['frequency', 'vibration', 'ir', 'infrared', 'spectrum']
      },
      'homo_lumo': {
        name: 'HOMO-LUMO Gap Analysis',
        methods: ['DFT', 'HF'],
        description: 'Calculate frontier molecular orbital energies',
        requiredSteps: ['geometry_optimization', 'single_point'],
        keywords: ['homo', 'lumo', 'gap', 'frontier', 'orbital', 'energy']
      },
      'nmr_prediction': {
        name: 'NMR Chemical Shift Prediction',
        methods: ['DFT_NMR', 'GIAO'],
        description: 'Calculate NMR chemical shifts using gauge-including atomic orbitals',
        requiredSteps: ['geometry_optimization', 'nmr_calculation'],
        keywords: ['nmr', 'chemical shift', '1h', '13c', 'proton', 'carbon']
      },
      'reaction_energy': {
        name: 'Reaction Energy Calculation',
        methods: ['DFT', 'composite_methods'],
        description: 'Calculate reaction energies and barriers',
        requiredSteps: ['geometry_optimization', 'frequency_analysis', 'thermochemistry'],
        keywords: ['reaction', 'energy', 'barrier', 'transition', 'state', 'thermodynamics']
      }
    };

    this.functionalRecommendations = {
      'general': 'B3LYP',
      'absorption_spectrum': 'CAM-B3LYP',
      'emission_spectrum': 'CAM-B3LYP',
      'reaction_energy': 'M06-2X',
      'nmr_prediction': 'B3LYP',
      'homo_lumo': 'B3LYP'
    };
  }

  async analyze(userRequest, molecule = null) {
    const request = userRequest.toLowerCase();
    
    // Identify calculation type
    const calculationType = this.identifyCalculationType(request);
    
    if (!calculationType) {
      return {
        success: false,
        error: 'Could not determine calculation type from request',
        suggestions: this.suggestCalculationTypes()
      };
    }

    // Determine theory level
    const theoryLevel = this.recommendTheoryLevel(calculationType, molecule);
    
    // Generate research plan
    const researchPlan = this.generateResearchPlan(calculationType, theoryLevel, molecule, request);

    return {
      success: true,
      calculationType: calculationType,
      theoryLevel: theoryLevel,
      researchPlan: researchPlan
    };
  }

  identifyCalculationType(request) {
    for (const [type, info] of Object.entries(this.calculationTypes)) {
      for (const keyword of info.keywords) {
        if (request.includes(keyword)) {
          return type;
        }
      }
    }
    return null;
  }

  recommendTheoryLevel(calculationType, molecule) {
    const calcInfo = this.calculationTypes[calculationType];
    const preferredFunctional = this.functionalRecommendations[calculationType] || 'B3LYP';
    
    // Estimate molecular size for basis set recommendation
    let basisSet = 'def2-SVP'; // Default
    
    if (molecule) {
      const estimatedSize = this.estimateMolecularSize(molecule);
      if (estimatedSize > 50) {
        basisSet = 'def2-SVP'; // Smaller basis for large molecules
      } else if (estimatedSize > 20) {
        basisSet = 'def2-TZVP';
      } else {
        basisSet = 'def2-QZVP'; // High accuracy for small molecules
      }
    }

    return {
      functional: preferredFunctional,
      basisSet: basisSet,
      methods: calcInfo.methods,
      preferredMethod: calcInfo.methods[0]
    };
  }

  estimateMolecularSize(molecule) {
    // Simple size estimation based on molecule string
    if (typeof molecule === 'string') {
      // Count heavy atoms (rough estimate)
      const heavyAtoms = (molecule.match(/[CNOFPS]/gi) || []).length;
      return heavyAtoms;
    }
    return 10; // Default estimate
  }

  generateResearchPlan(calculationType, theoryLevel, molecule, originalRequest) {
    const calcInfo = this.calculationTypes[calculationType];
    
    const plan = {
      title: `Research Plan: ${calcInfo.name}`,
      objective: originalRequest,
      molecule: molecule || 'User-provided molecule',
      calculationType: calculationType,
      
      theoreticalBackground: {
        method: calcInfo.name,
        description: calcInfo.description,
        theory: this.getTheoreticalBackground(calculationType),
        references: this.getReferences(calculationType)
      },
      
      computationalApproach: {
        functional: theoryLevel.functional,
        basisSet: theoryLevel.basisSet,
        software: 'To be determined in execution planning',
        steps: calcInfo.requiredSteps.map(step => this.describeStep(step))
      },
      
      expectedResults: this.getExpectedResults(calculationType),
      
      limitations: this.getLimitations(calculationType, theoryLevel),
      
      alternativeMethods: calcInfo.methods.slice(1).map(method => ({
        method: method,
        description: `Alternative approach using ${method}`,
        advantages: this.getMethodAdvantages(method),
        disadvantages: this.getMethodDisadvantages(method)
      }))
    };

    return plan;
  }

  getTheoreticalBackground(calculationType) {
    const backgrounds = {
      'absorption_spectrum': 'Time-dependent density functional theory (TD-DFT) calculates electronic excitation energies by solving the time-dependent Schrödinger equation in the linear response regime.',
      'emission_spectrum': 'Emission spectra require optimization of excited state geometries followed by TD-DFT calculations from the relaxed excited state.',
      'geometry_optimization': 'Molecular geometry optimization finds stationary points on the potential energy surface using gradient-based algorithms.',
      'frequency_analysis': 'Harmonic frequency analysis involves computing the second derivatives of the energy with respect to nuclear coordinates.',
      'homo_lumo': 'Frontier molecular orbital theory relates electronic properties to the highest occupied (HOMO) and lowest unoccupied (LUMO) molecular orbitals.',
      'nmr_prediction': 'NMR chemical shifts are calculated using gauge-including atomic orbitals (GIAO) to ensure gauge-origin independence.',
      'reaction_energy': 'Reaction energetics involve calculating energy differences between reactants, products, and transition states.'
    };
    
    return backgrounds[calculationType] || 'Standard quantum chemical calculation.';
  }

  getReferences(calculationType) {
    const references = {
      'absorption_spectrum': [
        'Runge, E.; Gross, E. K. U. Phys. Rev. Lett. 1984, 52, 997.',
        'Dreuw, A.; Head-Gordon, M. Chem. Rev. 2005, 105, 4009.'
      ],
      'emission_spectrum': [
        'Adamo, C.; Jacquemin, D. Chem. Soc. Rev. 2013, 42, 845.',
        'Laurent, A. D.; Jacquemin, D. Int. J. Quantum Chem. 2013, 113, 2019.'
      ],
      'geometry_optimization': [
        'Schlegel, H. B. J. Comput. Chem. 2003, 24, 1514.',
        'Peng, C.; Schlegel, H. B. Isr. J. Chem. 1993, 33, 449.'
      ]
    };
    
    return references[calculationType] || ['Standard quantum chemistry references'];
  }

  describeStep(step) {
    const descriptions = {
      'geometry_optimization': 'Optimize molecular geometry to find minimum energy structure',
      'frequency_analysis': 'Calculate vibrational frequencies to confirm stationary point',
      'td_dft': 'Perform time-dependent DFT calculation for excited states',
      'excited_state_optimization': 'Optimize geometry in excited state',
      'single_point': 'Single point energy calculation at optimized geometry',
      'nmr_calculation': 'Calculate NMR chemical shifts using GIAO method',
      'thermochemistry': 'Calculate thermodynamic properties from frequencies'
    };
    
    return {
      name: step,
      description: descriptions[step] || `Perform ${step} calculation`
    };
  }

  getExpectedResults(calculationType) {
    const results = {
      'absorption_spectrum': [
        'UV-Vis absorption spectrum with peak positions and intensities',
        'Electronic transition energies and oscillator strengths',
        'Assignment of electronic transitions'
      ],
      'emission_spectrum': [
        'Fluorescence/phosphorescence emission spectrum',
        'Stokes shift calculation',
        'Excited state lifetimes (if calculated)'
      ],
      'geometry_optimization': [
        'Optimized molecular geometry',
        'Final energy and gradient norm',
        'Structural parameters (bond lengths, angles)'
      ],
      'frequency_analysis': [
        'IR spectrum with peak positions and intensities',
        'Thermodynamic properties (enthalpy, entropy, Gibbs energy)',
        'Zero-point energy correction'
      ]
    };
    
    return results[calculationType] || ['Standard quantum chemical results'];
  }

  getLimitations(calculationType, theoryLevel) {
    const limitations = {
      'absorption_spectrum': [
        'TD-DFT may have issues with charge transfer states',
        'Double excitations are not included',
        `${theoryLevel.functional} functional limitations for excited states`
      ],
      'emission_spectrum': [
        'Assumes vertical emission approximation if geometry not optimized',
        'Solvent effects may not be fully captured',
        'Spin-orbit coupling effects not included'
      ]
    };
    
    return limitations[calculationType] || ['Standard DFT limitations apply'];
  }

  getMethodAdvantages(method) {
    const advantages = {
      'TD-DFT': 'Good balance of accuracy and computational cost',
      'CIS': 'Fast and suitable for large molecules',
      'EOM-CCSD': 'High accuracy for excited states',
      'xTB': 'Very fast, suitable for large systems'
    };
    
    return advantages[method] || 'Standard advantages';
  }

  getMethodDisadvantages(method) {
    const disadvantages = {
      'TD-DFT': 'Issues with charge transfer and Rydberg states',
      'CIS': 'Less accurate than TD-DFT',
      'EOM-CCSD': 'Computationally expensive',
      'xTB': 'Lower accuracy, semi-empirical'
    };
    
    return disadvantages[method] || 'Standard disadvantages';
  }

  suggestCalculationTypes() {
    return Object.keys(this.calculationTypes).map(type => ({
      type: type,
      name: this.calculationTypes[type].name,
      keywords: this.calculationTypes[type].keywords.slice(0, 3)
    }));
  }
}