/**
 * Shannon Entropy Analyzer & Character Distribution Classifier
 * Used to mathematically verify the randomness of candidate secret strings.
 */

export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const len = str.length;
  const frequencies = new Map<string, number>();

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

export function calculateNormalizedEntropy(
  str: string,
  charset: 'hex' | 'base64' | 'alphanumeric' | 'ascii' = 'base64'
): number {
  const rawEntropy = calculateShannonEntropy(str);
  let maxEntropy: number;

  switch (charset) {
    case 'hex':
      maxEntropy = 4.0; // log2(16)
      break;
    case 'base64':
      maxEntropy = 6.0; // log2(64)
      break;
    case 'alphanumeric':
      maxEntropy = 5.95; // log2(62)
      break;
    case 'ascii':
    default:
      maxEntropy = 6.58; // log2(96 printable ascii)
      break;
  }

  return Math.min(1.0, rawEntropy / maxEntropy);
}

/**
 * Checks whether a candidate string exhibits characteristics of an auto-generated random secret
 * rather than ordinary English text, UUIDs, or repeated patterns.
 */
export function isHighEntropySecret(
  value: string,
  minEntropy = 3.6,
  minLength = 16
): boolean {
  if (!value || value.length < minLength) return false;

  // Filter out repetitive patterns (e.g. aaaaaaaaaaaa, 0123456789012345)
  if (/^(.)\1+$/.test(value)) return false;
  if (/^(0123456789|abcdefghij|1234567890)+/i.test(value)) return false;

  // Filter out UUIDs (RFC 4122) which are not secrets
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return false;
  }

  const entropy = calculateShannonEntropy(value);
  if (entropy < minEntropy) return false;

  // Check character diversity
  let hasUpper = false;
  let hasLower = false;
  let hasDigit = false;
  let hasSpecial = false;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 65 && code <= 90) hasUpper = true;
    else if (code >= 97 && code <= 122) hasLower = true;
    else if (code >= 48 && code <= 57) hasDigit = true;
    else hasSpecial = true;
  }

  const diversity = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);
  return diversity >= 2;
}

/**
 * Creates safe masked representation for UI display without exposing secret
 * e.g., "sk-proj-98dFa...3b9F"
 */
export function maskSecretValue(value: string): string {
  if (!value) return '[REDACTED]';
  if (value.length <= 8) return '****';
  
  const prefixLen = Math.min(6, Math.floor(value.length / 4));
  const suffixLen = Math.min(4, Math.floor(value.length / 4));
  
  const prefix = value.substring(0, prefixLen);
  const suffix = value.substring(value.length - suffixLen);
  return `${prefix}...${suffix}`;
}
