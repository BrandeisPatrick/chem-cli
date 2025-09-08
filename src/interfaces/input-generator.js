import { Psi4Interface } from './psi4-interface.js';
import { ORCAInterface } from './orca-interface.js';

export class InputGenerator {
  constructor() {
    this.interfaces = {
      'psi4': new Psi4Interface(),
      'orca': new ORCAInterface()
    };
  }

  async generateInput(software, calculationType, inputData, precisionLevel = 'half') {
    const interface_ = this.interfaces[software.toLowerCase()];
    if (!interface_) {
      throw new Error(`Unsupported software: ${software}`);
    }

    // Adjust input parameters based on precision level
    const adjustedInputData = this.adjustForPrecision(inputData, precisionLevel, calculationType);

    // Validate input
    const validation = await interface_.validateInput(calculationType, adjustedInputData);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate input file
    const options = this.getPrecisionOptions(precisionLevel, calculationType);
    const inputFile = await interface_.generateInputFile(calculationType, adjustedInputData, options);

    return {
      software: software,
      calculationType: calculationType,
      precisionLevel: precisionLevel,
      inputFile: inputFile,
      estimatedResources: this.getResourceEstimates(software, calculationType, inputData, precisionLevel),
      runInstructions: this.getRunInstructions(software, inputFile)
    };
  }

  adjustForPrecision(inputData, precisionLevel, calculationType) {
    const adjusted = { ...inputData };

    // Basis set adjustments
    const basisSetMap = {
      'full': {
        'def2-SVP': 'def2-QZVP',
        'def2-TZVP': 'def2-QZVP',
        'cc-pVDZ': 'cc-pVTZ'
      },
      'half': {
        'def2-QZVP': 'def2-TZVP',
        'cc-pVTZ': 'cc-pVDZ'
      },
      'low': {
        'def2-QZVP': 'def2-SVP',
        'def2-TZVP': 'def2-SVP',
        'cc-pVTZ': 'cc-pVDZ',
        'cc-pVDZ': 'STO-3G'
      }
    };

    if (basisSetMap[precisionLevel] && basisSetMap[precisionLevel][adjusted.basisSet]) {
      adjusted.basisSet = basisSetMap[precisionLevel][adjusted.basisSet];
    }

    // Memory adjustments
    const memoryMap = {
      'full': { multiplier: 2.0, min: 16 },
      'half': { multiplier: 1.0, min: 8 },
      'low': { multiplier: 0.5, min: 4 }
    };

    const memoryConfig = memoryMap[precisionLevel];
    if (adjusted.memory) {
      const currentMemory = parseInt(adjusted.memory.replace(/[^\d]/g, ''));
      const newMemory = Math.max(memoryConfig.min, currentMemory * memoryConfig.multiplier);
      adjusted.memory = `${newMemory} GB`;
    } else {
      adjusted.memory = `${memoryConfig.min} GB`;
    }

    // Thread adjustments
    const threadMap = {
      'full': 8,
      'half': 4,
      'low': 2
    };

    adjusted.threads = threadMap[precisionLevel];

    return adjusted;
  }

  getPrecisionOptions(precisionLevel, calculationType) {
    const convergenceMap = {
      'full': {
        energy: 1e-8,
        density: 1e-8,
        gradient: 1e-6,
        maxIterations: 200,
        convergence: 'tight'
      },
      'half': {
        energy: 1e-6,
        density: 1e-6,
        gradient: 1e-4,
        maxIterations: 100,
        convergence: 'normal'
      },
      'low': {
        energy: 1e-4,
        density: 1e-4,
        gradient: 1e-3,
        maxIterations: 50,
        convergence: 'loose'
      }
    };

    const options = {
      convergence: convergenceMap[precisionLevel]
    };

    // Calculation-specific options
    if (calculationType === 'absorption_spectrum') {
      const stateMap = {
        'full': { nStates: 15, includeTriplets: true },
        'half': { nStates: 10, includeTriplets: false },
        'low': { nStates: 5, includeTriplets: false }
      };
      Object.assign(options, stateMap[precisionLevel]);
    }

    return options;
  }

  getResourceEstimates(software, calculationType, inputData, precisionLevel) {
    const baseEstimates = {
      'psi4': {
        'geometry_optimization': { time: 30, memory: 4, disk: 1 },
        'absorption_spectrum': { time: 120, memory: 8, disk: 2 },
        'frequency_analysis': { time: 60, memory: 6, disk: 1 }
      },
      'orca': {
        'geometry_optimization': { time: 20, memory: 4, disk: 1 },
        'absorption_spectrum': { time: 90, memory: 8, disk: 2 },
        'frequency_analysis': { time: 45, memory: 6, disk: 1 }
      }
    };

    const base = baseEstimates[software]?.[calculationType] || { time: 60, memory: 4, disk: 1 };

    // Scale by molecule size
    const moleculeSize = inputData.molecule?.estimatedSize || 10;
    const sizeScale = Math.pow(moleculeSize / 10, 2.5);

    // Scale by precision level
    const precisionScale = {
      'full': 3.0,
      'half': 1.0,
      'low': 0.4
    };

    const scale = sizeScale * precisionScale[precisionLevel];

    return {
      estimatedTime: Math.round(base.time * scale),
      estimatedMemory: Math.round(base.memory * Math.sqrt(scale)),
      estimatedDisk: Math.round(base.disk * scale),
      scalingFactors: {
        moleculeSize: sizeScale,
        precision: precisionScale[precisionLevel]
      }
    };
  }

