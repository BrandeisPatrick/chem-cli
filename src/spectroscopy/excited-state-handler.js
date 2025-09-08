export class ExcitedStateHandler {
  constructor() {
    this.transitionTypes = {
      'π→π*': {
        description: 'π to π* transitions in conjugated systems',
        typical_energy: [4, 8], // eV
        intensity: 'high',
        solvent_effects: 'moderate'
      },
      'n→π*': {
        description: 'n to π* transitions (lone pair to π*)',
        typical_energy: [2, 5], // eV
        intensity: 'low',
        solvent_effects: 'strong'
      },
      'n→σ*': {
        description: 'n to σ* transitions',
        typical_energy: [6, 10], // eV
        intensity: 'low',
        solvent_effects: 'moderate'
      },
      'σ→σ*': {
        description: 'σ to σ* transitions',
        typical_energy: [8, 12], // eV
        intensity: 'high',
        solvent_effects: 'weak'
      },
      'charge_transfer': {
        description: 'Intramolecular charge transfer',
        typical_energy: [2, 6], // eV
        intensity: 'variable',
        solvent_effects: 'very_strong'
      },
      'rydberg': {
        description: 'Transitions to Rydberg states',
        typical_energy: [6, 12], // eV
        intensity: 'low',
        solvent_effects: 'strong'
      }
    };

    // Common chromophores and their typical absorption characteristics
    this.chromophoreLibrary = {
      'benzene': {
        transitions: [
          { type: 'π→π*', wavelength: 255, intensity: 'medium', assignment: '¹B₂ᵤ ← ¹A₁g' },
          { type: 'π→π*', wavelength: 204, intensity: 'high', assignment: '¹E₁ᵤ ← ¹A₁g' }
        ],
        extinction_coefficient: 230
      },
      'naphthalene': {
        transitions: [
          { type: 'π→π*', wavelength: 311, intensity: 'low', assignment: '¹L_a' },
          { type: 'π→π*', wavelength: 275, intensity: 'high', assignment: '¹L_b' },
          { type: 'π→π*', wavelength: 220, intensity: 'very_high', assignment: '¹B_b' }
        ],
        extinction_coefficient: 5900
      },
      'anthracene': {
        transitions: [
          { type: 'π→π*', wavelength: 377, intensity: 'high', assignment: '¹L_a' },
          { type: 'π→π*', wavelength: 252, intensity: 'very_high', assignment: '¹B_b' }
        ],
        extinction_coefficient: 7900
      },
      'carbonyl': {
        transitions: [
          { type: 'n→π*', wavelength: 290, intensity: 'low', assignment: 'n(O) → π*(C=O)' }
        ],
        extinction_coefficient: 15
      }
    };
  }

  analyzeExcitedStates(excitationData) {
    if (!excitationData || !excitationData.excitationEnergies) {
      throw new Error('Invalid excitation data provided');
    }

    const analysis = {
      totalStates: excitationData.excitationEnergies.length,
      brightStates: 0,
      darkStates: 0,
      classifications: [],
      energyDistribution: {},
      recommendations: []
    };

    // Analyze each excited state
    for (const state of excitationData.excitationEnergies) {
      const stateAnalysis = this.analyzeIndividualState(state);
      analysis.classifications.push(stateAnalysis);

      // Count bright vs dark states
      if (state.oscillatorStrength > 0.01) {
        analysis.brightStates++;
      } else {
        analysis.darkStates++;
      }
    }

    // Analyze energy distribution
    analysis.energyDistribution = this.analyzeEnergyDistribution(excitationData.excitationEnergies);

    // Generate recommendations
    analysis.recommendations = this.generateStateRecommendations(analysis);

    return analysis;
  }

  analyzeIndividualState(state) {
    const analysis = {
      state: state.state,
      energy_eV: state.energy_eV,
      energy_nm: state.energy_nm || (1240 / state.energy_eV),
      oscillatorStrength: state.oscillatorStrength || 0,
      brightness: this.classifyBrightness(state.oscillatorStrength || 0),
      transitionType: this.classifyTransitionType(state),
      character: this.assignCharacter(state),
      spectralRegion: this.assignSpectralRegion(state.energy_nm || (1240 / state.energy_eV)),
      properties: this.getStateProperties(state)
    };

    return analysis;
  }

  classifyBrightness(oscillatorStrength) {
    if (oscillatorStrength > 0.1) {
      return 'bright';
    } else if (oscillatorStrength > 0.01) {
      return 'medium';
    } else if (oscillatorStrength > 0.001) {
      return 'weak';
    } else {
      return 'dark';
    }
  }

  classifyTransitionType(state) {
    const energy_eV = state.energy_eV;
    const f = state.oscillatorStrength || 0;

    // Classification based on energy and intensity patterns
    if (energy_eV > 8.0) {
      if (f < 0.01) {
        return 'n→σ* or Rydberg';
      } else {
        return 'σ→σ*';
      }
    } else if (energy_eV > 5.0) {
      if (f > 0.1) {
        return 'π→π* (allowed)';
      } else if (f > 0.01) {
        return 'π→π* (partially allowed)';
      } else {
        return 'n→π* or forbidden π→π*';
      }
    } else if (energy_eV > 2.0) {
      if (f > 0.1) {
        return 'π→π* (extended conjugation)';
      } else if (f > 0.001) {
        return 'n→π* or charge transfer';
      } else {
        return 'Dark state or triplet';
      }
    } else {
      return 'Low-energy charge transfer or defect';
    }
  }

  assignCharacter(state) {
    const analysis = {
      localExcitation: true,
      chargeTransfer: false,
      rydberg: false,
      multiElectron: false
    };

    // Simple heuristics for character assignment
    const energy_eV = state.energy_eV;
    const f = state.oscillatorStrength || 0;

    // Charge transfer states: low energy, variable intensity
    if (energy_eV < 3.0 && f > 0.01) {
      analysis.chargeTransfer = true;
      analysis.localExcitation = false;
    }

    // Rydberg states: high energy, low intensity
    if (energy_eV > 7.0 && f < 0.01) {
      analysis.rydberg = true;
      analysis.localExcitation = false;
    }

    return analysis;
  }

  assignSpectralRegion(wavelength_nm) {
    if (wavelength_nm < 200) {
      return 'Far UV';
    } else if (wavelength_nm < 280) {
      return 'Middle UV';
    } else if (wavelength_nm < 315) {
      return 'Near UV';
    } else if (wavelength_nm < 400) {
      return 'Near UV-A';
    } else if (wavelength_nm < 700) {
      return 'Visible';
    } else {
      return 'Near IR';
    }
  }

  getStateProperties(state) {
    const properties = {
      allowedness: this.assessAllowedness(state.oscillatorStrength || 0),
      spinMultiplicity: 'singlet', // Default assumption
      symmetry: state.symmetry || 'unknown',
      radiativeLifetime: null
    };

    // Estimate radiative lifetime from oscillator strength
    if (state.oscillatorStrength > 0) {
      const f = state.oscillatorStrength;
      const nu_cm = (state.energy_eV || 3.0) * 8065.5; // Convert eV to cm⁻¹
      // τ_rad = 1.499 / (f × ν²) in seconds
      properties.radiativeLifetime = 1.499 / (f * nu_cm * nu_cm) * 1e16; // Convert to ns
    }

    return properties;
  }

  assessAllowedness(oscillatorStrength) {
    if (oscillatorStrength > 0.1) {
      return 'fully allowed';
    } else if (oscillatorStrength > 0.01) {
      return 'partially allowed';
    } else if (oscillatorStrength > 0.001) {
      return 'weakly allowed';
    } else {
      return 'forbidden';
    }
  }

  analyzeEnergyDistribution(states) {
    const energies = states.map(s => s.energy_eV);
    const distribution = {
      min: Math.min(...energies),
      max: Math.max(...energies),
      mean: energies.reduce((a, b) => a + b, 0) / energies.length,
      range: Math.max(...energies) - Math.min(...energies),
      gaps: []
    };

    // Calculate energy gaps between consecutive states
    const sortedEnergies = [...energies].sort((a, b) => a - b);
    for (let i = 1; i < sortedEnergies.length; i++) {
      distribution.gaps.push(sortedEnergies[i] - sortedEnergies[i - 1]);
    }

    distribution.averageGap = distribution.gaps.reduce((a, b) => a + b, 0) / distribution.gaps.length;

    return distribution;
  }

  generateStateRecommendations(analysis) {
    const recommendations = [];

    // Dark state recommendations
    if (analysis.darkStates > analysis.brightStates) {
      recommendations.push({
        type: 'calculation',
        priority: 'medium',
        text: `Many dark states found (${analysis.darkStates}/${analysis.totalStates}). Consider triplet calculations for phosphorescence.`
      });
    }

    // Energy distribution recommendations
    if (analysis.energyDistribution.range > 6.0) {
      recommendations.push({
        type: 'method',
        priority: 'low',
        text: 'Wide energy range suggests need for methods handling both valence and Rydberg states.'
      });
    }

    // Low-energy state recommendations
    const lowEnergyStates = analysis.classifications.filter(s => s.energy_eV < 3.0);
    if (lowEnergyStates.length > 0) {
      recommendations.push({
        type: 'solvent',
        priority: 'high',
        text: 'Low-energy transitions found. Consider solvent effects and charge-transfer character.'
      });
    }

    // High-energy state recommendations
    const highEnergyStates = analysis.classifications.filter(s => s.energy_eV > 7.0);
    if (highEnergyStates.length > 2) {
      recommendations.push({
        type: 'basis',
        priority: 'medium',
        text: 'High-energy transitions present. Diffuse functions may improve Rydberg state description.'
      });
    }

    return recommendations;
  }

  compareWithExperiment(calculatedStates, experimentalData) {
    if (!experimentalData || !experimentalData.peaks) {
      return { error: 'No experimental data provided' };
    }

    const comparison = {
      assignments: [],
      statistics: {},
      recommendations: []
    };

    // Try to assign calculated states to experimental peaks
    for (const expPeak of experimentalData.peaks) {
      const assignment = this.findBestAssignment(expPeak, calculatedStates);
      comparison.assignments.push(assignment);
    }

    // Calculate statistical measures
    const validAssignments = comparison.assignments.filter(a => a.calculatedState);
    if (validAssignments.length > 0) {
      const errors = validAssignments.map(a => 
        Math.abs(a.calculatedState.energy_nm - a.experimentalPeak.wavelength)
      );
      
      comparison.statistics = {
        assignedPeaks: validAssignments.length,
        totalPeaks: experimentalData.peaks.length,
        meanAbsoluteError: errors.reduce((a, b) => a + b, 0) / errors.length,
        maxError: Math.max(...errors),
        rmse: Math.sqrt(errors.reduce((sum, err) => sum + err * err, 0) / errors.length)
      };
    }

    // Generate comparison recommendations
    comparison.recommendations = this.generateComparisonRecommendations(comparison);

    return comparison;
  }

  findBestAssignment(experimentalPeak, calculatedStates) {
    let bestMatch = null;
    let minError = Infinity;

    for (const state of calculatedStates) {
      const wavelengthError = Math.abs(state.energy_nm - experimentalPeak.wavelength);
      
      // Weight by intensity agreement
      const intensityFactor = this.compareIntensities(
        state.oscillatorStrength, 
        experimentalPeak.intensity
      );
      
      const totalError = wavelengthError / intensityFactor;
      
      if (totalError < minError && wavelengthError < 50) { // Within 50 nm
        minError = totalError;
        bestMatch = state;
      }
    }

    return {
      experimentalPeak: experimentalPeak,
      calculatedState: bestMatch,
      error_nm: bestMatch ? Math.abs(bestMatch.energy_nm - experimentalPeak.wavelength) : null,
      confidence: this.assessAssignmentConfidence(minError)
    };
  }

  compareIntensities(oscillatorStrength, experimentalIntensity) {
    // Convert oscillator strength to approximate extinction coefficient
    const calculatedExtinction = oscillatorStrength * 100000; // Rough conversion
    
    if (experimentalIntensity > 10000 && calculatedExtinction > 1000) return 2.0;
    if (experimentalIntensity > 1000 && calculatedExtinction > 100) return 1.5;
    if (experimentalIntensity < 100 && calculatedExtinction < 100) return 1.2;
    
    return 1.0; // Neutral factor
  }

  assessAssignmentConfidence(error) {
    if (error < 10) return 'high';
    if (error < 25) return 'medium';
    if (error < 50) return 'low';
    return 'very_low';
  }

  generateComparisonRecommendations(comparison) {
    const recommendations = [];

    if (comparison.statistics) {
      const mae = comparison.statistics.meanAbsoluteError;
      
      if (mae > 30) {
        recommendations.push({
          type: 'method',
          priority: 'high',
          text: `Large average error (${mae.toFixed(1)} nm). Consider different functional or include solvent effects.`
        });
      } else if (mae > 15) {
        recommendations.push({
          type: 'method',
          priority: 'medium',
          text: `Moderate errors (${mae.toFixed(1)} nm). Results are qualitatively correct but could be improved.`
        });
      } else {
        recommendations.push({
          type: 'validation',
          priority: 'low',
          text: `Good agreement with experiment (${mae.toFixed(1)} nm average error).`
        });
      }

      const assignmentRate = comparison.statistics.assignedPeaks / comparison.statistics.totalPeaks;
      if (assignmentRate < 0.5) {
        recommendations.push({
          type: 'calculation',
          priority: 'medium',
          text: 'Many experimental peaks unassigned. Consider calculating more excited states.'
        });
      }
    }

    return recommendations;
  }

  identifyChromophores(moleculeData) {
    // Basic chromophore identification based on structure
    const chromophores = [];
    
    if (!moleculeData || !moleculeData.smiles) {
      return { chromophores: [], analysis: 'No molecular structure provided' };
    }

    const smiles = moleculeData.smiles;
    
    // Simple pattern matching for common chromophores
    const patterns = {
      'benzene': /c1ccccc1/,
      'naphthalene': /c1ccc2ccccc2c1/,
      'anthracene': /c1ccc2cc3ccccc3cc2c1/,
      'carbonyl': /C=O/,
      'alkene': /C=C/,
      'aromatic_amine': /c.*N/,
      'nitro': /N\+.*O-/
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      if (pattern.test(smiles)) {
        const chromophoreData = this.chromophoreLibrary[name];
        if (chromophoreData) {
          chromophores.push({
            name: name,
            ...chromophoreData
          });
        }
      }
    }

    return {
      chromophores: chromophores,
      analysis: chromophores.length > 0 ? 
        `Found ${chromophores.length} known chromophore(s)` : 
        'No known chromophores identified'
    };
  }

  predictEmissionSpectrum(excitationData, options = {}) {
    const {
      temperature = 298.15,
      includePhosphorescence = false,
      stokesShift = 0.3 // eV
    } = options;

    if (!excitationData || !excitationData.excitationEnergies) {
      throw new Error('Excitation data required for emission prediction');
    }

    const emission = {
      fluorescence: null,
      phosphorescence: null,
      analysis: {}
    };

    // Find lowest bright singlet state (S1)
    const brightStates = excitationData.excitationEnergies
      .filter(state => state.oscillatorStrength > 0.001)
      .sort((a, b) => a.energy_eV - b.energy_eV);

    if (brightStates.length > 0) {
      const s1 = brightStates[0];
      emission.fluorescence = {
        excitationState: s1,
        emissionEnergy_eV: s1.energy_eV - stokesShift,
        emissionWavelength_nm: 1240 / (s1.energy_eV - stokesShift),
        estimatedQuantumYield: this.estimateQuantumYield(s1),
        lifetime_ns: this.estimateFluorescenceLifetime(s1)
      };
    }

    // Predict phosphorescence if requested (very approximate)
    if (includePhosphorescence) {
      const lowestState = excitationData.excitationEnergies
        .sort((a, b) => a.energy_eV - b.energy_eV)[0];
      
      if (lowestState) {
        emission.phosphorescence = {
          estimatedT1Energy_eV: lowestState.energy_eV * 0.7, // Rough estimate
          estimatedWavelength_nm: 1240 / (lowestState.energy_eV * 0.7),
          note: 'Very approximate - requires triplet state calculations'
        };
      }
    }

    return emission;
  }

  estimateQuantumYield(state) {
    // Very rough estimate based on oscillator strength and energy
    const f = state.oscillatorStrength;
    const energy_eV = state.energy_eV;
    
    // Higher oscillator strength and appropriate energy gap favor fluorescence
    if (f > 0.1 && energy_eV > 2.0 && energy_eV < 4.0) {
      return 0.5 + Math.min(0.4, f * 2);
    } else if (f > 0.01) {
      return 0.1 + f * 2;
    } else {
      return 0.01;
    }
  }

  estimateFluorescenceLifetime(state) {
    const f = state.oscillatorStrength;
    const nu_cm = state.energy_eV * 8065.5;
    
    // Radiative lifetime in ns
    const tau_rad = 1.499 / (f * nu_cm * nu_cm) * 1e16;
    
    // Assume some non-radiative decay
    const estimatedQY = this.estimateQuantumYield(state);
    return tau_rad * estimatedQY;
  }
}