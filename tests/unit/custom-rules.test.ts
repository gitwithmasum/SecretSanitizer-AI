import { describe, it, expect } from 'vitest';
import { validateCustomRegex, convertCustomRule } from '../../src/scanner/rules';
import { DetectionEngine } from '../../src/scanner/engine';
import { CustomRule } from '../../src/types';

describe('Custom Rules & ReDoS Defense', () => {
  it('validates legitimate custom regex patterns', () => {
    const res = validateCustomRegex('\\bacme_token_[a-zA-Z0-9]{16}\\b');
    expect(res.valid).toBe(true);
  });

  it('detects and rejects catastrophic backtracking (ReDoS) nested quantifiers', () => {
    // (a+)+ is a classic ReDoS pattern
    const res = validateCustomRegex('(a+)+');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('catastrophic backtracking');
  });

  it('rejects invalid regex syntax cleanly without crashing', () => {
    const res = validateCustomRegex('[a-z');
    expect(res.valid).toBe(false);
  });

  it('converts and runs custom rules inside DetectionEngine', () => {
    const customRule: CustomRule = {
      id: 'acme-secret',
      name: 'Acme Secret Token',
      regex: '\\bacme_secret_[0-9]{6}\\b',
      category: 'custom',
      severity: 'high',
      placeholder: '[REDACTED_ACME_SECRET]',
      description: 'Acme proprietary key',
      enabled: true,
      createdAt: Date.now()
    };

    const engine = new DetectionEngine();
    const detections = engine.scan('header: acme_secret_123456', {
      customRules: [customRule]
    });

    expect(detections.length).toBe(1);
    expect(detections[0].ruleId).toBe('acme-secret');
    expect(detections[0].replacement).toBe('[REDACTED_ACME_SECRET]');
  });
});
