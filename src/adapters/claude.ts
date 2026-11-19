import { WebsiteAdapter } from './types';

export class ClaudeAdapter implements WebsiteAdapter {
  id = 'claude';
  name = 'Claude';

  matchDomain(hostname: string): boolean {
    return hostname.includes('claude.ai');
  }

  getInputElement(): HTMLElement | null {
    return (
      document.querySelector('div.ProseMirror[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('fieldset div[contenteditable="true"]')
    );
  }

  getSubmitButton(): HTMLElement | null {
    return (
      document.querySelector('button[aria-label="Send Message"]') ||
      document.querySelector('button[aria-label="Send prompt"]') ||
      document.querySelector('button[data-testid="send-button"]') ||
      document.querySelector('button:has(svg path[d*="M2.01 21L23 12"])')
    );
  }

  getInputValue(): string {
    const el = this.getInputElement();
    if (!el) return '';
    return el.innerText || el.textContent || '';
  }

  setInputValue(value: string): void {
    const el = this.getInputElement();
    if (!el) return;

    el.focus();
    // ProseMirror responds cleanly to document.execCommand
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, value);

    if (el.innerText !== value) {
      el.innerText = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  isAvailable(): boolean {
    return this.getInputElement() !== null;
  }

  getDegradedReason(): string | null {
    if (!this.getInputElement()) {
      return 'ProseMirror input container not found on Claude interface.';
    }
    return null;
  }
}
