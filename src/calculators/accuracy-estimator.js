export class AccuracyEstimator {
  constructor() {
    // Experimental benchmark data for accuracy estimation
    this.accuracyBenchmarks = {
      'absorption_spectrum': {
        'experimental_vs_calculated': {
          'B3LYP/def2-SVP': { meanError: 0.35, stdDev: 0.25, unit: 'eV' },
          'B3LYP/def2-TZVP': { meanError: 0.25, stdDev: 0.20, unit: 'eV' },
          'B3LYP/def2-QZVP': { meanError: 0.20, stdDev: 0.18, unit: 'eV' },
          'CAM-B3LYP/def2-SVP': { meanError: 0.25, stdDev: 0.22, unit: 'eV' },
          'CAM-B3LYP/def2-TZVP': { meanError: 0.18, stdDev: 0.18, unit: 'eV' },
          'CAM-B3LYP/def2-QZVP': { meanError: 0.15, stdDev: 0.15, unit: 'eV' }
        },
        'basis_set_effects': {
          'STO-3G': 0.8,
          'def2-SVP': 0.3,
          'def2-TZVP': 0.2,
          'def2-QZVP': 0.15
        }
      },
      
      'geometry_optimization': {
        'experimental_vs_calculated': {
          'B3LYP/def2-SVP': { meanError: 0.015, stdDev: 0.012, unit: 'Å' },
          'B3LYP/def2-TZVP': { meanError: 0.008, stdDev: 0.008, unit: 'Å' },
          'B3LYP/def2-QZVP': { meanError: 0.005, stdDev: 0.006, unit: 'Å' }
        }
      },
      
      'frequency_analysis': {
        'experimental_vs_calculated': {
          'B3LYP/def2-SVP': { meanError: 35, stdDev: 25, unit: 'cm⁻¹' },
          'B3LYP/def2-TZVP': { meanError: 25, stdDev: 20, unit: 'cm⁻¹' },
          'B3LYP/def2-QZVP': { meanError: 20, stdDev: 18, unit: 'cm⁻¹' }
        }
      },
      
      'homo_lumo': {
        'experimental_vs_calculated': {
          'B3LYP/def2-SVP': { meanError: 0.4, stdDev: 0.3, unit: 'eV' },
          'B3LYP/def2-TZVP': { meanError: 0.3, stdDev: 0.25, unit: 'eV' },
          'B3LYP/def2-QZVP': { meanError: 0.25, stdDev: 0.22, unit: 'eV' }
        }
      }
    };

    // Precision level accuracy multipliers
    this.precisionAccuracy = {
      'low': {
        multiplier: 2.5,
        description: 'Significant quantitative errors expected'
      },
      'half': {
        multiplier: 1.0,
        description: 'Good quantitative accuracy'
      },
      'full': {
        multiplier: 0.7,
        description: 'Best available accuracy'
      }
    };

    // Functional-specific correction factors
    this.functionalCorrections = {
      'B3LYP': { chargeTransfer: 1.0, generalAccuracy: 1.0 },
      'CAM-B3LYP': { chargeTransfer: 0.7, generalAccuracy: 0.9 },
      'M06-2X': { chargeTransfer: 0.8, generalAccuracy: 0.95 },
      'wB97XD': { chargeTransfer: 0.75, generalAccuracy: 0.9 },
      'PBE': { chargeTransfer: 1.3, generalAccuracy: 1.1 },
      'HF': { chargeTransfer: 0.9, generalAccuracy: 1.2 }
    };
  }

  estimate(calculationParams) {
    const {
      calculationType,
      precisionLevel,
      basisSet,
      functional,
      referenceLevel = 'experiment'
    } = calculationParams;

    // Get base accuracy data
    const baseAccuracy = this.getBaseAccuracy(calculationType, functional, basisSet);
    
    // Apply precision level corrections
    const precisionCorrection = this.precisionAccuracy[precisionLevel];
    
    // Apply functional corrections
    const functionalCorrection = this.functionalCorrections[functional] || { generalAccuracy: 1.0 };
    
    // Calculate expected error
    const expectedError = this.calculateExpectedError(
      baseAccuracy,
      precisionCorrection,
      functionalCorrection,
      calculationType
    );

    // Estimate accuracy vs different references
    const accuracyEstimate = {
      vsExperiment: this.getExperimentalAccuracy(expectedError, calculationType),
      vsFull: this.getRelativeAccuracy(precisionLevel, referenceLevel, expectedError),
      expectedError: this.formatError(expectedError, calculationType),
      confidence: this.getConfidenceLevel(calculationParams),
      reliability: this.getReliabilityLevel(calculationParams),
      limitations: this.getLimitations(calculationParams),
      benchmarkData: this.getBenchmarkReference(calculationType, functional, basisSet)
    };

    return accuracyEstimate;
  }

  getBaseAccuracy(calculationType, functional, basisSet) {
    const methodKey = `${functional}/${basisSet}`;
    const benchmarks = this.accuracyBenchmarks[calculationType]?.experimental_vs_calculated;
    
    if (benchmarks && benchmarks[methodKey]) {
      return benchmarks[methodKey];
    }
    
    // Fallback: estimate based on basis set quality
    const basisQuality = this.estimateBasisSetQuality(basisSet);
    return this.getDefaultAccuracy(calculationType, basisQuality);
  }

  estimateBasisSetQuality(basisSet) {
    const qualityMap = {
      'STO-3G': 0.2,
      'def2-SVP': 0.7,
      'def2-TZVP': 0.9,
      'def2-QZVP': 1.0,
      'cc-pVDZ': 0.8,
      'cc-pVTZ': 0.95,
      'aug-cc-pVDZ': 0.85,
      'aug-cc-pVTZ': 0.98
    };
    
    return qualityMap[basisSet] || 0.5;
  }

  getDefaultAccuracy(calculationType, basisQuality) {
    const defaults = {
      'absorption_spectrum': {
        meanError: 0.4 * (1.5 - basisQuality),
        stdDev: 0.3 * (1.5 - basisQuality),
        unit: 'eV'
      },
      'geometry_optimization': {
        meanError: 0.02 * (1.5 - basisQuality),
        stdDev: 0.015 * (1.5 - basisQuality),
        unit: 'Å'
      },
      'frequency_analysis': {
        meanError: 50 * (1.5 - basisQuality),
        stdDev: 35 * (1.5 - basisQuality),
        unit: 'cm⁻¹'
      },
      'homo_lumo': {
        meanError: 0.5 * (1.5 - basisQuality),
        stdDev: 0.4 * (1.5 - basisQuality),
        unit: 'eV'
      }
    };
    
    return defaults[calculationType] || { meanError: 0.1, stdDev: 0.1, unit: 'a.u.' };
  }

  calculateExpectedError(baseAccuracy, precisionCorrection, functionalCorrection, calculationType) {
    const baseError = baseAccuracy.meanError;
    const precisionMultiplier = precisionCorrection.multiplier;
    const functionalMultiplier = functionalCorrection.generalAccuracy;
    
    const adjustedError = baseError * precisionMultiplier * functionalMultiplier;
    
    return {
      mean: adjustedError,
      stdDev: baseAccuracy.stdDev * precisionMultiplier,
      unit: baseAccuracy.unit,
      range: {
        low: adjustedError * 0.5,
        high: adjustedError * 1.8
      }
    };
  }

  getExperimentalAccuracy(expectedError, calculationType) {
    const errorMagnitude = expectedError.mean;
    const unit = expectedError.unit;
    
    let category, description;
    
    if (calculationType === 'absorption_spectrum') {
      if (errorMagnitude < 0.2) {
        category = 'Excellent';
        description = 'Quantitative agreement with experiment expected';
      } else if (errorMagnitude < 0.4) {
        category = 'Good';
        description = 'Good agreement with experimental trends';
      } else if (errorMagnitude < 0.8) {
        category = 'Fair';
        description = 'Qualitative agreement expected';
      } else {
        category = 'Poor';
        description = 'Large deviations from experiment likely';
      }
    } else {
      // General categorization
      category = errorMagnitude < 0.1 ? 'Excellent' :
                 errorMagnitude < 0.3 ? 'Good' :
                 errorMagnitude < 0.6 ? 'Fair' : 'Poor';
      description = `Expected error: ±${errorMagnitude.toFixed(2)} ${unit}`;
    }
    
    return {
      category: category,
      description: description,
      expectedDeviation: `±${errorMagnitude.toFixed(2)} ${unit}`,
      confidenceInterval: `${expectedError.range.low.toFixed(2)} - ${expectedError.range.high.toFixed(2)} ${unit}`
    };
  }

  getRelativeAccuracy(precisionLevel, referenceLevel, expectedError) {
    if (referenceLevel === 'experiment') {
      return 'See experimental accuracy';
    }
    
    // Compare different precision levels
    const relativeDifferences = {
      'low_vs_half': 1.8,
      'low_vs_full': 2.5,
      'half_vs_full': 1.4
    };
    
    const comparisonKey = `${precisionLevel}_vs_${referenceLevel}`;
    const factor = relativeDifferences[comparisonKey] || 1.0;
    
    return {
      relativeDifference: `${((factor - 1) * 100).toFixed(0)}%`,
      description: `Expected to be ${factor > 1 ? 'less' : 'more'} accurate than ${referenceLevel} precision`,
      expectedDeviation: `±${(expectedError.mean * factor).toFixed(2)} ${expectedError.unit}`
    };
  }

  formatError(expectedError, calculationType) {
    const mean = expectedError.mean;
    const unit = expectedError.unit;
    
    if (mean < 0.01) {
      return `±${(mean * 1000).toFixed(1)} m${unit}`;
    } else if (mean < 1.0) {
      return `±${mean.toFixed(2)} ${unit}`;
    } else {
      return `±${Math.round(mean)} ${unit}`;
    }
  }

  getConfidenceLevel(params) {
    let confidence = 70; // Base confidence (%)
    
    // Adjust based on method and basis set combination
    if (params.functional === 'B3LYP' && params.basisSet === 'def2-TZVP') {
      confidence += 20; // Well-benchmarked combination
    }
    
    // Adjust based on calculation type
    if (params.calculationType === 'geometry_optimization') {
      confidence += 10; // Generally reliable
    } else if (params.calculationType === 'absorption_spectrum') {
      confidence -= 5; // More challenging
    }
    
    // Adjust based on precision level
    if (params.precisionLevel === 'full') {
      confidence += 15;
    } else if (params.precisionLevel === 'low') {
      confidence -= 20;
    }
    
    confidence = Math.max(20, Math.min(95, confidence));
    
    return {
      percentage: confidence,
      level: confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low',
      description: this.getConfidenceDescription(confidence)
    };
  }

  getConfidenceDescription(confidence) {
    if (confidence > 85) {
      return 'Results should be quantitatively reliable';
    } else if (confidence > 70) {
      return 'Results should capture major trends accurately';
    } else if (confidence > 50) {
      return 'Results useful for qualitative comparisons';
    } else {
      return 'Results should be interpreted with caution';
    }
  }

  getReliabilityLevel(params) {
    const factors = [];
    let score = 5; // Out of 10
    
    // Basis set reliability
    const basisQuality = this.estimateBasisSetQuality(params.basisSet);
    score += basisQuality * 2;
    if (basisQuality > 0.8) factors.push('High-quality basis set');
    if (basisQuality < 0.5) factors.push('Small basis set may limit accuracy');
    
    // Functional reliability for calculation type
    if (params.calculationType === 'absorption_spectrum') {
      if (params.functional.includes('CAM')) {
        score += 1;
        factors.push('Range-separated functional good for excitations');
      } else if (params.functional === 'B3LYP') {
        score -= 0.5;
        factors.push('B3LYP may struggle with charge-transfer excitations');
      }
    }
    
    // Precision level
    if (params.precisionLevel === 'full') {
      score += 1.5;
      factors.push('Full precision settings improve reliability');
    } else if (params.precisionLevel === 'low') {
      score -= 1;
      factors.push('Low precision may affect convergence');
    }
    
    score = Math.max(1, Math.min(10, score));
    
    return {
      score: Math.round(score * 10) / 10,
      level: score > 7.5 ? 'High' : score > 5 ? 'Medium' : 'Low',
      factors: factors
    };
  }

  getLimitations(params) {
    const limitations = [];
    
    // Method-specific limitations
    if (params.calculationType === 'absorption_spectrum') {
      limitations.push('TD-DFT may not capture double excitations');
      if (params.functional === 'B3LYP') {
        limitations.push('B3LYP tends to underestimate charge-transfer excitation energies');
      }
    }
    
    // Basis set limitations
    if (params.basisSet === 'STO-3G') {
      limitations.push('Minimal basis set - quantitative accuracy limited');
    } else if (params.basisSet === 'def2-SVP') {
      limitations.push('Double-zeta basis - consider larger basis for high accuracy');
    }
    
    // Precision limitations
    if (params.precisionLevel === 'low') {
      limitations.push('Loose convergence criteria may affect accuracy');
      limitations.push('Results should be used for trends rather than absolute values');
    }
    
    // General limitations
    limitations.push('All DFT calculations have inherent approximations');
    limitations.push('Solvent effects may not be fully captured in gas-phase calculations');
    
    return limitations;
  }

  getBenchmarkReference(calculationType, functional, basisSet) {
    const methodKey = `${functional}/${basisSet}`;
    const benchmarks = this.accuracyBenchmarks[calculationType];
    
    if (benchmarks?.experimental_vs_calculated?.[methodKey]) {
      return {
        available: true,
        source: 'Compiled benchmark database',
        nMolecules: '50-200 molecules',
        reference: benchmarks.experimental_vs_calculated[methodKey]
      };
    }
    
    return {
      available: false,
      source: 'No specific benchmark data',
      recommendation: 'Consider validating against experimental data'
    };
  }

  compareAccuracyOptions(estimates) {
    // Compare multiple accuracy estimates
    const sorted = estimates.sort((a, b) => {
      const aError = parseFloat(a.expectedError.replace(/[^\d.]/g, ''));
      const bError = parseFloat(b.expectedError.replace(/[^\d.]/g, ''));
      return aError - bError; // Sort by increasing error (better accuracy first)
    });
    
    return {
      mostAccurate: sorted[0],
      leastAccurate: sorted[sorted.length - 1],
      recommendations: this.getAccuracyRecommendations(sorted)
    };
  }

  getAccuracyRecommendations(sortedEstimates) {
    const best = sortedEstimates[0];
    const worst = sortedEstimates[sortedEstimates.length - 1];
    
    const recommendations = [];
    
    if (best.confidence.percentage > 80) {
      recommendations.push('Most accurate option has high confidence level');
    }
    
    if (worst.confidence.percentage < 50) {
      recommendations.push('Least accurate option should be used only for screening');
    }
    
    const confidenceRange = best.confidence.percentage - worst.confidence.percentage;
    if (confidenceRange > 30) {
      recommendations.push('Significant accuracy differences between options - choose carefully based on needs');
    }
    
    return recommendations;
  }
}