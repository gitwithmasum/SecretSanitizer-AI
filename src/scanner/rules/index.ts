import { DetectionRule, CustomRule } from '../../types';
import { API_CREDENTIAL_RULES } from './api-credentials';
import { AUTH_SECRET_RULES } from './auth-secrets';
import { INFRASTRUCTURE_RULES } from './infrastructure';
import { PII_RULES } from './pii';

export const BUILTIN_RULES: DetectionRule[] = [
  ...API_CREDENTIAL_RULES,
  ...AUTH_SECRET_RULES,
  ...INFRASTRUCTURE_RULES,
  ...PII_RULES
];

/**
 * Validates a user-provided custom regex pattern for safety and syntactic validity.
 * Protects against ReDoS (catastrophic backtracking) by checking for nested quantifiers.
 */
export function validateCustomRegex(patternStr: string): { valid: boolean; error?: string } {
  if (!patternStr || patternStr.trim().length === 0) {
    return { valid: false, error: 'Regex pattern cannot be empty.' };
  }

  // Check for catastrophic backtracking patterns: (a+)+, (.*)*, ([a-z]+)*, etc.
  const catastrophicBacktrackingRegex = /(\([^\)]*[\+\*][^\)]*\))[\+\*]|(\[[^\]]*[\+\*][^\]]*\])[\+\*]/;
  if (catastrophicBacktrackingRegex.test(patternStr)) {
    return {
      valid: false,
      error: 'Pattern exhibits potential catastrophic backtracking (ReDoS). Nested quantifiers are not permitted.'
    };
  }

  try {
    new RegExp(patternStr, 'g');
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid Regular Expression syntax.' };
  }
}

/**
 * Converts a CustomRule to a live DetectionRule
 */
export function convertCustomRule(rule: CustomRule): DetectionRule | null {
  const validation = validateCustomRegex(rule.regex);
  if (!validation.valid) return null;

  try {
    return {
      id: rule.id,
      name: rule.name,
      category: 'custom',
      severity: rule.severity,
      pattern: new RegExp(rule.regex, 'g'),
      placeholder: rule.placeholder || `[REDACTED_${rule.name.toUpperCase().replace(/\s+/g, '_')}]`,
      explanation: rule.description || 'Custom detection rule triggered.',
      remediation: 'Review and sanitize this proprietary pattern before sharing.'
    };
  } catch {
    return null;
  }
}
