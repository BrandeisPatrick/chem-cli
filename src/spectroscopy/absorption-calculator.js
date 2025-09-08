import { ExcitedStateHandler } from './excited-state-handler.js';

export class AbsorptionCalculator {
  constructor() {
    this.excitedStateHandler = new ExcitedStateHandler();
    
    // Common UV-Vis regions and their characteristics
    this.spectralRegions = {
      'far_uv': { range: [100, 200], name: 'Far UV', typical: 'n→σ* transitions' },
      'middle_uv': { range: [200, 280], name: 'Middle UV', typical: 'π→π* aromatic transitions' },
      'near_uv': { range: [280, 315], name: 'Near UV', typical: 'n→π* transitions' },
      'visible': { range: [400, 700], name: 'Visible', typical: 'Extended conjugation, charge transfer' },
      'near_ir': { range: [700, 1000], name: 'Near IR', typical: 'Low-energy charge transfer' }
    };

    // Solvent correction factors for common solvents
    this.solventCorrections = {
      'gas_phase': { polarity: 0, refractive: 1.0, name: 'Gas Phase' },
      'hexane': { polarity: 0.009, refractive: 1.375, name: 'Hexane' },
      'toluene': { polarity: 0.099, refractive: 1.497, name: 'Toluene' },
      'chloroform': { polarity: 0.259, refractive: 1.446, name: 'Chloroform' },
      'acetone': { polarity: 0.355, refractive: 1.359, name: 'Acetone' },
      'ethanol': { polarity: 0.654, refractive: 1.361, name: 'Ethanol' },
      'water': { polarity: 1.000, refractive: 1.333, name: 'Water' }
    };
  }

  async calculateSpectrum(excitationData, options = {}) {
    const {
      solvent = 'gas_phase',
      broadening = 'gaussian',
      fwhm = 0.3, // Full width at half maximum in eV
      spectralRange = [200, 800], // nm
      resolution = 1, // nm
      includeVibronic = false,
      temperature = 298.15 // K
    } = options;

    // Process excitation data
    const transitions = this.processExcitationData(excitationData);
    
    // Apply solvent corrections if needed
    const correctedTransitions = this.applySolventCorrections(transitions, solvent);
    
    // Generate broadened spectrum
    const spectrum = this.generateSpectrum(correctedTransitions, {
      broadening,
      fwhm,
      spectralRange,
      resolution
    });

    // Add vibronic progression if requested
    let vibronicSpectrum = spectrum;
    if (includeVibronic) {
      vibronicSpectrum = this.addVibronicProgression(spectrum, options);
    }

    // Analyze spectrum characteristics
    const analysis = this.analyzeSpectrum(vibronicSpectrum, correctedTransitions);

    return {
      transitions: correctedTransitions,
      spectrum: vibronicSpectrum,
      analysis: analysis,
      metadata: {
        solvent: this.solventCorrections[solvent]?.name || solvent,
        broadening: broadening,
        fwhm: fwhm,
        temperature: temperature,
        spectralRange: spectralRange,
        resolution: resolution
      }
    };
  }

  processExcitationData(excitationData) {
    if (!excitationData || !excitationData.excitationEnergies) {
      throw new Error('Invalid excitation data provided');
    }

    const transitions = [];

    for (const excitation of excitationData.excitationEnergies) {
      const transition = {
        state: excitation.state,
        energy_eV: excitation.energy_eV,
        energy_nm: excitation.energy_nm || (1240 / excitation.energy_eV),
        energy_cm: excitation.energy_cm || (excitation.energy_eV * 8065.5),
        oscillatorStrength: excitation.oscillatorStrength || 0,
        intensity: this.calculateIntensity(excitation.oscillatorStrength || 0),
        symmetry: excitation.symmetry || 'unknown',
        character: this.assignTransitionCharacter(excitation)
      };

      // Only include transitions with non-zero oscillator strength
      if (transition.oscillatorStrength > 1e-6) {
        transitions.push(transition);
      }
    }

    return transitions.sort((a, b) => a.energy_eV - b.energy_eV);
  }

