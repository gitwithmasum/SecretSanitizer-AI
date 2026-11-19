import { WebsiteAdapter } from './types';

export class PerplexityAdapter implements WebsiteAdapter {
  id = 'perplexity';
  name = 'Perplexity AI';

  matchDomain(hostname: string): boolean {
    return hostname.includes('perplexity.ai');
  }

  getInputElement(): HTMLElement | null {
    return (
      document.querySelector('textarea[placeholder*="Ask anything"]') ||
      document.querySelector('textarea[placeholder*="Ask follow-up"]') ||
      document.querySelector('textarea[placeholder*="Ask"]') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('textarea')
    );
  }

  getSubmitButton(): HTMLElement | null {
    return (
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('button:has(svg.lucide-arrow-right)') ||
      document.querySelector('button[type="submit"]')
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
      return 'Perplexity search/prompt input not found.';
    }
    return null;
  }
}
