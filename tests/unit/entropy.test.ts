import { describe, it, expect } from 'vitest';
import {
  calculateShannonEntropy,
  calculateNormalizedEntropy,
  isHighEntropySecret,
  maskSecretValue
} from '../../src/scanner/entropy/shannon';

describe('Shannon Entropy Analyzer', () => {
  it('calculates zero entropy for empty strings', () => {
    expect(calculateShannonEntropy('')).toBe(0);
  });

  it('calculates low entropy for repetitive text', () => {
    const entropy = calculateShannonEntropy('aaaaaaaaaaaaaaaa');
    expect(entropy).toBe(0);
  });

  it('calculates expected entropy for natural English words', () => {
    const entropy = calculateShannonEntropy('hello world this is standard english text');
    expect(entropy).toBeGreaterThan(2.5);
    expect(entropy).toBeLessThan(4.2);
  });

  it('calculates high entropy for random base64 secret tokens', () => {
    const secret = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
    const entropy = calculateShannonEntropy(secret);
    expect(entropy).toBeGreaterThan(4.2);
  });

  it('correctly filters out UUIDs as secrets', () => {
    const uuid = 'c9a646d3-9c61-4cd9-bc19-470a322c601f';
    expect(isHighEntropySecret(uuid)).toBe(false);
  });

  it('correctly masks secrets for safe UI display', () => {
    expect(maskSecretValue('sk-proj-1234567890abcdef1234567890')).toBe('sk-pro...7890');
    expect(maskSecretValue('short')).toBe('****');
    expect(maskSecretValue('')).toBe('[REDACTED]');
  });
});
