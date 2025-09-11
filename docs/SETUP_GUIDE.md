# ChemCLI Setup Guide

## 🚀 Quick Start

### First Time Setup
```bash
# Start ChemCLI (will show setup wizard automatically)
npm start
# or
node src/index.js
```

The setup wizard will appear like Claude CLI and guide you through configuration.

## ⚙️ Setup Options

### Option 1: OpenAI (Recommended)
- **Performance:** Excellent for chemistry
- **Cost:** Pay per use (~$0.01-0.10 per conversation)
- **Setup:** Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Option 2: Anthropic (Claude)
- **Performance:** Great for scientific tasks  
- **Cost:** Pay per use (~$0.01-0.15 per conversation)
- **Setup:** Get API key from [Anthropic Console](https://console.anthropic.com/)

### Option 3: Ollama (Free Local)
- **Performance:** Good, runs on your machine
- **Cost:** Free (uses your computer's resources)
- **Setup:** Install from [ollama.ai](https://ollama.ai), then run `ollama pull llama2`

### Option 4: Demo Mode (No Setup Required)
- **Performance:** Demonstrates full workflow
- **Cost:** Free
- **Limitations:** No real calculations, simulated responses only

## 🔧 Manual Setup

### Re-run Setup Wizard
```bash
node src/index.js --setup
```

### Environment Variables (Alternative)
Create a `.env` file:
```bash
# Copy the example
cp .env.example .env

# Edit with your API key
OPENAI_API_KEY=sk-your-key-here
```

## 💬 Testing the Chat Interface

Once setup is complete, you'll see:
```
🧪 ChemCLI Ready to Go! 🧪

Try asking me something like:
  • "Calculate the absorption spectrum of benzene"
  • "Optimize the geometry of water" 
  • "What's the HOMO-LUMO gap of anthracene?"

Type "help" for more examples or "exit" to quit.
```

**🎨 Chat Bar Interface**: ChemCLI now features a fixed bottom chat bar (like Claude Code) with:
- Real-time typing with cursor navigation
- Command history (↑↓ arrows)
- Auto-completion and line wrapping
- Keyboard shortcuts (Ctrl+D to exit, Ctrl+C for help)

## 🎭 Demo Mode Features

Even without an API key, you can:
- ✅ See the complete precision selection workflow
- ✅ Test natural language chemistry requests
- ✅ View generated plan files (simulated)
- ✅ Experience the full user interface
- ✅ Learn how the tool works

### Example Demo Conversation:
```
🧪 ChemCLI Ready to Go! 🧪

🤖 ChemCLI:
═══════════════════════════════════════════════

## 🧪 Calculation Plan for benzene

**Calculation Type:** ABSORPTION SPECTRUM
**Recommended Software:** Psi4  
**Method:** CAM-B3LYP

## ⚙️ Precision Options

🔴 Full Precision (4-8 hours, ±0.15 eV, 8 GB)
🟡 Balanced Precision (1-2 hours, ±0.25 eV, 4 GB) ✅ Recommended
🟢 Fast Preview (15-30 minutes, ±0.5 eV, 2 GB)

⚡ Quick Selection:
  1️⃣  Type "1" for Full Precision
  2️⃣  Type "2" for Balanced Precision  
  3️⃣  Type "3" for Fast Preview
═══════════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ 🧪 Calculate absorption spectrum of benzene               │ <- Bordered input
└────────────────────────────────────────────────────────────┘

🤖 ChemCLI:
═══════════════════════════════════════════════

✅ Selected: BALANCED PRECISION

## 🎉 Calculation Setup Complete!

### 📋 Generated Files:
- research_plan.md - Detailed theoretical background
- execution_plan.md - Software and method selection
- run_plan.md - Complete execution instructions
- input.inp - Ready-to-run input file
- job.sh - Job submission script

**Estimated runtime:** 1-4 hours
**Expected accuracy:** ±0.2-0.4 eV vs experiment

Good luck with your calculation! 🧪✨
═══════════════════════════════════════════════
```

## 🔑 API Key Security

- Keys are encrypted locally in `~/.chemcli/config.json`
- Also saved to `.env` for compatibility
- Never shared or transmitted except to the respective AI service
- Use `--setup` to change or update keys

## 🐛 Troubleshooting

### CLI Won't Start
```bash
# Ensure dependencies are installed
npm install

# Check Node.js version (requires 18+)
node --version

# Clear any corrupted config
rm -rf ~/.chemcli
```

### Setup Wizard Issues
```bash
# Force new setup
node src/index.js --setup

# Check for network connectivity (for API key validation)
curl -I https://api.openai.com
```

### Demo Mode Stuck
```bash
# The 🧪 You → prompt should appear
# If not, try Ctrl+C and restart
# Type "help" to see available commands
```

## 💡 Tips

1. **Start with Demo Mode** - See how everything works first
2. **Use Balanced Precision** - Good accuracy/speed tradeoff for most tasks
3. **Try Different Molecules** - benzene, water, caffeine, glucose all work
4. **Be Specific** - "Calculate absorption spectrum of X" vs just "analyze X"
5. **Check Generated Files** - Review the planning documents to learn

## 🆘 Getting Help

- Type `help` in the CLI for examples
- Type `status` to check system status
- Check `EXAMPLES.md` for sample conversations
- Run `node test_setup.js` to verify installation