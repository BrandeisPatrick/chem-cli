import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

export class MoleculeHandler {
  constructor() {
    this.cache = new Map();
    this.commonMolecules = {
      // Small molecules
      'water': 'O',
      'methane': 'C',
      'benzene': 'c1ccccc1',
      'ethanol': 'CCO',
      'acetone': 'CC(=O)C',
      'caffeine': 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      'glucose': 'C([C@@H]1[C@H]([C@@H]([C@H]([C@H](O1)O)O)O)O)O',
      
      // Amino acids
      'glycine': 'NCC(=O)O',
      'alanine': 'C[C@@H](C(=O)O)N',
      
      // DNA bases
      'adenine': 'c1nc(c2c(n1)n(cn2)[H])N',
      'guanine': 'c1[nH]c(nc2c1ncn2[H])N',
      'cytosine': 'c1c(nc(n1[H])N)O',
      'thymine': 'Cc1c[nH]c(=O)[nH]c1=O',
      
      // Common solvents
      'dmso': 'CS(=O)C',
      'acetonitrile': 'CC#N',
      'dichloromethane': 'ClCCl',
      'chloroform': 'C(Cl)(Cl)Cl',
      'toluene': 'Cc1ccccc1'
    };
  }

  async identify(input) {
    // Check cache first
    if (this.cache.has(input)) {
      return this.cache.get(input);
    }

    let result;

    // Try different identification methods
    if (this.isSMILES(input)) {
      result = await this.processSMILES(input);
    } else if (this.isInChI(input)) {
      result = await this.processInChI(input);
    } else if (this.commonMolecules[input.toLowerCase()]) {
      result = await this.processSMILES(this.commonMolecules[input.toLowerCase()]);
      result.inputName = input;
    } else {
      // Try to look up by name
      result = await this.lookupByName(input);
    }

    // Cache result
    this.cache.set(input, result);
    return result;
  }

  async prepare(input) {
    const molData = await this.identify(input);
    
    if (!molData.found) {
      throw new Error(`Could not identify molecule: ${input}`);
    }

    // Generate 3D structure
    const structure3D = await this.generate3D(molData.smiles);
    
    return {
      ...molData,
      ...structure3D
    };
  }

  async generate3D(smiles) {
    // Try different methods for 3D generation
    try {
      // Method 1: Use RDKit via Python if available
      return await this.generate3DRDKit(smiles);
    } catch (error) {
      try {
        // Method 2: Use Open Babel if available
        return await this.generate3DOpenBabel(smiles);
      } catch (error2) {
        // Method 3: Simple molecular builder fallback
        return await this.generate3DSimple(smiles);
      }
    }
  }

