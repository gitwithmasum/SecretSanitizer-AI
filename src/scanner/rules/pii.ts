import { DetectionRule } from '../../types';

/**
 * Validates a credit card number using Luhn algorithm (Mod 10)
 */
export function validateLuhn(numStr: string): boolean {
  const sanitized = numStr.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(sanitized)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export const PII_RULES: DetectionRule[] = [
  {
    id: 'credit-card',
    name: 'Credit Card Number',
    category: 'pii_business',
    severity: 'critical',
    pattern: /\b(?:\d{4}[ -]?){3}\d{4}\b|\b\d{15,16}\b/g,
    placeholder: '[REDACTED_CREDIT_CARD]',
    explanation: 'Detected a payment card number validating against the Luhn algorithm.',
    remediation: 'Never submit credit card or payment card information to third-party AI interfaces.',
    validator: (match: string) => validateLuhn(match)
  },
  {
    id: 'us-ssn',
    name: 'US Social Security Number (SSN)',
    category: 'pii_business',
    severity: 'critical',
    pattern: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
    placeholder: '[REDACTED_SSN]',
    explanation: 'Detected a US Social Security Number format with valid area and group numbers.',
    remediation: 'Redact all government-issued identifiers to avoid privacy violations and identity theft.'
  },
  {
    id: 'internal-ip-address',
    name: 'Internal / RFC-1918 Private IP Address',
    category: 'pii_business',
    severity: 'low',
    pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    placeholder: '[REDACTED_INTERNAL_IP]',
    explanation: 'Identified an internal RFC-1918 private network IP address.',
    remediation: 'Consider masking internal server addressing to obscure corporate network topology.'
  },
  {
    id: 'internal-hostname',
    name: 'Internal Infrastructure Hostname',
    category: 'pii_business',
    severity: 'medium',
    pattern: /\b[a-zA-Z0-9_\-]+\.(?:internal|corp|local|lan|priv)\b/gi,
    placeholder: '[REDACTED_INTERNAL_HOST]',
    explanation: 'Detected an internal enterprise domain or cluster hostname.',
    remediation: 'Use sanitized placeholder hostnames when debugging configuration files.'
  },
  {
    id: 'phone-number',
    name: 'Phone Number',
    category: 'pii_business',
    severity: 'low',
    pattern: /\b(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})\b/g,
    placeholder: '[REDACTED_PHONE_NUMBER]',
    explanation: 'Detected a personal or corporate telephone number.',
    remediation: 'Remove customer and employee contact numbers from prompts.'
  },
  {
    id: 'email-address',
    name: 'Email Address',
    category: 'pii_business',
    severity: 'low',
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    placeholder: '[REDACTED_EMAIL]',
    explanation: 'Detected an email address.',
    remediation: 'Redact customer or internal employee email addresses when sharing logs.',
    validator: (match: string) => {
      // Avoid flagging common test domains or standard libraries (e.g., example.com, test@test.com) as severe
      if (/@(?:example\.com|test\.com|localhost|domain\.com)$/i.test(match)) {
        return false;
      }
      return true;
    }
  }
];
