import chalk from 'chalk';

export class ASCIIArt {
  static getChemCLILogo() {
    return chalk.cyan(`
 ███████  ██   ██ ████████ ███    ███      ████████ ██      ██ 
██       ██   ██ ██       ████  ████      ██       ██      ██ 
██       ███████ ████████ ██ ████ ██ █████ ██       ██      ██ 
██       ██   ██ ██       ██  ██  ██      ██       ██      ██ 
 ███████ ██   ██ ████████ ██      ██      ████████ ████████ ██
`);
  }

  static getChemCLIBigLogo() {
    return chalk.cyan.bold(`
 ██████╗██╗  ██╗███████╗███╗   ███╗     ██████╗██╗     ██╗
██╔════╝██║  ██║██╔════╝████╗ ████║    ██╔════╝██║     ██║
██║     ███████║█████╗  ██╔████╔██║    ██║     ██║     ██║
██║     ██╔══██║██╔══╝  ██║╚██╔╝██║    ██║     ██║     ██║
╚██████╗██║  ██║███████╗██║ ╚═╝ ██║    ╚██████╗███████╗██║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝     ╚═════╝╚══════╝╚═╝
`);
  }

  static getMoleculeArt() {
    return chalk.yellow(`
     ${chalk.red('●')}━━━${chalk.blue('●')}━━━${chalk.green('●')}
    ╱│    │    │╲
   ${chalk.red('●')} │    │    │ ${chalk.green('●')}
    ╲│    │    │╱
     ${chalk.red('●')}━━━${chalk.blue('●')}━━━${chalk.green('●')}
        ${chalk.gray('benzene')}
`);
  }

  static getPeriodicTableSnippet() {
    return `
  ${chalk.red.bold('H')}                                                   ${chalk.yellow.bold('He')}
  ${chalk.green.bold('Li')} ${chalk.blue.bold('Be')}                                   ${chalk.cyan.bold('B')}  ${chalk.magenta.bold('C')}  ${chalk.red.bold('N')}  ${chalk.yellow.bold('O')}  ${chalk.green.bold('F')}  ${chalk.blue.bold('Ne')}
  ${chalk.cyan.bold('Na')} ${chalk.magenta.bold('Mg')}                                   ${chalk.red.bold('Al')} ${chalk.yellow.bold('Si')} ${chalk.green.bold('P')}  ${chalk.blue.bold('S')}  ${chalk.cyan.bold('Cl')} ${chalk.magenta.bold('Ar')}
`;
  }

  static getWelcomeScreen() {
    const logo = this.getChemCLIBigLogo();
    const molecule = this.getMoleculeArt();
    const version = chalk.gray(`v1.0.0 - Natural Language Computational Chemistry`);
    
    return `${logo}
${version}

${molecule}

${chalk.bold('🧪 Welcome to ChemCLI!')}

${chalk.gray('Natural language interface for quantum chemistry calculations')}
${chalk.gray('Powered by AI • Auto-installs software • Professional results')}

${chalk.yellow.bold('Quick Start Examples:')}
${chalk.cyan('• "Calculate the HOMO-LUMO gap of benzene"')}
${chalk.cyan('• "Optimize water geometry with B3LYP"')}
${chalk.cyan('• "What\'s the IR spectrum of acetone?"')}
${chalk.cyan('• "Compare chair vs boat cyclohexane stability"')}

${chalk.yellow.bold('Available Software:')}
${chalk.green('• xTB')} ${chalk.gray('- Fast semi-empirical calculations')}
${chalk.green('• PySCF')} ${chalk.gray('- Accurate DFT calculations')}
${chalk.green('• ORCA')} ${chalk.gray('- Professional quantum chemistry')}

${chalk.yellow.bold('Commands:')}
${chalk.blue('• help')} ${chalk.gray('- Show detailed help')}
${chalk.blue('• clear')} ${chalk.gray('- Clear screen')}
${chalk.blue('• exit')} ${chalk.gray('- Exit ChemCLI')}

${chalk.gray('═'.repeat(70))}
`;
  }

