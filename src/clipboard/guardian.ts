import { DetectionEngine } from '../scanner/engine';
import { SanitizationEngine } from '../sanitizer/engine';
import { StorageService } from '../storage';
import { ExtensionSettings } from '../types';

export class ClipboardGuardian {
  private engine: DetectionEngine;
  private settings: ExtensionSettings | null = null;
  private isBypassingNextCopy = false;

  constructor() {
    this.engine = new DetectionEngine();
  }

  public async init(): Promise<void> {
    this.settings = await StorageService.getSettings();
    const customRules = await StorageService.getCustomRules();
    this.engine.updateRules(this.engine['activeRules'], customRules);

    if (!this.settings.masterEnabled || !this.settings.clipboardProtection) {
      return;
    }

    this.setupCopyListener();
    console.log('[SecretSanitizer AI] Clipboard Guardian active.');
  }

  private setupCopyListener(): void {
    document.addEventListener(
      'copy',
      async (e: ClipboardEvent) => {
        if (this.isBypassingNextCopy) {
          this.isBypassingNextCopy = false;
          return;
        }

        // Get user-selected text locally
        const selection = window.getSelection()?.toString();
        if (!selection || selection.trim().length === 0) return;

        const detections = this.engine.scan(selection, {
          detectPII: this.settings?.detectPII ?? true,
          sensitivity: this.settings?.sensitivity ?? 'balanced'
        });

        if (detections.length === 0) return;

        // Sensitive credentials detected in selection
        if (this.settings?.clipboardAutoSanitize) {
          // Auto-sanitize copy
          const result = SanitizationEngine.sanitize(selection, detections);
          if (e.clipboardData) {
            e.preventDefault();
            e.clipboardData.setData('text/plain', result.sanitized);
            this.showToast(
              `SecretSanitizer: Redacted ${detections.length} secret(s) in copied text.`
            );
          }
          await StorageService.recordEvent({
            domain: window.location.hostname,
            category: detections[0].category,
            ruleId: detections[0].ruleId,
            severity: detections[0].severity,
            actionTaken: 'sanitized',
            maskedSnippet: detections.map((d) => `${d.name}: ${d.maskedValue}`).join(', ')
          });
        } else {
          // Alert user that selected text contains credentials
          this.showWarningToast(selection, detections);
        }
      },
      true
    );
  }

  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
      background: #0B0F19; border: 1px solid #06B6D4; color: #FFFFFF;
      padding: 12px 18px; border-radius: 8px; font-size: 13px; font-family: sans-serif;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(6,182,212,0.3);
      display: flex; align-items: center; gap: 8px;
    `;
    toast.innerHTML = `<span style="color: #06B6D4;">&#128737;</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  private showWarningToast(text: string, detections: any[]): void {
    const toast = document.createElement('div');
    toast.id = 'ss-clipboard-warn';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
      background: #0F172A; border: 1px solid #EF4444; color: #FFFFFF;
      padding: 14px 18px; border-radius: 10px; font-size: 13px; font-family: sans-serif;
      box-shadow: 0 12px 28px rgba(0,0,0,0.6), 0 0 20px rgba(239,68,68,0.3);
      max-width: 380px; display: flex; flex-direction: column; gap: 10px;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #EF4444; font-size: 18px;">&#9888;</span>
        <strong style="color: #F8FAFC;">Sensitive Credential Copied!</strong>
      </div>
      <div style="font-size: 12px; color: #94A3B8;">
        Your selection contains ${detections.length} sensitive secret(s) (${detections[0].name}).
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
        <button id="ss-copy-clean" style="background: #06B6D4; color: #000; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Copy Sanitized</button>
        <button id="ss-copy-dismiss" style="background: #334155; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Dismiss</button>
      </div>
    `;

    document.body.appendChild(toast);

    toast.querySelector('#ss-copy-clean')?.addEventListener('click', async () => {
      const result = SanitizationEngine.sanitize(text, detections);
      await navigator.clipboard.writeText(result.sanitized);
      toast.remove();
      this.showToast('Copied sanitized version to clipboard.');
    });

    toast.querySelector('#ss-copy-dismiss')?.addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => toast.remove(), 7000);
  }
}