  assignTransitionCharacter(excitation) {
    // Basic assignment based on energy and intensity
    const energy_eV = excitation.energy_eV;
    const f = excitation.oscillatorStrength || 0;

    if (energy_eV > 8.0) {
      return 'n→σ* or Rydberg';
    } else if (energy_eV > 5.0 && f > 0.1) {
      return 'π→π* (allowed)';
    } else if (energy_eV > 3.0 && f < 0.01) {
      return 'n→π* (forbidden)';
    } else if (energy_eV > 1.8 && f > 0.01) {
      return 'π→π* (charge transfer)';
    } else {
      return 'Low energy transition';
    }
  }

  calculateIntensity(oscillatorStrength) {
    // Convert oscillator strength to molar extinction coefficient (rough approximation)
    // ε ≈ 4.32 × 10^9 × f / Δν̃_1/2
    // Assuming Δν̃_1/2 ≈ 3000 cm⁻¹ for a typical band
    return oscillatorStrength * 4.32e9 / 3000;
  }

  applySolventCorrections(transitions, solvent) {
    const solventData = this.solventCorrections[solvent];
    if (!solventData || solvent === 'gas_phase') {
      return transitions;
    }

    return transitions.map(transition => {
      // Apply simple solvatochromic shift
      // More sophisticated models would require state dipole moments
      const polarityShift = this.estimatePolarityShift(transition, solventData.polarity);
      const refractiveShift = this.estimateRefractiveShift(transition, solventData.refractive);
      
      const totalShift_eV = polarityShift + refractiveShift;
      const newEnergy_eV = transition.energy_eV + totalShift_eV;
      
      return {
        ...transition,
        energy_eV: newEnergy_eV,
        energy_nm: 1240 / newEnergy_eV,
        energy_cm: newEnergy_eV * 8065.5,
        solventShift_eV: totalShift_eV,
        originalEnergy_eV: transition.energy_eV
      };
    });
  }

  estimatePolarityShift(transition, polarity) {
    // Simplified model: charge transfer states shift more in polar solvents
    const baseShift = -0.1 * polarity; // Red shift in polar solvents
    
    if (transition.character.includes('charge transfer')) {
      return baseShift * 3; // Larger shift for CT states
    } else if (transition.character.includes('π→π*')) {
      return baseShift * 1.5;
    } else if (transition.character.includes('n→π*')) {
      return -baseShift; // Blue shift for n→π*
    }
    
    return baseShift;
  }

  estimateRefractiveShift(transition, refractiveIndex) {
    // Refractive index effects are generally smaller
    const factor = (refractiveIndex - 1) / (refractiveIndex + 2);
    return -0.05 * factor; // Small red shift
  }

  generateSpectrum(transitions, options) {
    const { broadening, fwhm, spectralRange, resolution } = options;
    
    const wavelengths = [];
    const intensities = [];
    
    // Generate wavelength array
    for (let wl = spectralRange[0]; wl <= spectralRange[1]; wl += resolution) {
      wavelengths.push(wl);
    }

    // Calculate intensity at each wavelength
    for (const wavelength of wavelengths) {
      let totalIntensity = 0;
      
      for (const transition of transitions) {
        const intensity = this.calculateBroadenedIntensity(
          wavelength, 
          transition.energy_nm, 
          transition.intensity,
          fwhm,
          broadening
        );
        totalIntensity += intensity;
      }
      
      intensities.push(totalIntensity);
    }

    return {
      wavelengths: wavelengths,
      intensities: intensities,
      units: { wavelength: 'nm', intensity: 'L mol⁻¹ cm⁻¹' }
    };
  }

