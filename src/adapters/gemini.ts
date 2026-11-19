import { WebsiteAdapter } from './types';

export class GeminiAdapter implements WebsiteAdapter {
  id = 'gemini';
  name = 'Google Gemini';

  matchDomain(hostname: string): boolean {
    return hostname.includes('gemini.google.com');
  }

  getInputElement(): HTMLElement | null {
    return (
      document.querySelector('rich-textarea .ql-editor') ||
      document.querySelector('div.ql-editor[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('textarea')
    );
  }

  getSubmitButton(): HTMLElement | null {
    return (
      document.querySelector('button.send-button') ||
      document.querySelector('button[aria-label*="Send message"]') ||
      document.querySelector('button[aria-label*="Submit"]') ||
      document.querySelector('button.send-button-container')
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

    el.focus();
    if (el instanceof HTMLTextAreaElement) {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
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
      return 'Quill editor input not found on Gemini page.';
    }
    return null;
  }
}
