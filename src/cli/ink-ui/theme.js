// Gemini-ish, but neutral: central tokens + component styles

export const themes = {
  default: {
    name: 'Default',
    gradientColors: ['#00f5ff', '#ff00f5', '#f5ff00', '#00ff5f', '#5f00ff'],
    colors: {
      primary: 'white',
      secondary: 'gray',
      accent: 'cyan',
      muted: 'gray',

      border: 'grey',
      borderActive: 'cyan',
      borderError: 'red',
      borderWarning: 'yellow',
      borderSuccess: 'green',

      userMessage: 'gray',
      assistantMessage: 'white',
      systemMessage: 'yellow',
      errorMessage: 'red',

      inputBorder: 'gray',
      inputPrompt: 'cyan',
      inputText: 'white',

      statusReady: 'green',
      statusThinking: 'yellow',
      statusStreaming: 'cyan',
      statusError: 'red'
    },
    gradients: {
      banner: 'cristal',
      subtitle: 'passion',
      footer: 'atlas',
      accent: 'instagram'
    },
    components: {
      chatMessage: { borderStyle: 'round', paddingX: 1, paddingY: 0, marginBottom: 1 },
      inputBox:    { borderStyle: 'round', paddingX: 1, paddingY: 0, marginTop: 1 },
      statusBar:   { borderStyle: 'single', borderTop: true, paddingX: 1, marginTop: 1 },
      banner:      { alignItems: 'center', marginBottom: 1 }
    }
  },

  minimal: {
    name: 'Minimal',
    gradientColors: ['#ffffff', '#cccccc', '#999999'],
    colors: {
      primary: 'white', secondary: 'gray', accent: 'gray', muted: 'gray',
      border: 'gray', borderActive: 'gray', borderError: 'red', borderWarning: 'yellow', borderSuccess: 'gray',
      userMessage: 'gray', assistantMessage: 'gray', systemMessage: 'gray', errorMessage: 'red',
      inputBorder: 'gray', inputPrompt: 'gray', inputText: 'white',
      statusReady: 'gray', statusThinking: 'gray', statusStreaming: 'gray', statusError: 'red'
    },
    gradients: { banner: 'cristal', subtitle: 'passion', footer: 'atlas', accent: 'atlas' },
    components: {
      chatMessage: { borderStyle: 'single', paddingX: 1, paddingY: 0, marginBottom: 1 },
      inputBox:    { borderStyle: 'single', paddingX: 1, paddingY: 0, marginTop: 1 },
      statusBar:   { borderStyle: 'single', borderTop: true, paddingX: 1, marginTop: 1 },
      banner:      { alignItems: 'center', marginBottom: 1 }
    }
  }
};

export class ThemeManager {
  constructor() { this.current = 'default'; }
  setTheme(name) { if (themes[name]) { this.current = name; return true; } return false; }
  getTheme() { return themes[this.current] || themes.default; }

  getColor(name)    { return this.getTheme().colors[name] || 'white'; }
  getGradient(name) { return this.getTheme().gradients[name] || 'cristal'; }
  getComponentStyle(name) { return this.getTheme().components[name] || {}; }
  getGradientColors() { return this.getTheme().gradientColors; }
}

export const themeManager = new ThemeManager();