  calculateBroadenedIntensity(wavelength, transitionWavelength, peakIntensity, fwhm, broadening) {
    const sigma = fwhm / (2 * Math.sqrt(2 * Math.log(2))); // Convert FWHM to σ for Gaussian
    const deltaWl = wavelength - transitionWavelength;
    
    if (broadening === 'gaussian') {
      return peakIntensity * Math.exp(-0.5 * Math.pow(deltaWl / sigma, 2));
    } else if (broadening === 'lorentzian') {
      const gamma = fwhm / 2;
      return peakIntensity * (gamma / Math.PI) / (deltaWl * deltaWl + gamma * gamma);
    } else if (broadening === 'voigt') {
      // Simplified Voigt profile (pseudo-Voigt approximation)
      const gaussian = Math.exp(-0.5 * Math.pow(deltaWl / sigma, 2));
      const gamma = fwhm / 2;
      const lorentzian = (gamma / Math.PI) / (deltaWl * deltaWl + gamma * gamma);
      return peakIntensity * (0.7 * gaussian + 0.3 * lorentzian);
    }
    
    return 0;
  }

  addVibronicProgression(spectrum, options) {
    const {
      vibrationFrequency = 1500, // cm⁻¹, typical C=C stretch
      vibrationIntensity = 0.3,  // Relative to 0-0 band
      maxQuanta = 3
    } = options;

    const vibronicSpectrum = {
      wavelengths: [...spectrum.wavelengths],
      intensities: [...spectrum.intensities],
      units: spectrum.units
    };

    // Add vibronic progression (simplified model)
    for (let i = 0; i < spectrum.wavelengths.length; i++) {
      const baseWavelength = spectrum.wavelengths[i];
      const baseIntensity = spectrum.intensities[i];
      
      if (baseIntensity > 0.01 * Math.max(...spectrum.intensities)) {
        // Add vibronic satellites
        for (let v = 1; v <= maxQuanta; v++) {
          const vibEnergy_eV = (vibrationFrequency * v) / 8065.5; // Convert cm⁻¹ to eV
          const vibWavelength = 1240 / (1240 / baseWavelength + vibEnergy_eV);
          const vibIntensity = baseIntensity * Math.pow(vibrationIntensity, v) / factorial(v);
          
          // Find closest wavelength point and add intensity
          const closestIndex = this.findClosestWavelengthIndex(vibronicSpectrum.wavelengths, vibWavelength);
          if (closestIndex >= 0) {
            vibronicSpectrum.intensities[closestIndex] += vibIntensity;
          }
        }
      }
    }

    return vibronicSpectrum;
  }

  findClosestWavelengthIndex(wavelengths, targetWavelength) {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < wavelengths.length; i++) {
      const distance = Math.abs(wavelengths[i] - targetWavelength);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  }

  analyzeSpectrum(spectrum, transitions) {
    const analysis = {
      peakCount: 0,
      lambdaMax: null,
      extinctionMax: null,
      onsetWavelength: null,
      spectralRegions: [],
      dominantTransitions: [],
      recommendations: []
    };

    // Find peaks and lambda max
    const peaks = this.findPeaks(spectrum.intensities, spectrum.wavelengths);
    analysis.peakCount = peaks.length;
    
    if (peaks.length > 0) {
      const maxPeak = peaks.reduce((max, peak) => peak.intensity > max.intensity ? peak : max);
      analysis.lambdaMax = Math.round(maxPeak.wavelength);
      analysis.extinctionMax = Math.round(maxPeak.intensity);
    }

    // Find absorption onset
    analysis.onsetWavelength = this.findAbsorptionOnset(spectrum);

    // Classify spectral regions
    analysis.spectralRegions = this.classifySpectralRegions(peaks);

    // Identify dominant transitions
    analysis.dominantTransitions = transitions
      .filter(t => t.oscillatorStrength > 0.01)
      .sort((a, b) => b.oscillatorStrength - a.oscillatorStrength)
      .slice(0, 3);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis, transitions);

