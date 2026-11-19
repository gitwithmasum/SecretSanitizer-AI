import { WebsiteAdapter } from './types';

export class ChatGPTAdapter implements WebsiteAdapter {
  id = 'chatgpt';
  name = 'ChatGPT';

  matchDomain(hostname: string): boolean {
    return hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com');
  }

  getInputElement(): HTMLElement | null {
    return (
      document.querySelector('#prompt-textarea') ||
      document.querySelector('div[contenteditable="true"][data-placeholder]') ||
      document.querySelector('div#prompt-textarea') ||
      document.querySelector('textarea[data-id="root"]') ||
      document.querySelector('textarea')
    );
  }

  getSubmitButton(): HTMLElement | null {
    return (
      document.querySelector('button[data-testid="send-button"]') ||
      document.querySelector('button[aria-label="Send prompt"]') ||
      document.querySelector('button[aria-label="Send message"]') ||
      document.querySelector('form button[type="submit"]')
    );
  }

  getInputValue(): string {
    const el = this.getInputElement();
    if (!el) return '';
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return el.value;
    }
    return el.innerText || el.textContent || '';
  }

  setInputValue(value: string): void {
    const el = this.getInputElement();
    if (!el) return;

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Contenteditable div
      el.focus();
      // Use execCommand or direct textContent with input event
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, value);
      if (el.innerText !== value) {
        el.innerText = value;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  isAvailable(): boolean {
    return this.getInputElement() !== null;
  }

  getDegradedReason(): string | null {
    if (!this.getInputElement()) {
      return 'Prompt input field not located. ChatGPT may have updated its DOM structure.';
    }
    return null;
  }
}
