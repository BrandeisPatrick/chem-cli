import { TimeEstimator } from './time-estimator.js';
import { AccuracyEstimator } from './accuracy-estimator.js';

export class PrecisionCalculator {
  constructor() {
    this.timeEstimator = new TimeEstimator();
    this.accuracyEstimator = new AccuracyEstimator();
    
    this.precisionLevels = {
      'full': {
        name: 'Full Precision',
        description: 'Maximum accuracy using large basis sets and tight convergence',
        priority: 1,
        color: 'blue'
      },
      'half': {
        name: 'Balanced Precision',
        description: 'Good accuracy with reasonable computational cost',
        priority: 2,
        color: 'green'
      },
      'low': {
        name: 'Fast Preview',
        description: 'Quick results using smaller basis sets for initial screening',
        priority: 3,
        color: 'yellow'
      }
    };

    this.basisSetHierarchy = {
      'full': {
        'small': 'def2-QZVP',    // < 10 atoms
        'medium': 'def2-TZVP',   // 10-30 atoms
        'large': 'def2-SVP'      // > 30 atoms
      },
      'half': {
        'small': 'def2-TZVP',
        'medium': 'def2-SVP', 
        'large': 'def2-SVP'
      },
      'low': {
        'small': 'def2-SVP',
        'medium': 'STO-3G',
        'large': 'STO-3G'
      }
    };

    this.convergenceCriteria = {
      'full': {
        'energy': 1e-8,
        'gradient': 1e-6,
        'density': 1e-8,
        'maxIterations': 200
      },
      'half': {
        'energy': 1e-6,
        'gradient': 1e-4,
        'density': 1e-6,
        'maxIterations': 100
      },
      'low': {
        'energy': 1e-4,
        'gradient': 1e-3,
        'density': 1e-4,
        'maxIterations': 50
      }
    };
  }

  calculatePrecisionOptions(calculationType, moleculeInfo, theoryLevel, software = 'psi4') {
    const moleculeSize = this.estimateMoleculeSize(moleculeInfo);
    const sizeCategory = this.getSizeCategory(moleculeSize);
    
    const options = [];

    for (const [level, config] of Object.entries(this.precisionLevels)) {
      const option = this.generatePrecisionOption(
        level,
        config,
        calculationType,
        moleculeInfo,
        theoryLevel,
        software,
        sizeCategory
      );
      options.push(option);
    }

    // Sort by priority (full precision first)
    return options.sort((a, b) => a.priority - b.priority);
  }

  generatePrecisionOption(level, config, calculationType, moleculeInfo, theoryLevel, software, sizeCategory) {
    // Get basis set for this precision level
    const basisSet = this.basisSetHierarchy[level][sizeCategory];
    
    // Estimate computational time
    const timeEstimate = this.timeEstimator.estimate({
      calculationType,
      precisionLevel: level,
      moleculeSize: this.estimateMoleculeSize(moleculeInfo),
      basisSet,
      functional: theoryLevel.functional,
      software
    });

    // Estimate accuracy compared to full precision
    const accuracyEstimate = this.accuracyEstimator.estimate({
      calculationType,
      precisionLevel: level,
      basisSet,
      functional: theoryLevel.functional,
      referenceLevel: 'full'
    });

    // Get computational parameters
    const computationalParams = this.getComputationalParameters(level, sizeCategory);

    return {
      level: level,
      name: config.name,
      description: config.description,
      priority: config.priority,
      color: config.color,
      
      // Technical specifications
      basisSet: basisSet,
      convergence: this.convergenceCriteria[level],
      
      // Resource requirements
      estimatedTime: timeEstimate.formatted,
      timeRange: timeEstimate.range,
      memoryRequirement: computationalParams.memory,
      cpuCores: computationalParams.cores,
      diskSpace: computationalParams.disk,
      
      // Accuracy information
      accuracyVsExperiment: accuracyEstimate.vsExperiment,
      accuracyVsFull: accuracyEstimate.vsFull,
      expectedError: accuracyEstimate.expectedError,
      confidenceLevel: accuracyEstimate.confidence,
      
      // Recommendations
      recommended: this.getRecommendation(level, calculationType, moleculeInfo),
      warnings: this.getWarnings(level, calculationType, moleculeInfo),
      
      // Cost-benefit analysis
      costBenefit: this.analyzeCostBenefit(level, timeEstimate, accuracyEstimate),
      
      // When to use
      useCases: this.getUseCases(level, calculationType)
    };
  }

  estimateMoleculeSize(moleculeInfo) {
    if (moleculeInfo.estimatedSize) {
      return moleculeInfo.estimatedSize;
    }
    
    if (moleculeInfo.atoms) {
      return moleculeInfo.atoms.length;
    }
    
    if (moleculeInfo.smiles) {
      // Rough estimate from SMILES
      const heavyAtoms = (moleculeInfo.smiles.match(/[CNOFPS]/gi) || []).length;
      return Math.max(heavyAtoms, moleculeInfo.smiles.length / 3);
    }
    
    return 10; // Default estimate
  }

  getSizeCategory(moleculeSize) {
    if (moleculeSize < 10) return 'small';
    if (moleculeSize < 30) return 'medium';
    return 'large';
  }

