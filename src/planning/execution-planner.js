export class ExecutionPlanner {
  constructor() {
    this.softwareCapabilities = {
      'psi4': {
        name: 'Psi4',
        type: 'open_source',
        license: 'LGPL',
        strengths: ['TD-DFT', 'coupled_cluster', 'MP2', 'DFT'],
        weaknesses: ['limited_basis_sets'],
        calculationTypes: {
          'absorption_spectrum': { supported: true, recommended: true, performance: 'good' },
          'emission_spectrum': { supported: true, recommended: true, performance: 'good' },
          'geometry_optimization': { supported: true, recommended: true, performance: 'excellent' },
          'frequency_analysis': { supported: true, recommended: true, performance: 'good' },
          'homo_lumo': { supported: true, recommended: true, performance: 'excellent' },
          'nmr_prediction': { supported: true, recommended: false, performance: 'fair' },
          'reaction_energy': { supported: true, recommended: true, performance: 'good' }
        },
        maxAtoms: 100,
        parallelization: true,
        memoryEfficient: true,
        installCommand: 'conda install -c conda-forge psi4'
      },
      
      'orca': {
        name: 'ORCA',
        type: 'free_academic',
        license: 'Academic use only',
        strengths: ['TD-DFT', 'coupled_cluster', 'multireference', 'large_basis_sets'],
        weaknesses: ['manual_installation'],
        calculationTypes: {
          'absorption_spectrum': { supported: true, recommended: true, performance: 'excellent' },
          'emission_spectrum': { supported: true, recommended: true, performance: 'excellent' },
          'geometry_optimization': { supported: true, recommended: true, performance: 'excellent' },
          'frequency_analysis': { supported: true, recommended: true, performance: 'excellent' },
          'homo_lumo': { supported: true, recommended: true, performance: 'excellent' },
          'nmr_prediction': { supported: true, recommended: true, performance: 'excellent' },
          'reaction_energy': { supported: true, recommended: true, performance: 'excellent' }
        },
        maxAtoms: 500,
        parallelization: true,
        memoryEfficient: true,
        installCommand: 'Manual download from ORCA forum required'
      },

      'xtb': {
        name: 'xTB',
        type: 'open_source',
        license: 'LGPL',
        strengths: ['very_fast', 'large_molecules', 'conformer_search'],
        weaknesses: ['semi_empirical', 'limited_properties'],
        calculationTypes: {
          'absorption_spectrum': { supported: false, recommended: false, performance: 'poor' },
          'emission_spectrum': { supported: false, recommended: false, performance: 'poor' },
          'geometry_optimization': { supported: true, recommended: true, performance: 'excellent' },
          'frequency_analysis': { supported: true, recommended: true, performance: 'good' },
          'homo_lumo': { supported: true, recommended: true, performance: 'good' },
          'nmr_prediction': { supported: false, recommended: false, performance: 'poor' },
          'reaction_energy': { supported: true, recommended: false, performance: 'fair' }
        },
        maxAtoms: 10000,
        parallelization: true,
        memoryEfficient: true,
        installCommand: 'conda install -c conda-forge xtb'
      },

      'pyscf': {
        name: 'PySCF',
        type: 'open_source', 
        license: 'Apache 2.0',
        strengths: ['python_integration', 'customizable', 'TD-DFT'],
        weaknesses: ['steep_learning_curve', 'less_user_friendly'],
        calculationTypes: {
          'absorption_spectrum': { supported: true, recommended: true, performance: 'good' },
          'emission_spectrum': { supported: true, recommended: false, performance: 'fair' },
          'geometry_optimization': { supported: true, recommended: false, performance: 'fair' },
          'frequency_analysis': { supported: false, recommended: false, performance: 'poor' },
          'homo_lumo': { supported: true, recommended: true, performance: 'excellent' },
          'nmr_prediction': { supported: true, recommended: false, performance: 'fair' },
          'reaction_energy': { supported: true, recommended: false, performance: 'fair' }
        },
        maxAtoms: 200,
        parallelization: true,
        memoryEfficient: false,
        installCommand: 'conda install -c conda-forge pyscf'
      }
    };

    this.methodSoftwareMapping = {
      'TD-DFT': ['psi4', 'orca', 'pyscf'],
      'DFT': ['psi4', 'orca', 'pyscf', 'xtb'],
      'HF': ['psi4', 'orca', 'pyscf'],
      'MP2': ['psi4', 'orca'],
      'coupled_cluster': ['psi4', 'orca'],
      'xTB': ['xtb']
    };
  }

  async plan(researchPlan, moleculeInfo = null) {
    const calculationType = researchPlan.calculationType;
    const theoryLevel = researchPlan.theoryLevel;
    const molecule = moleculeInfo;

    // Rank software options
    const softwareOptions = this.rankSoftware(calculationType, theoryLevel, molecule);
    
    // Select best software
    const selectedSoftware = softwareOptions[0];
    
    // Generate execution plan
    const executionPlan = this.generateExecutionPlan(
      calculationType, 
      theoryLevel, 
      selectedSoftware, 
      molecule,
      softwareOptions
    );

    return {
      success: true,
      selectedSoftware: selectedSoftware,
      alternativeSoftware: softwareOptions.slice(1, 3),
      executionPlan: executionPlan
    };
  }

  rankSoftware(calculationType, theoryLevel, molecule) {
    const scores = [];
    
    for (const [name, software] of Object.entries(this.softwareCapabilities)) {
      const score = this.calculateSoftwareScore(
        software, 
        calculationType, 
        theoryLevel, 
        molecule
      );
      
      scores.push({
        name: name,
        software: software,
        score: score.total,
        details: score.details
      });
    }

    // Sort by score (highest first)
    return scores.sort((a, b) => b.score - a.score);
  }

  calculateSoftwareScore(software, calculationType, theoryLevel, molecule) {
    let score = 0;
    const details = {};

    // Check if calculation type is supported
    const calcSupport = software.calculationTypes[calculationType];
    if (!calcSupport || !calcSupport.supported) {
      return { total: 0, details: { supported: false } };
    }

    details.supported = true;
    score += calcSupport.recommended ? 30 : 10;
    
    // Performance score
    const performanceScores = { 'excellent': 25, 'good': 20, 'fair': 10, 'poor': 0 };
    score += performanceScores[calcSupport.performance] || 0;
    details.performance = calcSupport.performance;

    // Method compatibility
    if (software.strengths.includes(theoryLevel.preferredMethod) || 
        software.strengths.includes(calculationType)) {
      score += 20;
      details.methodMatch = true;
    }

    // Molecule size consideration
    if (molecule && molecule.estimatedSize) {
      const size = molecule.estimatedSize;
      if (size <= software.maxAtoms) {
        score += 15;
        if (size > 50 && software.memoryEfficient) {
          score += 10;
        }
      } else {
        score -= 20; // Penalty for exceeding size limits
      }
      details.sizeCompatible = size <= software.maxAtoms;
    }

    // Open source preference
    if (software.type === 'open_source') {
      score += 15;
      details.openSource = true;
    }

    // Installation ease
    if (!software.installCommand.includes('Manual')) {
      score += 10;
      details.easyInstall = true;
    }

    return {
      total: score,
      details: details
    };
  }

  generateExecutionPlan(calculationType, theoryLevel, selectedSoftware, molecule, allOptions) {
    const software = selectedSoftware.software;
    const calcInfo = software.calculationTypes[calculationType];

    const plan = {
      title: `Execution Plan: ${software.name} for ${calculationType}`,
      selectedSoftware: {
        name: software.name,
        version: 'Latest',
        license: software.license,
        reasons: this.getSelectionReasons(selectedSoftware.details),
        installation: {
          required: true,
          command: software.installCommand,
          difficulty: software.installCommand.includes('Manual') ? 'Manual' : 'Automatic'
        }
      },

      computationalSetup: {
        method: theoryLevel.preferredMethod,
        functional: theoryLevel.functional,
        basisSet: theoryLevel.basisSet,
        estimatedPerformance: calcInfo.performance,
        parallelization: software.parallelization
      },

      resourceRequirements: this.estimateResourceRequirements(
        calculationType, 
        theoryLevel, 
        molecule, 
        software
      ),

      alternativeSoftware: allOptions.slice(1, 3).map(option => ({
        name: option.software.name,
        score: option.score,
        pros: this.getSoftwarePros(option.software),
        cons: this.getSoftwareCons(option.software),
        reason: this.getAlternativeReason(option.details)
      })),

      riskAssessment: this.assessRisks(calculationType, theoryLevel, software, molecule),

      validation: {
        benchmarkData: this.getBenchmarkData(calculationType, theoryLevel.functional),
        expectedAccuracy: this.getExpectedAccuracy(software.name, calculationType),
        comparisonMethods: this.getComparisonMethods(calculationType)
      }
    };

    return plan;
  }

  getSelectionReasons(details) {
    const reasons = [];
    
    if (details.methodMatch) {
      reasons.push('Excellent compatibility with chosen method');
    }
    if (details.performance === 'excellent') {
      reasons.push('Outstanding performance for this calculation type');
    }
    if (details.openSource) {
      reasons.push('Open source and freely available');
    }
    if (details.easyInstall) {
      reasons.push('Easy installation via package manager');
    }
    if (details.sizeCompatible) {
      reasons.push('Suitable for molecule size');
    }

    return reasons.length > 0 ? reasons : ['Best available option for this calculation'];
  }

  estimateResourceRequirements(calculationType, theoryLevel, molecule, software) {
    const baseRequirements = {
      memory: '4 GB',
      cpu_cores: 4,
      disk_space: '1 GB',
      estimated_time: '30 minutes'
    };

    // Adjust based on molecule size
    if (molecule && molecule.estimatedSize) {
      const size = molecule.estimatedSize;
      if (size > 20) {
        baseRequirements.memory = '8 GB';
        baseRequirements.estimated_time = '1-2 hours';
      }
      if (size > 50) {
        baseRequirements.memory = '16 GB';
        baseRequirements.estimated_time = '2-6 hours';
      }
    }

    // Adjust based on calculation type
    if (calculationType === 'absorption_spectrum' || calculationType === 'emission_spectrum') {
      baseRequirements.memory = baseRequirements.memory.replace(/\d+/, (match) => 
        Math.max(8, parseInt(match) * 2).toString()
      );
    }

    return baseRequirements;
  }

  getSoftwarePros(software) {
    const prosMap = {
      'very_fast': 'Extremely fast calculations',
      'TD-DFT': 'Excellent TD-DFT implementation',
      'large_basis_sets': 'Comprehensive basis set library',
      'python_integration': 'Easy Python integration',
      'customizable': 'Highly customizable',
      'large_molecules': 'Handles large molecular systems'
    };

    return software.strengths.map(strength => 
      prosMap[strength] || strength.replace(/_/g, ' ')
    );
  }

  getSoftwareCons(software) {
    const consMap = {
      'manual_installation': 'Requires manual installation',
      'steep_learning_curve': 'Difficult to learn',
      'limited_basis_sets': 'Limited basis set selection',
      'semi_empirical': 'Lower accuracy (semi-empirical)',
      'limited_properties': 'Limited property calculations'
    };

    return software.weaknesses.map(weakness => 
      consMap[weakness] || weakness.replace(/_/g, ' ')
    );
  }

  getAlternativeReason(details) {
    if (!details.supported) return 'Does not support this calculation type';
    if (details.performance === 'poor') return 'Poor performance for this calculation';
    if (!details.sizeCompatible) return 'Cannot handle molecule of this size';
    return 'Lower overall score than selected software';
  }

  assessRisks(calculationType, theoryLevel, software, molecule) {
    const risks = [];

    // Software-specific risks
    if (software.name === 'ORCA' && software.installCommand.includes('Manual')) {
      risks.push({
        risk: 'Manual installation required',
        severity: 'medium',
        mitigation: 'Follow ORCA installation guide carefully'
      });
    }

    // Method-specific risks
    if (calculationType === 'absorption_spectrum' && theoryLevel.functional === 'B3LYP') {
      risks.push({
        risk: 'B3LYP may underestimate charge-transfer excitations',
        severity: 'low',
        mitigation: 'Consider CAM-B3LYP for charge-transfer systems'
      });
    }

    // Size-related risks
    if (molecule && molecule.estimatedSize > 100) {
      risks.push({
        risk: 'Large molecule may require excessive computational resources',
        severity: 'high',
        mitigation: 'Consider lower theory level or semi-empirical methods'
      });
    }

    return risks;
  }

  getBenchmarkData(calculationType, functional) {
    const benchmarks = {
      'absorption_spectrum': {
        'B3LYP': 'Mean absolute error ~0.3 eV for organic molecules',
        'CAM-B3LYP': 'Mean absolute error ~0.2 eV for charge-transfer systems'
      }
    };

    return benchmarks[calculationType]?.[functional] || 'No specific benchmark data available';
  }

  getExpectedAccuracy(softwareName, calculationType) {
    const accuracy = {
      'Psi4': {
        'absorption_spectrum': '±0.2-0.4 eV',
        'geometry_optimization': '±0.01 Å bond lengths'
      },
      'ORCA': {
        'absorption_spectrum': '±0.15-0.3 eV',
        'geometry_optimization': '±0.005 Å bond lengths'
      }
    };

    return accuracy[softwareName]?.[calculationType] || 'Standard DFT accuracy expected';
  }

  getComparisonMethods(calculationType) {
    const comparisons = {
      'absorption_spectrum': ['Experimental UV-Vis spectra', 'Higher-level methods (EOM-CCSD)', 'Alternative functionals'],
      'geometry_optimization': ['X-ray crystallography', 'Microwave spectroscopy', 'Higher basis sets']
    };

    return comparisons[calculationType] || ['Experimental data', 'Alternative methods'];
  }
}