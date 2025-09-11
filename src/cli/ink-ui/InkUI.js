import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { HELP_CONTENT } from '../../shared/help-content.js';

export class InkUI {
  constructor() {
    this.messages = [];
    this.streamingContent = '';
    this.isStreaming = false;
    this.isThinking = false;
    this.status = 'ready';
    this.currentModel = 'openai/gpt-4';
    this.errors = 0;

    this._rerender = null;
    this._unmount = null;
    this._onUserInput = null;
  }

  async start(onUserInput) {
    this._onUserInput = onUserInput;

    const props = this._props();
    const { rerender, unmount } = render(React.createElement(App, props));
    this._rerender = rerender;
    this._unmount = unmount;

    process.on('SIGINT', () => this.exit());
  }

  _props() {
    return {
      onUserInput: this._handleUserInput.bind(this),
      messages: [...this.messages],
      streamingContent: this.streamingContent,
      isStreaming: this.isStreaming,
      isThinking: this.isThinking,
      status: this.status,
      model: this.currentModel,
      errors: this.errors,
      // show "big header" only before first message
      showWelcome: this.messages.length === 0,
      showUpdate: this.messages.length === 0,
      showTips: this.messages.length === 0
    };
  }

  _handleUserInput(input) {
    // echo user input immediately
    this.addMessage('user', input);
    if (this._onUserInput) this._onUserInput(input);
  }

  setModel(provider, model) {
    this.currentModel = `${provider}/${model}`;
    this._update();
  }

  setStatus(status) {
    this.status = status;
    this._update();
  }

  incrementErrors(count = 1) {
    this.errors += count;
    this._update();
  }

  showResponse(content, responseTime = null) {
    this.addMessage('assistant', content, responseTime);
  }

  showInfo(content) {
    this.addMessage('info', content);
  }

  showError(content) {
    this.addMessage('error', content);
    this.incrementErrors(1);
  }

  showStreamingResponse(content, isComplete = false, responseTime = null) {
    if (isComplete) {
      this.isStreaming = false;
      if (this.streamingContent) {
        this.addMessage('assistant', this.streamingContent, responseTime);
        this.streamingContent = '';
      }
    } else {
      this.isStreaming = true;
      this.streamingContent = content; // already accumulated
    }
    this._update();
  }

  addMessage(type, content, responseTime = null) {
    this.messages.push({ type, content, responseTime });
    this._update();
  }

  clearMessages() {
    this.messages = [];
    this._update();
  }

  showHelp() {
    this.showInfo(HELP_CONTENT);
  }

  showThinking() {
    this.isThinking = true;
    this._update();
  }

  hideThinking() {
    this.isThinking = false;
    this._update();
  }

  _update() {
    if (this._rerender) this._rerender(React.createElement(App, this._props()));
  }

  close() {
    if (this._unmount) this._unmount();
  }

  exit() {
    this.close();
    process.exit(0);
  }
}