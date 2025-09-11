// Shared status management utilities

export class StatusManager {
  constructor() {
    this.currentStatus = 'ready';
    this.currentModel = 'openai/gpt-4';
    this.listeners = [];
  }

  /**
   * Set the current status
   * @param {string} status - The new status ('ready', 'thinking', 'streaming', 'generating', etc.)
   */
  setStatus(status) {
    this.currentStatus = status;
    this.notifyListeners();
  }

  /**
   * Get the current status
   * @returns {string} The current status
   */
  getStatus() {
    return this.currentStatus;
  }

  /**
   * Set the current model information
   * @param {string} provider - The LLM provider (e.g., 'openai', 'anthropic')
   * @param {string} model - The model name
   */
  setModel(provider, model) {
    this.currentModel = `${provider}/${model}`;
    this.notifyListeners();
  }

  /**
   * Get the current model information
   * @returns {string} The current model string
   */
  getModel() {
    return this.currentModel;
  }

  /**
   * Add a status change listener
   * @param {Function} listener - Function to call when status changes
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove a status change listener
   * @param {Function} listener - The listener function to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of status changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus, this.currentModel);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * Format status text for display
   * @param {string} cwd - Current working directory
   * @param {string} contextUsage - Context usage information
   * @param {number} errors - Number of errors
   * @returns {string} Formatted status text
   */
  formatStatusBar(cwd = process.cwd(), contextUsage = '1% context (36k/3M limit)', errors = 0) {
    const formattedCwd = cwd.replace(process.env.HOME || '', '~');
    const errorText = errors > 0 ? ` | ${errors} error${errors === 1 ? '' : 's'}` : '';
    
    return `${formattedCwd} | ${this.currentStatus.toLowerCase()} | ${this.currentModel} | ${contextUsage}${errorText}`;
  }
}

// Export a singleton instance
export const statusManager = new StatusManager();