  getRunInstructions(software, inputFile) {
    const instructions = {
      'psi4': {
        command: `psi4 ${inputFile.filename}`,
        environment: [
          'Ensure Psi4 is installed and in PATH',
          'Set PSI_SCRATCH environment variable if needed'
        ],
        monitoring: [
          'Check output file for progress',
          'Monitor memory usage during calculation'
        ]
      },
      'orca': {
        command: `orca ${inputFile.filename}`,
        environment: [
          'Ensure ORCA is installed and ORCA_PATH is set',
          'Check ORCA license file is accessible'
        ],
        monitoring: [
          'Check .out file for progress',
          'Monitor disk space for temporary files'
        ]
      }
    };

    return instructions[software] || {
      command: `${software} ${inputFile.filename}`,
      environment: [`Ensure ${software} is properly installed`],
      monitoring: ['Monitor calculation progress']
    };
  }

  async generateBatchScript(jobs, systemType = 'slurm') {
    let scriptContent = '';

    if (systemType === 'slurm') {
      scriptContent = this.generateSlurmScript(jobs);
    } else if (systemType === 'pbs') {
      scriptContent = this.generatePBSScript(jobs);
    } else {
      scriptContent = this.generateBashScript(jobs);
    }

    return {
      scriptType: systemType,
      filename: `batch_job_${Date.now()}.sh`,
      content: scriptContent,
      instructions: this.getBatchInstructions(systemType)
    };
  }

  generateSlurmScript(jobs) {
    const totalCores = Math.max(...jobs.map(job => job.threads || 4));
    const totalMemory = Math.max(...jobs.map(job => 
      parseInt((job.memory || '8 GB').replace(/[^\d]/g, ''))
    ));
    const totalTime = jobs.reduce((sum, job) => sum + (job.estimatedTime || 60), 0);

    let script = `#!/bin/bash
#SBATCH --job-name=chemcli_batch
#SBATCH --ntasks=${totalCores}
#SBATCH --mem=${totalMemory}GB
#SBATCH --time=${Math.ceil(totalTime / 60)}:00:00
#SBATCH --output=chemcli_%j.out
#SBATCH --error=chemcli_%j.err

# ChemCLI Batch Job Script
echo "Starting ChemCLI batch calculation at: $(date)"
echo "Job ID: $SLURM_JOB_ID"
echo "Running on node: $(hostname)"

# Set environment
export OMP_NUM_THREADS=$SLURM_NTASKS

`;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      script += `
# Job ${i + 1}: ${job.calculationType} with ${job.software}
echo "Starting job ${i + 1}: ${job.calculationType}"
cd ${job.workingDir || '.'}
${job.runCommand}
echo "Completed job ${i + 1} at: $(date)"

`;
    }

    script += `
echo "Batch job completed at: $(date)"
`;

    return script;
  }

  generatePBSScript(jobs) {
    // Similar to SLURM but with PBS directives
    const totalCores = Math.max(...jobs.map(job => job.threads || 4));
    const totalMemory = Math.max(...jobs.map(job => 
      parseInt((job.memory || '8 GB').replace(/[^\d]/g, ''))
    ));

    let script = `#!/bin/bash
#PBS -N chemcli_batch
#PBS -l nodes=1:ppn=${totalCores}
#PBS -l mem=${totalMemory}gb
#PBS -j oe

# ChemCLI Batch Job Script
cd $PBS_O_WORKDIR
echo "Starting ChemCLI batch calculation at: $(date)"

`;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      script += `
# Job ${i + 1}: ${job.calculationType} with ${job.software}
echo "Starting job ${i + 1}: ${job.calculationType}"
cd ${job.workingDir || '.'}
${job.runCommand}
echo "Completed job ${i + 1} at: $(date)"

`;
    }

    return script;
  }

  generateBashScript(jobs) {
    let script = `#!/bin/bash
# ChemCLI Batch Job Script
echo "Starting ChemCLI batch calculation at: $(date)"

`;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      script += `
# Job ${i + 1}: ${job.calculationType} with ${job.software}
echo "Starting job ${i + 1}: ${job.calculationType}"
cd ${job.workingDir || '.'}
${job.runCommand}
if [ $? -ne 0 ]; then
    echo "Job ${i + 1} failed, stopping batch"
    exit 1
fi
echo "Completed job ${i + 1} at: $(date)"

`;
    }

    script += `
echo "Batch job completed successfully at: $(date)"
`;

    return script;
  }

  getBatchInstructions(systemType) {
    const instructions = {
      'slurm': [
        'Submit job with: sbatch script.sh',
        'Check status with: squeue -u $USER',
        'Cancel job with: scancel <job_id>'
      ],
      'pbs': [
        'Submit job with: qsub script.sh',
        'Check status with: qstat -u $USER',
        'Cancel job with: qdel <job_id>'
      ],
      'bash': [
        'Run directly with: bash script.sh',
        'Run in background with: nohup bash script.sh &',
        'Monitor with: tail -f nohup.out'
      ]
    };

    return instructions[systemType] || instructions['bash'];
  }

  async validateAllInputs(inputs) {
    const validationResults = [];

    for (const input of inputs) {
      const interface_ = this.interfaces[input.software.toLowerCase()];
      if (!interface_) {
        validationResults.push({
          input: input,
          valid: false,
          errors: [`Unsupported software: ${input.software}`]
        });
        continue;
      }

      const result = await interface_.validateInput(input.calculationType, input.inputData);
      validationResults.push({
        input: input,
        valid: result.valid,
        errors: result.errors
      });
    }

    return {
      allValid: validationResults.every(r => r.valid),
      results: validationResults,
      summary: {
        total: validationResults.length,
        valid: validationResults.filter(r => r.valid).length,
        invalid: validationResults.filter(r => !r.valid).length
      }
    };
  }
}