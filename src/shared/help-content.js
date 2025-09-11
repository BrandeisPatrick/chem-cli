// Shared help content for ChemCLI

export const HELP_CONTENT = `💡 ChemCLI Commands:
  • Type chemistry questions naturally
  • "help" - Show detailed help
  • "exit" - Quit ChemCLI
  • "status" - Show system status
  • "clear" - Clear conversation history
  • Ctrl+C - Show this help`;

export const DETAILED_HELP_CONTENT = `🧪 ChemCLI - Natural Language Chemistry Interface

BASIC COMMANDS:
  help          Show this help message
  status        Show system and software status
  clear         Clear conversation history
  exit          Quit ChemCLI

CHEMISTRY EXAMPLES:
  • "Calculate the HOMO-LUMO gap of benzene using B3LYP/def2-TZVP"
  • "Optimize water molecule with xTB"
  • "Predict UV-Vis spectrum of anthracene with TDDFT"
  • "Compare B3LYP vs M06-2X for caffeine optimization"
  • "Calculate NMR shifts for glucose in water"

SUPPORTED SOFTWARE:
  • xTB - Semi-empirical quantum chemistry
  • PySCF - Python-based quantum chemistry
  • ORCA - Ab initio quantum chemistry (when available)

TIPS:
  • Use Tab for auto-completion
  • Use arrow keys to navigate command history
  • Running in a project-specific directory is recommended
  • Use natural language - ChemCLI understands chemistry context`;

export const STARTUP_TIPS = [
  'Try: "Calculate the HOMO-LUMO gap of benzene using B3LYP/def2-TZVP"',
  'Optimize geometries with: "Optimize water molecule with xTB"',
  'For spectroscopy: "Predict UV-Vis spectrum of anthracene with TDDFT"',
  'Compare methods: "Compare B3LYP vs M06-2X for caffeine optimization"',
  'Include solvation: "Calculate NMR shifts for glucose in water"',
  'Tip: Use "help" for more commands and examples',
  'Tip: Running in a project-specific directory is recommended'
];

/**
 * Get a random startup tip
 * @returns {string} A random tip from the startup tips
 */
export function getRandomTip() {
  return STARTUP_TIPS[Math.floor(Math.random() * STARTUP_TIPS.length)];
}