    return analysis;
  }

  findPeaks(intensities, wavelengths, minHeight = 0.05) {
    const peaks = [];
    const maxIntensity = Math.max(...intensities);
    const threshold = maxIntensity * minHeight;
    
    for (let i = 1; i < intensities.length - 1; i++) {
      if (intensities[i] > threshold &&
          intensities[i] > intensities[i - 1] &&
          intensities[i] > intensities[i + 1]) {
        peaks.push({
          wavelength: wavelengths[i],
          intensity: intensities[i],
          index: i
        });
      }
    }
    
    return peaks;
  }

  findAbsorptionOnset(spectrum) {
    const maxIntensity = Math.max(...spectrum.intensities);
    const threshold = maxIntensity * 0.01; // 1% of maximum
    
    // Find first wavelength from long wavelength side with significant absorption
    for (let i = spectrum.wavelengths.length - 1; i >= 0; i--) {
      if (spectrum.intensities[i] > threshold) {
        return Math.round(spectrum.wavelengths[i]);
      }
    }
    
    return null;
  }

  classifySpectralRegions(peaks) {
    const regions = [];
    
    for (const peak of peaks) {
      for (const [regionKey, regionData] of Object.entries(this.spectralRegions)) {
        if (peak.wavelength >= regionData.range[0] && peak.wavelength <= regionData.range[1]) {
          regions.push({
            region: regionData.name,
            wavelength: peak.wavelength,
            intensity: peak.intensity,
            typical: regionData.typical
          });
          break;
        }
      }
    }
    
    return regions;
  }

  generateRecommendations(analysis, transitions) {
    const recommendations = [];
    
    // Experimental comparison recommendations
    if (analysis.lambdaMax) {
      recommendations.push({
        type: 'experimental',
        text: `Compare with experimental λmax around ${analysis.lambdaMax} nm`
      });
    }
    
    // Method recommendations
    const hasChargeTransfer = transitions.some(t => t.character.includes('charge transfer'));
    if (hasChargeTransfer) {
      recommendations.push({
        type: 'method',
        text: 'Consider CAM-B3LYP or ωB97X-D for better charge-transfer description'
      });
    }
    
    // Solvent effect recommendations
    const hasLowEnergyTransitions = transitions.some(t => t.energy_eV < 3.0);
    if (hasLowEnergyTransitions) {
      recommendations.push({
        type: 'solvent',
        text: 'Low-energy transitions may show significant solvatochromic shifts'
      });
    }
    
    // Basis set recommendations
    if (transitions.length > 5) {
      recommendations.push({
        type: 'basis',
        text: 'Consider diffuse functions for high-energy excitations'
      });
    }
    
    return recommendations;
  }

  exportSpectrum(spectrum, format = 'csv') {
    if (format === 'csv') {
      let csv = 'Wavelength (nm),Intensity (L mol⁻¹ cm⁻¹)\n';
      for (let i = 0; i < spectrum.wavelengths.length; i++) {
        csv += `${spectrum.wavelengths[i]},${spectrum.intensities[i]}\n`;
      }
      return csv;
    } else if (format === 'json') {
      return JSON.stringify(spectrum, null, 2);
    } else if (format === 'xy') {
      let xy = '';
      for (let i = 0; i < spectrum.wavelengths.length; i++) {
        xy += `${spectrum.wavelengths[i]}\t${spectrum.intensities[i]}\n`;
      }
      return xy;
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  generatePlotlyData(spectrum, transitions = null) {
    const plotData = [{
      x: spectrum.wavelengths,
      y: spectrum.intensities,
      type: 'scatter',
      mode: 'lines',
      name: 'Absorption Spectrum',
      line: { color: 'blue', width: 2 }
    }];

    // Add stick spectrum if transitions provided
    if (transitions) {
      const stickX = transitions.map(t => t.energy_nm);
      const stickY = transitions.map(t => t.intensity);
      
      plotData.push({
        x: stickX,
        y: stickY,
        type: 'scatter',
        mode: 'markers',
        marker: {
          size: 8,
          color: 'red',
          symbol: 'line-ns',
          line: { width: 2 }
        },
        name: 'Calculated Transitions'
      });
    }

    return {
      data: plotData,
      layout: {
        title: 'UV-Vis Absorption Spectrum',
        xaxis: { title: 'Wavelength (nm)' },
        yaxis: { title: 'Molar Extinction Coefficient (L mol⁻¹ cm⁻¹)' },
        showlegend: true
      }
    };
  }
}

// Helper function for factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}