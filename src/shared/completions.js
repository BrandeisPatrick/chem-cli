// Shared chemistry auto-completion terms
export const CHEMISTRY_COMPLETIONS = [
  // Common molecules
  'benzene', 'water', 'methane', 'ethanol', 'acetone', 'caffeine', 'glucose', 'toluene', 'phenol',
  
  // Methods and theories
  'B3LYP', 'M06-2X', 'PBE0', 'wB97XD', 'MP2', 'CCSD', 'CCSD(T)', 'xTB', 'GFN2-xTB', 'DFT',
  
  // Basis sets
  'def2-SVP', 'def2-TZVP', 'def2-QZVP', '6-31G*', '6-311++G**', 'cc-pVDZ', 'cc-pVTZ', 'cc-pVQZ',
  
  // Calculation types
  'optimize', 'frequency', 'HOMO-LUMO', 'NMR', 'UV-Vis', 'TDDFT', 'thermochemistry', 'geometry optimization',
  
  // Commands
  'help', 'clear', 'status', 'exit',
  
  // Common phrases
  'Calculate the', 'Optimize the geometry of', 'What is the', 'Compare', 'Using B3LYP', 'with xTB', 'in water', 'SMD solvation'
];

/**
 * Get completions that match a given input string
 * @param {string} input - The input to match against
 * @param {number} maxResults - Maximum number of results to return
 * @returns {string[]} Array of matching completions
 */
export function getCompletions(input, maxResults = 5) {
  if (!input || input.length < 2) {
    return [];
  }
  
  const lowercaseInput = input.toLowerCase();
  
  return CHEMISTRY_COMPLETIONS
    .filter(completion => completion.toLowerCase().includes(lowercaseInput))
    .slice(0, maxResults);
}