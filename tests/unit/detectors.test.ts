import { describe, it, expect } from 'vitest';
import { DetectionEngine } from '../../src/scanner/engine';

describe('Smart Secret Detection Engine', () => {
  const engine = new DetectionEngine();

  describe('API Credentials Detectors', () => {
    it('detects OpenAI project and standard API keys', () => {
      const code = 'const key = "sk-proj-ab9876543210zyxwvutsrqponmlkjihgfedcba9876543210";';
      const findings = engine.scan(code);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('openai-api-key');
      expect(findings[0].severity).toBe('critical');
      expect(findings[0].replacement).toBe('[REDACTED_OPENAI_API_KEY]');
    });

    it('detects Anthropic Claude API keys', () => {
      const code = 'const key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_anthropic_sample_token";';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'anthropic-api-key')).toBe(true);
    });

    it('detects AWS Access Key ID', () => {
      const code = 'aws_access_key_id = AKIAIOSFODNN7EXAMPLE';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'aws-access-key-id')).toBe(true);
    });

    it('detects Stripe secret and restricted live keys', () => {
      const code = 'const stripe = new Stripe("sk_test_51MzFakeStripeSecretLiveKey9876543210");';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'stripe-secret-key')).toBe(true);
    });

    it('detects GitHub Personal Access Tokens', () => {
      const code = 'const ghp = "ghp_FakeGitHubPersonalAccessToken36CharsLong";';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'github-pat')).toBe(true);
    });

    it('detects Slack and Discord Bot Tokens', () => {
      const slackVal = ['xoxb', '123456789012', '1234567890123', '4FakeSlackSecretTokenStr'].join('-');
      const discordVal = ['NTE1MjM0NTY3ODkwMTIzNDU2', 'GAbCdE', '123456789012345678901234567'].join('.');
      const code = `const slack = "${slackVal}";\nconst discord = "${discordVal}";`;
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'slack-token')).toBe(true);
      expect(findings.some((f) => f.ruleId === 'discord-bot-token')).toBe(true);
    });
  });

  describe('Authentication Secrets Detectors', () => {
    it('detects signed JWT tokens', () => {
      const code = 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'jwt-token')).toBe(true);
    });

    it('detects Bearer authorization headers', () => {
      const code = 'headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIx" }';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'bearer-token')).toBe(true);
    });
  });

  describe('Infrastructure Secrets Detectors', () => {
    it('detects PostgreSQL database connection strings', () => {
      const code = 'const uri = "postgres://admin:SuperSecretPass123!@db.internal:5432/core_production";';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'postgres-conn-string')).toBe(true);
    });

    it('detects MongoDB connection strings', () => {
      const code = 'const mongo = "mongodb+srv://user:pass1234@cluster.mongodb.net/test?retryWrites=true";';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'mongodb-conn-string')).toBe(true);
    });

    it('detects Private SSH Key blocks', () => {
      const code = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3FakeSSHPrivateKeyBlockExampleDoNotCommitEver
bXlTZWNyZXRJc1NhZmVBbmRTZWN1cmVJblRoaXNUZXN0TGFiQ2hlY2tzT25seQ==
-----END RSA PRIVATE KEY-----`;
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'ssh-private-key')).toBe(true);
    });
  });

  describe('PII & Context-Aware False Positive Suppression', () => {
    it('detects valid credit card numbers (Luhn checked)', () => {
      // 4532 0150 1234 5671 passes Luhn algorithm
      const code = 'card: "4532 0150 1234 5671"';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'credit-card')).toBe(true);
    });

    it('rejects random 16-digit numbers that fail Luhn algorithm', () => {
      const code = 'order_id: "1234567812345678"';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'credit-card')).toBe(false);
    });

    it('suppresses false positives on test email addresses', () => {
      const code = 'const testEmail = "test@example.com";\nconst dummy = "user@test.com";';
      const findings = engine.scan(code);
      expect(findings.some((f) => f.ruleId === 'email-address')).toBe(false);
    });
  });
});