  getComputationalParameters(precisionLevel, sizeCategory) {
    const params = {
      'full': {
        'small': { memory: '8 GB', cores: 8, disk: '5 GB' },
        'medium': { memory: '16 GB', cores: 16, disk: '10 GB' },
        'large': { memory: '32 GB', cores: 24, disk: '20 GB' }
      },
      'half': {
        'small': { memory: '4 GB', cores: 4, disk: '2 GB' },
        'medium': { memory: '8 GB', cores: 8, disk: '5 GB' },
        'large': { memory: '16 GB', cores: 12, disk: '10 GB' }
      },
      'low': {
        'small': { memory: '2 GB', cores: 2, disk: '1 GB' },
        'medium': { memory: '4 GB', cores: 4, disk: '2 GB' },
        'large': { memory: '8 GB', cores: 6, disk: '3 GB' }
      }
    };

    return params[precisionLevel][sizeCategory];
  }

  getRecommendation(level, calculationType, moleculeInfo) {
    const size = this.estimateMoleculeSize(moleculeInfo);
    
    // Recommendations based on calculation type and molecule size
    if (calculationType === 'absorption_spectrum') {
      if (level === 'full') {
        return size < 20 ? 'Recommended for publication-quality results' : 'Use only if high accuracy is critical';
      }
      if (level === 'half') {
        return 'Good balance of accuracy and speed - recommended for most studies';
      }
      return 'Good for initial screening and method testing';
    }
    
    if (calculationType === 'geometry_optimization') {
      if (level === 'full') {
        return size < 30 ? 'Best for accurate geometric parameters' : 'May be too expensive';
      }
      if (level === 'half') {
        return 'Recommended for most optimization tasks';
      }
      return 'Good for initial structure generation';
    }
    
    return this.getGeneralRecommendation(level);
  }

  getGeneralRecommendation(level) {
    const recommendations = {
      'full': 'Use when highest accuracy is required and computational resources allow',
      'half': 'Recommended balance of accuracy and computational efficiency',
      'low': 'Good for initial screening and rapid results'
    };
    
    return recommendations[level];
  }

  getWarnings(level, calculationType, moleculeInfo) {
    const warnings = [];
    const size = this.estimateMoleculeSize(moleculeInfo);
    
    if (level === 'full' && size > 50) {
      warnings.push('Very large molecule - calculation may take days or fail');
    }
    
    if (level === 'low' && calculationType === 'absorption_spectrum') {
      warnings.push('Low precision may not capture charge-transfer excitations accurately');
    }
    
    if (level === 'low') {
      warnings.push('Results may have significant quantitative errors - use for trends only');
    }
    
    if (calculationType === 'nmr_prediction' && level === 'low') {
      warnings.push('NMR predictions require higher precision for reliable chemical shifts');
    }
    
    return warnings;
  }

  analyzeCostBenefit(level, timeEstimate, accuracyEstimate) {
    const scores = {
      'full': {
        accuracy: 10,
        speed: timeEstimate.hours < 4 ? 6 : timeEstimate.hours < 12 ? 4 : 2,
        efficiency: timeEstimate.hours < 2 ? 8 : timeEstimate.hours < 8 ? 6 : 4
      },
      'half': {
        accuracy: 8,
        speed: 8,
        efficiency: 9
      },
      'low': {
        accuracy: 5,
        speed: 10,
        efficiency: 7
      }
    };

    const score = scores[level];
    const overall = Math.round((score.accuracy + score.speed + score.efficiency) / 3);
    
    return {
      accuracyScore: score.accuracy,
      speedScore: score.speed,
      efficiencyScore: score.efficiency,
      overallScore: overall,
      recommendation: overall >= 8 ? 'Highly recommended' : 
                     overall >= 6 ? 'Good choice' : 
                     overall >= 4 ? 'Consider alternatives' : 'Not recommended'
    };
  }

  getUseCases(level, calculationType) {
    const useCases = {
      'full': [
        'Publication-quality results',
        'Benchmark calculations',
        'Method validation',
        'Critical decision making'
      ],
      'half': [
        'Routine research calculations',
        'Parameter optimization',
        'Comparative studies',
        'Educational purposes'
      ],
      'low': [
        'Initial screening',
        'Method testing',
        'Proof of concept',
        'Large dataset generation'
      ]
    };

    return useCases[level];
  }

  formatPrecisionSummary(options, calculationType, moleculeName) {
    const summary = {
      title: `Precision Options for ${calculationType} of ${moleculeName}`,
      timestamp: new Date().toISOString(),
      totalOptions: options.length,
      options: options,
      
      quickComparison: {
        timeRange: {
          fastest: Math.min(...options.map(o => o.timeRange.min)),
          slowest: Math.max(...options.map(o => o.timeRange.max))
        },
        accuracyRange: {
          lowest: Math.min(...options.map(o => parseFloat(o.expectedError.replace(/[^\d.]/g, '')))),
          highest: Math.max(...options.map(o => parseFloat(o.expectedError.replace(/[^\d.]/g, ''))))
        }
      },
      
      recommendation: this.getOverallRecommendation(options, calculationType)
    };

    return summary;
  }

  getOverallRecommendation(options, calculationType) {
    // Find the option with the best cost-benefit ratio
    const bestOption = options.reduce((best, current) => 
      current.costBenefit.overallScore > best.costBenefit.overallScore ? current : best
    );

    return {
      recommended: bestOption.level,
      reason: `${bestOption.name} offers the best balance of accuracy and computational efficiency`,
      alternatives: options.filter(o => o.level !== bestOption.level)
        .map(o => `${o.name}: ${o.costBenefit.recommendation}`)
    };
  }
}