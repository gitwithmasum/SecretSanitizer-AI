import { describe, it, expect } from 'vitest';
import { EnterprisePolicyManager } from '../../src/enterprise/policy';
import { SecretDetection } from '../../src/types';

describe('Enterprise Policy Engine', () => {
  const sampleDetection: SecretDetection = {
    id: 'det1',
    ruleId: 'stripe-secret-key',
    category: 'api_credential',
    name: 'Stripe Secret Key',
    severity: 'critical',
    confidence: 0.99,
    value: 'sk_test_123',
    maskedValue: 'sk_test...123',
    start: 0,
    end: 11,
    line: 1,
    column: 1,
    replacement: '[REDACTED_STRIPE_SECRET]',
    explanation: '',
    remediation: ''
  };

  it('enforces redaction for mandatory categories on unlisted domains', () => {
    const manager = new EnterprisePolicyManager();
    const evalResult = manager.evaluateSubmission('chatgpt.com', [sampleDetection]);

    expect(evalResult.enforceRedaction).toBe(true);
    expect(evalResult.allowBypass).toBe(true);
  });

  it('strictly blocks submissions to blocked domains', () => {
    const manager = new EnterprisePolicyManager({
      version: '1.0.0',
      organizationName: 'Acme Corp',
      allowBypass: false,
      domainAllowlist: [],
      domainBlocklist: ['untrusted-ai.com'],
      mandatoryCategories: ['api_credential'],
      complianceMode: 'SOC2',
      lastUpdated: Date.now()
    });

    const evalResult = manager.evaluateSubmission('untrusted-ai.com', [sampleDetection]);
    expect(evalResult.allowed).toBe(false);
    expect(evalResult.allowBypass).toBe(false);
  });

  it('generates compliance readiness report with controls mapping', () => {
    const manager = new EnterprisePolicyManager();
    const report = manager.generateComplianceReport({
      totalEvents: 50,
      sanitizationsCount: 30,
      blockedSubmissions: 15,
      bypassedCount: 0
    });

    expect(report.overallReadinessScore).toBeGreaterThanOrEqual(80);
    expect(report.controls.length).toBeGreaterThanOrEqual(4);
    expect(report.controls[0].status).toBe('Compliant');
  });
});
