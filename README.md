# ChemCLI - Natural Language Computational Chemistry

A beautiful conversational CLI agent that lets you perform quantum chemistry calculations using natural language, just like ChatGPT or Claude but for computational chemistry.

```
 ██████╗██╗  ██╗███████╗███╗   ███╗     ██████╗██╗     ██╗
██╔════╝██║  ██║██╔════╝████╗ ████║    ██╔════╝██║     ██║
██║     ███████║█████╗  ██╔████╔██║    ██║     ██║     ██║
██║     ██╔══██║██╔══╝  ██║╚██╔╝██║    ██║     ██║     ██║
╚██████╗██║  ██║███████╗██║ ╚═╝ ██║    ╚██████╗███████╗██║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝     ╚═════╝╚══════╝╚═╝
```

## Features

🗣️ **Natural Language Interface** - "Calculate the HOMO-LUMO gap of benzene using DFT"  
🎨 **Beautiful Terminal UI** - Gorgeous ASCII art, colors, and interactive elements  
🧪 **Auto-Install Chemistry Software** - Automatically downloads and installs xTB, PySCF, ORCA  
⚡ **Multiple Theory Levels** - From fast semi-empirical (xTB) to accurate DFT (PySCF/ORCA)  
📊 **Rich Results Display** - Tables, spectra, and molecular properties in your terminal  
💾 **Results Management** - Automatic saving and organization of calculation results  
🤖 **Multi-LLM Support** - Works with OpenAI, Anthropic, or local Ollama models  

## Quick Start

```bash
# Install ChemCLI
npm install -g chem-cli

# Set up your LLM (choose one)
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
# or install Ollama for local models

# Start chatting with chemistry
chem-cli
```

```
You: Calculate the HOMO-LUMO gap of caffeine using B3LYP

🤖 I'll calculate the HOMO-LUMO gap of caffeine using B3LYP/def2-SVP in PySCF. First let me install PySCF if needed...

[Installing PySCF via pip...]
[Generating 3D structure for caffeine...]
[Running B3LYP/def2-SVP calculation...]

Results:
┌─────────────┬─────────────┐
│ Property    │ Value       │
├─────────────┼─────────────┤
│ HOMO        │ -6.42 eV    │
│ LUMO        │ -0.89 eV    │
│ Gap         │ 5.53 eV     │
│ Method      │ B3LYP       │
│ Basis       │ def2-SVP    │
└─────────────┴─────────────┘

Results saved to: ./results/caffeine_b3lyp_2024-01-15.json
```

## Beautiful Terminal UI

ChemCLI features a gorgeous, professional interface designed for the modern terminal:

### 🎨 Visual Elements
- **Stunning ASCII Art** - Beautiful logos and molecular structures
- **Color-Coded Results** - Energy values, frequencies, and properties with intuitive colors  
- **Professional Tables** - Clean, formatted data presentation with borders
- **Interactive Progress** - Real-time spinners and progress bars
- **Smart Auto-completion** - Tab completion for molecules, methods, and commands

### 🔥 Enhanced Experience  
```
╭──────────────────────────────────────────────────╮
│               🧪 CALCULATION RESULTS              │
├──────────────────────────────────────────────────┤
│ HOMO Energy    │ -6.42 eV     │ Frontier orbital │
│ LUMO Energy    │ -0.89 eV     │ Frontier orbital │
│ HOMO-LUMO Gap  │  5.53 eV     │ Electronic gap   │
│ Dipole Moment  │  0.00 D      │ Molecular moment │
╰──────────────────────────────────────────────────╯
```

### 🚀 Status Indicators
```
⚙️ Chemistry Software Status:
  ✅ ⚡ XTB v6.6.1       - Fast semi-empirical
  ✅ 🐍 PYSCF v2.3.0     - Accurate DFT  
  ❌ 🦋 ORCA             - Professional QC
```

## What You Can Ask

### Geometry & Properties
- "Optimize the geometry of water using xTB"
- "What's the dipole moment of acetone?"
- "Calculate molecular orbitals for benzene"