  async generate3DRDKit(smiles) {
    const script = `
import sys
from rdkit import Chem
from rdkit.Chem import AllChem
import json

smiles = "${smiles}"
mol = Chem.MolFromSmiles(smiles)

if mol is None:
    print(json.dumps({"error": "Invalid SMILES"}))
    sys.exit(1)

# Add hydrogens
mol = Chem.AddHs(mol)

# Generate 3D coordinates
try:
    AllChem.EmbedMolecule(mol, randomSeed=42)
    AllChem.UFFOptimizeMolecule(mol)
    
    # Get coordinates
    conf = mol.GetConformer()
    atoms = []
    for i, atom in enumerate(mol.GetAtoms()):
        pos = conf.GetAtomPosition(i)
        atoms.append({
            'symbol': atom.GetSymbol(),
            'x': pos.x,
            'y': pos.y, 
            'z': pos.z
        })
    
    # Create XYZ string
    natoms = len(atoms)
    xyz_lines = [str(natoms), f"Generated from SMILES: {smiles}"]
    for atom in atoms:
        xyz_lines.append(f"{atom['symbol']:2s} {atom['x']:12.6f} {atom['y']:12.6f} {atom['z']:12.6f}")
    
    result = {
        "atoms": atoms,
        "xyz": "\\n".join(xyz_lines),
        "atomsString": "\\n".join([f"{atom['symbol']:2s} {atom['x']:12.6f} {atom['y']:12.6f} {atom['z']:12.6f}" for atom in atoms])
    }
    
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const scriptFile = path.join('scratch', 'rdkit_gen.py');
    await fs.mkdir('scratch', { recursive: true });
    await fs.writeFile(scriptFile, script);

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`python ${scriptFile}`, { timeout: 30000 });
      const result = JSON.parse(stdout);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      throw new Error(`RDKit 3D generation failed: ${error.message}`);
    }
  }

  async generate3DSimple(smiles) {
    // Very basic 3D structure generation for simple molecules
    // This is a fallback when RDKit/OpenBabel are not available
    
    const simpleStructures = {
      'O': {  // Water
        atoms: [
          { symbol: 'O', x: 0.000000, y: 0.000000, z: 0.000000 },
          { symbol: 'H', x: 0.757000, y: 0.586000, z: 0.000000 },
          { symbol: 'H', x: -0.757000, y: 0.586000, z: 0.000000 }
        ]
      },
      'C': {  // Methane
        atoms: [
          { symbol: 'C', x: 0.000000, y: 0.000000, z: 0.000000 },
          { symbol: 'H', x: 1.089000, y: 0.000000, z: 0.000000 },
          { symbol: 'H', x: -0.363000, y: 1.026000, z: 0.000000 },
          { symbol: 'H', x: -0.363000, y: -0.513000, z: -0.889000 },
          { symbol: 'H', x: -0.363000, y: -0.513000, z: 0.889000 }
        ]
      },
      'c1ccccc1': {  // Benzene
        atoms: [
          { symbol: 'C', x: 1.400000, y: 0.000000, z: 0.000000 },
          { symbol: 'C', x: 0.700000, y: 1.212000, z: 0.000000 },
          { symbol: 'C', x: -0.700000, y: 1.212000, z: 0.000000 },
          { symbol: 'C', x: -1.400000, y: 0.000000, z: 0.000000 },
          { symbol: 'C', x: -0.700000, y: -1.212000, z: 0.000000 },
          { symbol: 'C', x: 0.700000, y: -1.212000, z: 0.000000 },
          { symbol: 'H', x: 2.490000, y: 0.000000, z: 0.000000 },
          { symbol: 'H', x: 1.245000, y: 2.156000, z: 0.000000 },
          { symbol: 'H', x: -1.245000, y: 2.156000, z: 0.000000 },
          { symbol: 'H', x: -2.490000, y: 0.000000, z: 0.000000 },
          { symbol: 'H', x: -1.245000, y: -2.156000, z: 0.000000 },
          { symbol: 'H', x: 1.245000, y: -2.156000, z: 0.000000 }
        ]
      }
    };

    if (simpleStructures[smiles]) {
      const atoms = simpleStructures[smiles].atoms;
      const natoms = atoms.length;
      
      const xyz_lines = [
        natoms.toString(),
        `Generated simple structure for: ${smiles}`
      ];
      
      for (const atom of atoms) {
        xyz_lines.push(`${atom.symbol.padEnd(2)} ${atom.x.toFixed(6).padStart(12)} ${atom.y.toFixed(6).padStart(12)} ${atom.z.toFixed(6).padStart(12)}`);
      }
      
      return {
        atoms,
        xyz: xyz_lines.join('\n'),
        atomsString: atoms.map(atom => 
          `${atom.symbol.padEnd(2)} ${atom.x.toFixed(6).padStart(12)} ${atom.y.toFixed(6).padStart(12)} ${atom.z.toFixed(6).padStart(12)}`
        ).join('\n')
      };
    }
    
    throw new Error(`No 3D structure available for: ${smiles}`);
  }

  async lookupByName(name) {
    try {
      // Try PubChem first
      const pubchemResult = await this.lookupPubChem(name);
      if (pubchemResult.found) {
        return pubchemResult;
      }
    } catch (error) {
      // PubChem failed, continue
    }

    return {
      found: false,
      name: name,
      error: `Could not find molecule: ${name}. Try providing a SMILES string instead.`
    };
  }

  async lookupPubChem(name) {
    try {
      // Search for compound by name
      const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;
      
      const response = await fetch(searchUrl, { timeout: 10000 });
      
      if (!response.ok) {
        throw new Error(`PubChem search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.PropertyTable && data.PropertyTable.Properties.length > 0) {
        const props = data.PropertyTable.Properties[0];
        
        return {
          found: true,
          name: name,
          smiles: props.CanonicalSMILES,
          formula: props.MolecularFormula,
          molecularWeight: props.MolecularWeight,
          source: 'PubChem'
        };
      }
      
      throw new Error('No results found');
      
    } catch (error) {
      return {
        found: false,
        error: error.message
      };
    }
  }

  async processSMILES(smiles) {
    return {
      found: true,
      smiles: smiles,
      name: this.getSMILESName(smiles),
      inputType: 'SMILES'
    };
  }

  async processInChI(inchi) {
    // For now, just return basic info
    // Could add InChI to SMILES conversion here
    return {
      found: true,
      inchi: inchi,
      name: 'Unknown (InChI)',
      inputType: 'InChI'
    };
  }

  isSMILES(input) {
    // Basic SMILES validation
    if (typeof input !== 'string') return false;
    
    // Check for common SMILES characters
    const smilesChars = /^[a-zA-Z0-9@+\-\[\]()=#\.\\\/:]+$/;
    return smilesChars.test(input) && input.length > 0;
  }

  isInChI(input) {
    return typeof input === 'string' && input.startsWith('InChI=');
  }

  getSMILESName(smiles) {
    // Reverse lookup for common molecules
    for (const [name, smi] of Object.entries(this.commonMolecules)) {
      if (smi === smiles) {
        return name;
      }
    }
    return smiles === 'caffeine' ? 'Caffeine' : `Molecule (${smiles})`;
  }
}