  static getLoadingAnimation() {
    const frames = [
      chalk.cyan('⚛'),
      chalk.yellow('⚛'),
      chalk.green('⚛'),
      chalk.blue('⚛'),
      chalk.magenta('⚛'),
      chalk.red('⚛')
    ];
    return frames;
  }

  static getCalculationBanner(type) {
    const banners = {
      optimization: chalk.blue(`
╭─────────────────────────────────╮
│     🔧 GEOMETRY OPTIMIZATION    │
╰─────────────────────────────────╯`),
      
      frequencies: chalk.green(`
╭─────────────────────────────────╮
│       📊 FREQUENCY ANALYSIS     │
╰─────────────────────────────────╯`),
      
      homo_lumo: chalk.yellow(`
╭─────────────────────────────────╮
│      ⚡ ELECTRONIC STRUCTURE    │
╰─────────────────────────────────╯`),
      
      nmr: chalk.magenta(`
╭─────────────────────────────────╮
│         🧲 NMR PREDICTION       │
╰─────────────────────────────────╯`),
      
      uvvis: chalk.red(`
╭─────────────────────────────────╮
│        🌈 UV-VIS SPECTRUM       │
╰─────────────────────────────────╯`)
    };
    
    return banners[type] || chalk.white(`
╭─────────────────────────────────╮
│        🧪 CALCULATION           │
╰─────────────────────────────────╯`);
  }

  static getSoftwareStatus(software, status) {
    const icons = {
      xtb: '⚡',
      pyscf: '🐍', 
      orca: '🦋'
    };
    
    const icon = icons[software] || '⚙️';
    const statusIcon = status.installed ? '✅' : '❌';
    const version = status.version ? chalk.gray(`v${status.version}`) : '';
    
    return `${statusIcon} ${icon} ${software.toUpperCase()} ${version}`;
  }

  static getResultsTable(title, data) {
    const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length));
    const separator = '─'.repeat(maxKeyLength + 20);
    
    let table = chalk.yellow.bold(`\n┌─${separator}─┐\n`);
    table += chalk.yellow.bold(`│ ${title.padEnd(maxKeyLength + 18)} │\n`);
    table += chalk.yellow.bold(`├─${separator}─┤\n`);
    
    for (const [key, value] of Object.entries(data)) {
      const keyStr = chalk.cyan(key.padEnd(maxKeyLength));
      const valueStr = chalk.white(String(value).padEnd(16));
      table += chalk.yellow.bold(`│ `) + `${keyStr} │ ${valueStr}` + chalk.yellow.bold(` │\n`);
    }
    
    table += chalk.yellow.bold(`└─${separator}─┘\n`);
    return table;
  }

  static getProgressBar(current, total, label = '') {
    const width = 30;
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentage = Math.round((current / total) * 100);
    
    return `${label} [${chalk.cyan(bar)}] ${percentage}%`;
  }

  static getSuccessMessage(message) {
    return `
${chalk.green('✨ Success!')}
${chalk.green('═'.repeat(50))}
${chalk.white(message)}
${chalk.green('═'.repeat(50))}
`;
  }

  static getErrorMessage(error) {
    return `
${chalk.red('❌ Error!')}
${chalk.red('═'.repeat(50))}
${chalk.white(error)}
${chalk.red('═'.repeat(50))}
`;
  }

  static getSpectrum(frequencies, intensities) {
    const width = 60;
    const height = 8;
    let spectrum = '\n';
    
    // Normalize intensities
    const maxIntensity = Math.max(...intensities);
    const normalized = intensities.map(i => Math.round((i / maxIntensity) * height));
    
    // Create spectrum display
    for (let h = height; h >= 0; h--) {
      let line = '';
      for (let i = 0; i < Math.min(frequencies.length, width); i++) {
        if (normalized[i] >= h) {
          line += chalk.cyan('█');
        } else {
          line += ' ';
        }
      }
      spectrum += `${h.toString().padStart(2)} │${line}\n`;
    }
    
    spectrum += '   └' + '─'.repeat(width) + '\n';
    spectrum += '    ' + chalk.gray('Frequency (cm⁻¹)') + '\n';
    
    return spectrum;
  }
}