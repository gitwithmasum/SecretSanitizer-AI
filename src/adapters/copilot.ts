import { WebsiteAdapter } from './types';

export class CopilotAdapter implements WebsiteAdapter {
  id = 'copilot';
  name = 'Microsoft Copilot';

  matchDomain(hostname: string): boolean {
    return hostname.includes('copilot.microsoft.com') || hostname.includes('bing.com/chat');
  }

  getInputElement(): HTMLElement | null {
    return (
      document.querySelector('textarea#userInput') ||
      document.querySelector('textarea[placeholder*="Ask me anything"]') ||
      document.querySelector('textarea[aria-label*="Ask me anything"]') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('textarea')
    );
  }

  getSubmitButton(): HTMLElement | null {
    return (
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('button[title="Submit"]') ||
      document.querySelector('button.submit-button')
    );
  }

  getInputValue(): string {
    const el = this.getInputElement();
    if (!el) return '';
    if (el instanceof HTMLTextAreaElement) return el.value;
    return el.innerText || el.textContent || '';
  }

  setInputValue(value: string): void {
    const el = this.getInputElement();
    if (!el) return;

    if (el instanceof HTMLTextAreaElement) {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.focus();
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  isAvailable(): boolean {
    return this.getInputElement() !== null;
  }

  getDegradedReason(): string | null {
    if (!this.getInputElement()) {
      return 'Copilot chat input textarea not found.';
    }
    return null;
  }
}
