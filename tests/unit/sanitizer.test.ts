import { describe, it, expect } from 'vitest';
import { DetectionEngine } from '../../src/scanner/engine';
import { SanitizationEngine, SessionUndoManager } from '../../src/sanitizer/engine';

describe('Intelligent Sanitization Engine', () => {
  const engine = new DetectionEngine();

  it('accurately sanitizes multiple secrets while preserving variable names and formatting', () => {
    const input = `const apiKey = "sk_test_51MzFakeStripeSecretLiveKey9876543210";
const databaseUrl = "postgres://admin:password123@localhost:5432/app";`;

    const detections = engine.scan(input);
    const result = SanitizationEngine.sanitize(input, detections);

    expect(result.sanitized).toContain('const apiKey = "[REDACTED_STRIPE_SECRET]";');
    expect(result.sanitized).toContain('const databaseUrl = "[REDACTED_POSTGRES_URI]";');
    expect(result.stats.total).toBe(2);
  });

  it('preserves JSON structure when sanitizing embedded keys', () => {
    const jsonInput = JSON.stringify(
      {
        service: 'payment-processor',
        active: true,
        credentials: {
          key: 'sk_test_51MzFakeStripeSecretLiveKey9876543210',
          tokens: ['ghp_FakeGitHubPersonalAccessToken36CharsLong']
        }
      },
      null,
      2
    );

    const detections = engine.scan(jsonInput);
    const result = SanitizationEngine.sanitize(jsonInput, detections);

    expect(() => JSON.parse(result.sanitized)).not.toThrow();
    const parsed = JSON.parse(result.sanitized);
    expect(parsed.credentials.key).toBe('[REDACTED_STRIPE_SECRET]');
    expect(parsed.credentials.tokens[0]).toBe('[REDACTED_GITHUB_PAT]');
  });

  it('handles overlapping ranges safely without corrupting string slices', () => {
    // Construct fake overlapping detections
    const fakeText = 'sk-proj-1234567890abcdef1234567890EXTRA';
    const fakeDetections = [
      {
        id: 'det1',
        ruleId: 'openai-api-key',
        category: 'api_credential' as const,
        name: 'OpenAI API Key',
        severity: 'critical' as const,
        confidence: 0.99,
        value: 'sk-proj-1234567890abcdef1234567890',
        maskedValue: 'sk-pro...890',
        start: 0,
        end: 35,
        line: 1,
        column: 1,
        replacement: '[REDACTED_OPENAI_KEY]',
        explanation: '',
        remediation: ''
      },
      {
        id: 'det2',
        ruleId: 'generic-key',
        category: 'api_credential' as const,
        name: 'Generic Key',
        severity: 'high' as const,
        confidence: 0.7,
        value: '1234567890abcdef1234567890EXTRA',
        maskedValue: '1234...XTRA',
        start: 8,
        end: 40,
        line: 1,
        column: 9,
        replacement: '[REDACTED_GENERIC]',
        explanation: '',
        remediation: ''
      }
    ];

    const resolved = SanitizationEngine.resolveOverlaps(fakeDetections);
    expect(resolved.length).toBe(1);
    expect(resolved[0].id).toBe('det1'); // Kept critical over high
  });

  it('supports active session undo and redo states', () => {
    const undoManager = new SessionUndoManager('state 1');
    undoManager.push('state 2');
    undoManager.push('state 3');

    expect(undoManager.current()).toBe('state 3');
    expect(undoManager.undo()).toBe('state 2');
    expect(undoManager.undo()).toBe('state 1');
    expect(undoManager.undo()).toBeNull();

    expect(undoManager.redo()).toBe('state 2');
    expect(undoManager.redo()).toBe('state 3');
    expect(undoManager.redo()).toBeNull();
  });
});
