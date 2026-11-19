import { DetectionEngine } from '../scanner/engine';
import { SanitizationEngine } from '../sanitizer/engine';
import { AdapterRegistry } from '../adapters/registry';
import { WebsiteAdapter } from '../adapters/types';
import { SecurityReviewModal } from './modal';
import { ExtensionSettings, EnterprisePolicy } from '../types';
import { EnterprisePolicyManager } from '../enterprise/policy';
import { StorageService } from '../storage';

export class AIWebsiteFirewall {
  private adapter: WebsiteAdapter;
  private engine: DetectionEngine;
  private enterpriseManager: EnterprisePolicyManager;
  private settings: ExtensionSettings | null = null;
  private isBypassingOnce = false;
  private isIntercepting = false;

  constructor() {
    this.adapter = AdapterRegistry.getAdapterForHost(window.location.hostname);
    this.engine = new DetectionEngine();
    this.enterpriseManager = new EnterprisePolicyManager();
  }

  public async init(): Promise<void> {
    this.settings = await StorageService.getSettings();
    const policy = await StorageService.getEnterprisePolicy();
    const customRules = await StorageService.getCustomRules();

    this.enterpriseManager = new EnterprisePolicyManager(policy);
    this.engine.updateRules(this.engine['activeRules'], customRules);

    if (!this.settings.masterEnabled) {
      console.log('[SecretSanitizer AI] Firewall disabled by master toggle.');
      return;
    }

    // Attach listeners
    this.setupListeners();
    console.log(`[SecretSanitizer AI] Firewall active for ${this.adapter.name} (${window.location.hostname})`);
  }

  private setupListeners(): void {
    // Intercept Enter keypress on document/input level
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
          const inputEl = this.adapter.getInputElement();
          if (inputEl && (e.target === inputEl || inputEl.contains(e.target as Node))) {
            this.handleSubmissionAttempt(e);
          }
        }
      },
      true // Capture phase to preempt site handler
    );

    // Intercept clicks on submit button
    document.addEventListener(
      'click',
      (e) => {
        const submitBtn = this.adapter.getSubmitButton();
        if (submitBtn && (e.target === submitBtn || submitBtn.contains(e.target as Node))) {
          this.handleSubmissionAttempt(e);
        }
      },
      true
    );
  }

  private async handleSubmissionAttempt(e: Event): Promise<void> {
    if (this.isBypassingOnce) {
      this.isBypassingOnce = false;
      return; // Allow standard submission
    }

    if (this.isIntercepting) return;

    const rawText = this.adapter.getInputValue();
    if (!rawText || rawText.trim().length === 0) return;

    // Scan locally
    const detections = this.engine.scan(rawText, {
      detectPII: this.settings?.detectPII ?? true,
      sensitivity: this.settings?.sensitivity ?? 'balanced'
    });

    if (detections.length === 0) {
      return; // Clean input, let browser proceed
    }

    // Evaluate enterprise policy
    const policyEval = this.enterpriseManager.evaluateSubmission(
      window.location.hostname,
      detections
    );

    const activeMode = policyEval.enforceRedaction
      ? 'automatic'
      : this.settings?.protectionMode || 'review';

    if (activeMode === 'disabled') {
      return;
    }

    // Interrupt the event
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const sanitizeResult = SanitizationEngine.sanitize(rawText, detections);

    if (activeMode === 'automatic') {
      // Auto-redact and proceed
      this.adapter.setInputValue(sanitizeResult.sanitized);
      await StorageService.recordEvent({
        domain: window.location.hostname,
        category: detections[0].category,
        ruleId: detections[0].ruleId,
        severity: detections[0].severity,
        actionTaken: 'sanitized',
        maskedSnippet: detections.map((d) => `${d.name}: ${d.maskedValue}`).join(', ')
      });
      this.triggerSubmission();
      return;
    }

    if (activeMode === 'warning') {
      // Warning only: log and submit
      await StorageService.recordEvent({
        domain: window.location.hostname,
        category: detections[0].category,
        ruleId: detections[0].ruleId,
        severity: detections[0].severity,
        actionTaken: 'warned',
        maskedSnippet: detections.map((d) => `${d.name}: ${d.maskedValue}`).join(', ')
      });
      this.isBypassingOnce = true;
      this.triggerSubmission();
      return;
    }

    // Review mode: Display Security Review Modal
    this.isIntercepting = true;
    SecurityReviewModal.show(
      sanitizeResult,
      {
        onSanitizeAndSubmit: async (sanitizedText: string) => {
          this.isIntercepting = false;
          this.adapter.setInputValue(sanitizedText);
          await StorageService.recordEvent({
            domain: window.location.hostname,
            category: detections[0].category,
            ruleId: detections[0].ruleId,
            severity: detections[0].severity,
            actionTaken: 'sanitized',
            maskedSnippet: detections.map((d) => `${d.name}: ${d.maskedValue}`).join(', ')
          });
          this.isBypassingOnce = true;
          this.triggerSubmission();
        },
        onBypassAndSubmit: async () => {
          this.isIntercepting = false;
          await StorageService.recordEvent({
            domain: window.location.hostname,
            category: detections[0].category,
            ruleId: detections[0].ruleId,
            severity: detections[0].severity,
            actionTaken: 'bypassed',
            maskedSnippet: detections.map((d) => `${d.name}: ${d.maskedValue}`).join(', ')
          });
          this.isBypassingOnce = true;
          this.triggerSubmission();
        },
        onCancel: async () => {
          this.isIntercepting = false;
          await StorageService.recordEvent({
            domain: window.location.hostname,
            category: detections[0].category,
            ruleId: detections[0].ruleId,
            severity: detections[0].severity,
            actionTaken: 'blocked',
            maskedSnippet: detections.map((d) => `${d.name}: ${d.maskedValue}`).join(', ')
          });
        }
      },
      policyEval.allowBypass
    );
  }

  private triggerSubmission(): void {
    const btn = this.adapter.getSubmitButton();
    if (btn) {
      btn.click();
    } else {
      const input = this.adapter.getInputElement();
      if (input) {
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })
        );
      }
    }
  }
}
