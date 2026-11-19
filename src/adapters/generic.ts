import { WebsiteAdapter } from './types';

export class GenericAIAdapter implements WebsiteAdapter {
  id = 'generic';
  name = 'Generic AI Interface';

  matchDomain(_hostname: string): boolean {
    return true; // Fallback matches any host
  }

  getInputElement(): HTMLElement | null {
    // Look for active focused editable or common chat input selectors
    const active = document.activeElement;
    if (
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLInputElement && active.type === 'text') ||
      (active instanceof HTMLElement && active.isContentEditable)
    ) {
      return active;
    }

    return (
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('textarea') ||
      document.querySelector('input[type="text"][placeholder*="prompt" i]') ||
      document.querySelector('input[type="text"][placeholder*="message" i]')
    );
  }

  getSubmitButton(): HTMLElement | null {
    return (
      document.querySelector('button[type="submit"]') ||
      document.querySelector('button[aria-label*="send" i]') ||
      document.querySelector('button[aria-label*="submit" i]')
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
    return null;
  }
}