### Spectroscopy
- "Show me the IR spectrum of methanol"
- "Calculate UV-Vis absorption of rhodamine B"
- "Predict 1H NMR chemical shifts for glucose"

### Thermochemistry
- "What's the binding energy of water dimer?"
- "Calculate reaction energy for methane combustion"
- "Compare stability of chair vs boat cyclohexane"

### Method Comparison
- "Run both xTB and B3LYP on ethanol and compare"
- "Which is more accurate for organic molecules: M06-2X or B3LYP?"

## Supported Software

| Software | Methods | Speed | Accuracy | Auto-Install |
|----------|---------|-------|----------|--------------|
| **xTB** | GFN1/GFN2-xTB | ⚡⚡⚡ | ⭐⭐ | ✅ Windows/Mac/Linux |
| **PySCF** | HF, DFT, TDDFT, MP2 | ⚡⚡ | ⭐⭐⭐⭐ | ✅ via pip |
| **ORCA** | All methods | ⚡ | ⭐⭐⭐⭐⭐ | ⚠️ Manual install |

## Installation

### Prerequisites
- **Node.js 18+**
- **Python 3.8+** (for PySCF)
- **LLM Access**: OpenAI API, Anthropic API, or local Ollama

### Install ChemCLI

```bash
# Global installation
npm install -g chem-cli

# Or clone and build
git clone https://github.com/your-username/chem-cli
cd chem-cli
npm install
npm run install-global
```

### Set Up LLM Backend

Choose one option:

**Option 1: OpenAI (Recommended)**
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

**Option 2: Anthropic Claude**
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Option 3: Local Models (Free)**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2  # or llama3.1
```

### Chemistry Software Setup

ChemCLI will automatically install chemistry software as needed, but you can pre-install:

```bash
# xTB (automatic on first use)
# PySCF (automatic on first use)

# ORCA (manual)
# 1. Register at https://orcaforum.kofo.mpg.de/
# 2. Download and extract ORCA
# 3. Add to PATH
```

## Usage Examples

### Basic Calculations

```bash
chem-cli
> Calculate the energy of water

> Optimize benzene geometry with B3LYP

> What's the HOMO-LUMO gap of caffeine?
```

### Advanced Workflows

```bash
> First optimize water with xTB, then run single point B3LYP/def2-TZVP

> Calculate IR spectrum of acetone at B3LYP level with SMD water solvation

> Compare the UV-Vis spectra of anthracene and tetracene using TDDFT
```

### Batch Processing

```bash
> Calculate HOMO-LUMO gaps for all molecules in this list: benzene, toluene, xylene

> Optimize geometries of glucose conformers and compare energies
```

## Configuration

Create `~/.chemcli/config.json`:

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4"
  },
  "chemistry": {
    "default_software": "xtb",
    "default_method": "gfn2-xtb",
    "default_basis": "def2-svp"
  },
  "output": {
    "save_results": true,
    "results_dir": "./results",
    "format": ["json", "xyz"]
  }
}
```

## File Structure

```
chem-cli/
├── results/           # Calculation results
├── scratch/           # Temporary files
├── env/              # Auto-installed software
└── config/           # Configuration files
```

## Development

```bash
git clone https://github.com/your-username/chem-cli
cd chem-cli
npm install

# Development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Roadmap

- [ ] **Paper Reproduction** - "Recalculate Table 2 from DOI:10.1021/..."
- [ ] **Reaction Networks** - Multi-step reaction calculations
- [ ] **Machine Learning** - Integration with ML potentials
- [ ] **Cloud Computing** - Integration with HPC/cloud resources
- [ ] **Jupyter Integration** - Export to Jupyter notebooks
- [ ] **3D Visualization** - Molecular structure visualization

## Acknowledgments

- [xTB](https://github.com/grimme-lab/xtb) - Fast semi-empirical calculations
- [PySCF](https://github.com/pyscf/pyscf) - Python quantum chemistry
- [ORCA](https://orcaforum.kofo.mpg.de/) - Professional quantum chemistry
- [RDKit](https://github.com/rdkit/rdkit) - Molecular structure generation

---

**ChemCLI** - Making computational chemistry accessible through natural language 🧪✨