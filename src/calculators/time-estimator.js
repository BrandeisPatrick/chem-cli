export class TimeEstimator {
  constructor() {
    // Base timing data from benchmarks (in minutes for reference systems)
    this.baseTimes = {
      'geometry_optimization': {
        'xtb': { base: 0.5, scaling: 1.2 },
        'psi4': { base: 5, scaling: 2.0 },
        'orca': { base: 3, scaling: 1.8 },
        'pyscf': { base: 8, scaling: 2.2 }
      },
      'absorption_spectrum': {
        'psi4': { base: 15, scaling: 3.0 },
        'orca': { base: 12, scaling: 2.5 },
        'pyscf': { base: 25, scaling: 3.5 }
      },
      'frequency_analysis': {
        'xtb': { base: 2, scaling: 1.5 },
        'psi4': { base: 20, scaling: 3.5 },
        'orca': { base: 15, scaling: 3.0 }
      },
      'nmr_prediction': {
        'psi4': { base: 30, scaling: 3.0 },
        'orca': { base: 25, scaling: 2.8 }
      }
    };

    // Basis set scaling factors
    this.basisSetFactors = {
      'STO-3G': 1.0,
      'def2-SVP': 1.5,
      'def2-TZVP': 3.0,
      'def2-QZVP': 8.0,
      'cc-pVDZ': 2.0,
      'cc-pVTZ': 5.0,
      'aug-cc-pVDZ': 3.5,
      'aug-cc-pVTZ': 12.0
    };

    // Precision level multipliers
    this.precisionFactors = {
      'low': 0.5,
      'half': 1.0,
      'full': 2.5
    };

    // Functional type multipliers
    this.functionalFactors = {
      'B3LYP': 1.0,
      'CAM-B3LYP': 1.3,
      'M06-2X': 1.2,
      'wB97XD': 1.4,
      'HF': 0.8,
      'xtb': 0.1
    };
  }

  estimate(calculationParams) {
    const {
      calculationType,
      precisionLevel,
      moleculeSize,
      basisSet,
      functional,
      software
    } = calculationParams;

    // Get base time for this calculation type and software
    const baseData = this.baseTimes[calculationType]?.[software];
    if (!baseData) {
      return this.getDefaultEstimate(calculationType, precisionLevel);
    }

    // Calculate time estimate
    const baseTime = baseData.base; // minutes
    const scaling = baseData.scaling;
    
    // Apply molecular size scaling (typically N^3 to N^4 for DFT)
    const sizeScale = Math.pow(moleculeSize / 10, scaling);
    
    // Apply basis set factor
    const basisFactor = this.basisSetFactors[basisSet] || 1.5;
    
    // Apply precision factor
    const precisionFactor = this.precisionFactors[precisionLevel] || 1.0;
    
    // Apply functional factor
    const functionalFactor = this.functionalFactors[functional] || 1.0;
    
    // Calculate total time in minutes
    const totalMinutes = baseTime * sizeScale * basisFactor * precisionFactor * functionalFactor;
    
    // Add convergence uncertainty (±30% typical variation)
    const uncertainty = 0.3;
    const minTime = totalMinutes * (1 - uncertainty);
    const maxTime = totalMinutes * (1 + uncertainty);
    
    return this.formatTimeEstimate(totalMinutes, minTime, maxTime, calculationParams);
  }

  formatTimeEstimate(totalMinutes, minTime, maxTime, params) {
    const estimate = {
      minutes: Math.round(totalMinutes),
      hours: totalMinutes / 60,
      range: {
        min: Math.round(minTime),
        max: Math.round(maxTime),
        minHours: minTime / 60,
        maxHours: maxTime / 60
      },
      formatted: this.formatDuration(totalMinutes),
      rangeFormatted: `${this.formatDuration(minTime)} - ${this.formatDuration(maxTime)}`,
      confidence: this.getConfidenceLevel(params),
      factors: this.getTimingFactors(params),
      bottlenecks: this.identifyBottlenecks(params, totalMinutes)
    };

    return estimate;
  }

  formatDuration(minutes) {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} seconds`;
    } else if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    } else if (minutes < 24 * 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
      return `${hours}h ${remainingMinutes}m`;
    } else {
      const days = Math.floor(minutes / (24 * 60));
      const remainingHours = Math.floor((minutes % (24 * 60)) / 60);
      return `${days} day${days !== 1 ? 's' : ''} ${remainingHours}h`;
    }
  }

  getConfidenceLevel(params) {
    let confidence = 'medium';
    
    // Higher confidence for well-benchmarked combinations
    if (params.software === 'psi4' && params.calculationType === 'geometry_optimization') {
      confidence = 'high';
    }
    
    // Lower confidence for large molecules or new methods
    if (params.moleculeSize > 100) {
      confidence = 'low';
    }
    
    if (params.basisSet && this.basisSetFactors[params.basisSet] > 5) {
      confidence = 'low';
    }
    
    return confidence;
  }

  getTimingFactors(params) {
    const factors = [];
    
    if (params.moleculeSize > 30) {
      factors.push(`Large molecule (${params.moleculeSize} atoms) increases time significantly`);
    }
    
    if (params.basisSet && this.basisSetFactors[params.basisSet] > 3) {
      factors.push(`Large basis set (${params.basisSet}) is computationally expensive`);
    }
    
    if (params.calculationType === 'absorption_spectrum') {
      factors.push('TD-DFT calculations require solving many excited states');
    }
    
    if (params.precisionLevel === 'full') {
      factors.push('Full precision uses tight convergence criteria');
    }
    
    return factors;
  }

  identifyBottlenecks(params, totalMinutes) {
    const bottlenecks = [];
    
    // CPU bottlenecks
    if (totalMinutes > 120) { // > 2 hours
      bottlenecks.push({
        type: 'CPU',
        description: 'Long calculation time - consider using more CPU cores',
        suggestion: 'Use parallel execution with 8-16 cores'
      });
    }
    
    // Memory bottlenecks
    if (params.moleculeSize > 50 || (params.basisSet && this.basisSetFactors[params.basisSet] > 5)) {
      bottlenecks.push({
        type: 'Memory',
        description: 'Large basis set or molecule may require significant memory',
        suggestion: 'Ensure 16+ GB RAM available, consider memory-efficient algorithms'
      });
    }
    
    // Convergence bottlenecks
    if (params.calculationType === 'absorption_spectrum' && params.moleculeSize > 30) {
      bottlenecks.push({
        type: 'Convergence',
        description: 'TD-DFT convergence can be challenging for large molecules',
        suggestion: 'May need to adjust convergence criteria or initial guess'
      });
    }
    
    return bottlenecks;
  }

  getDefaultEstimate(calculationType, precisionLevel) {
    // Fallback estimates when specific timing data is not available
    const defaults = {
      'geometry_optimization': { low: 15, half: 45, full: 120 },
      'absorption_spectrum': { low: 30, half: 90, full: 300 },
      'frequency_analysis': { low: 45, half: 120, full: 360 },
      'nmr_prediction': { low: 60, half: 180, full: 480 }
    };
    
    const timeMinutes = defaults[calculationType]?.[precisionLevel] || 60;
    
    return {
      minutes: timeMinutes,
      hours: timeMinutes / 60,
      range: {
        min: Math.round(timeMinutes * 0.7),
        max: Math.round(timeMinutes * 1.5),
        minHours: (timeMinutes * 0.7) / 60,
        maxHours: (timeMinutes * 1.5) / 60
      },
      formatted: this.formatDuration(timeMinutes),
      rangeFormatted: `${this.formatDuration(timeMinutes * 0.7)} - ${this.formatDuration(timeMinutes * 1.5)}`,
      confidence: 'low',
      factors: ['Using default timing estimates - actual times may vary significantly'],
      bottlenecks: []
    };
  }

  estimateQueueTime(priority = 'normal', clusterLoad = 'medium') {
    // Estimate queue waiting time for cluster systems
    const queueTimes = {
      'low_load': { normal: 5, high: 2, low: 15 },
      'medium_load': { normal: 30, high: 10, low: 60 },
      'high_load': { normal: 120, high: 45, low: 240 }
    };
    
    const loadKey = clusterLoad === 'low' ? 'low_load' : 
                    clusterLoad === 'high' ? 'high_load' : 'medium_load';
    
    const waitMinutes = queueTimes[loadKey][priority] || 30;
    
    return {
      minutes: waitMinutes,
      formatted: this.formatDuration(waitMinutes),
      priority: priority,
      clusterLoad: clusterLoad
    };
  }

  compareOptions(estimates) {
    // Compare multiple timing estimates
    const sorted = estimates.sort((a, b) => a.minutes - b.minutes);
    
    return {
      fastest: sorted[0],
      slowest: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      totalRange: {
        min: sorted[0].minutes,
        max: sorted[sorted.length - 1].minutes,
        ratio: sorted[sorted.length - 1].minutes / sorted[0].minutes
      },
      recommendations: this.getTimingRecommendations(sorted)
    };
  }

  getTimingRecommendations(sortedEstimates) {
    const fastest = sortedEstimates[0];
    const slowest = sortedEstimates[sortedEstimates.length - 1];
    
    const recommendations = [];
    
    if (fastest.minutes < 30) {
      recommendations.push('Fastest option completes in under 30 minutes - good for interactive work');
    }
    
    if (slowest.minutes > 1440) { // > 24 hours
      recommendations.push('Slowest option takes over 24 hours - consider overnight or weekend runs');
    }
    
    const ratio = slowest.minutes / fastest.minutes;
    if (ratio > 10) {
      recommendations.push(`Slowest option is ${Math.round(ratio)}x slower - consider if the extra accuracy is worth the time`);
    }
    
    return recommendations;
  }
}