import { SecretDetection, DetectionRule, CustomRule, SensitivityLevel } from '../types';
import { BUILTIN_RULES, convertCustomRule } from './rules';
import { maskSecretValue, calculateShannonEntropy } from './entropy/shannon';

export interface ScanOptions {
  detectPII?: boolean;
  sensitivity?: SensitivityLevel;
  customRules?: CustomRule[];
  enabledRuleIds?: string[];
}

export class DetectionEngine {
  private activeRules: DetectionRule[] = [];

  constructor(rules: DetectionRule[] = BUILTIN_RULES) {
    this.activeRules = [...rules];
  }

  /**
   * Updates custom rules and sets of active rules
   */
  public updateRules(builtinRules: DetectionRule[], customRules: CustomRule[] = []): void {
    const validCustom = customRules
      .filter((r) => r.enabled)
      .map((r) => convertCustomRule(r))
      .filter((r): r is DetectionRule => r !== null);

    this.activeRules = [...builtinRules, ...validCustom];
  }

  /**
   * Scans a text document and returns all identified sensitive items
   */
  public scan(text: string, options: ScanOptions = {}): SecretDetection[] {
    if (!text || typeof text !== 'string' || text.length === 0) {
      return [];
    }

    const {
      detectPII = true,
      sensitivity = 'balanced',
      customRules = [],
      enabledRuleIds
    } = options;

    // Build effective rules
    let rulesToUse = [...this.activeRules];

    if (customRules.length > 0) {
      const activeCustom = customRules
        .filter((r) => r.enabled)
        .map((r) => convertCustomRule(r))
        .filter((r): r is DetectionRule => r !== null);
      rulesToUse = [...rulesToUse, ...activeCustom];
    }

    if (!detectPII) {
      rulesToUse = rulesToUse.filter((r) => r.category !== 'pii_business');
    }

    if (enabledRuleIds && enabledRuleIds.length > 0) {
      const idSet = new Set(enabledRuleIds);
      rulesToUse = rulesToUse.filter((r) => idSet.has(r.id));
    }

    // Precalculate line start offsets for rapid line/col lookup
    const lineStarts: number[] = [0];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        lineStarts.push(i + 1);
      }
    }

    const getLineAndCol = (offset: number) => {
      let low = 0;
      let high = lineStarts.length - 1;
      let lineIndex = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (lineStarts[mid] <= offset) {
          lineIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return {
        line: lineIndex + 1,
        column: offset - lineStarts[lineIndex] + 1
      };
    };

    const detections: SecretDetection[] = [];

    for (const rule of rulesToUse) {
      // Create a fresh clone of the regex to avoid shared lastIndex race conditions
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0];
        // Target specific capture group if provided (e.g. key in assignment), otherwise entire match
        const matchedSecret = match[1] || fullMatch;
        const matchOffset = match[1] ? match.index + match[0].indexOf(match[1]) : match.index;
        const matchLength = matchedSecret.length;

        // Run rule validator if present
        if (rule.validator && !rule.validator(fullMatch, text.slice(Math.max(0, match.index - 50), match.index + 50))) {
          continue;
        }

        // Calculate confidence
        const confidence = this.computeConfidence(matchedSecret, rule, sensitivity);

        // Filter based on sensitivity threshold
        const threshold = sensitivity === 'aggressive' ? 0.45 : sensitivity === 'low' ? 0.8 : 0.65;
        if (confidence < threshold) {
          continue;
        }

        const { line, column } = getLineAndCol(matchOffset);

        detections.push({
          id: `det_${rule.id}_${matchOffset}_${matchOffset + matchLength}`,
          ruleId: rule.id,
          category: rule.category,
          name: rule.name,
          severity: rule.severity,
          confidence,
          value: matchedSecret,
          maskedValue: maskSecretValue(matchedSecret),
          start: matchOffset,
          end: matchOffset + matchLength,
          line,
          column,
          replacement: rule.placeholder,
          explanation: rule.explanation,
          remediation: rule.remediation
        });
      }
    }

    // Sort by start offset ascending, then length descending
    detections.sort((a, b) => a.start - b.start || b.end - a.end);

    return detections;
  }

  private computeConfidence(
    secret: string,
    rule: DetectionRule,
    _sensitivity: SensitivityLevel
  ): number {
    let score = 0.8; // Baseline for explicit regex match

    // High confidence for distinct vendor prefixes (e.g., sk-proj-, sk-ant-, ghp-, AKIA)
    if (/^(?:sk-proj-|sk-ant-|ghp_|glpat-|xox[baprs]-|AKIA|ASIA|SG\.|AIza)/.test(secret)) {
      score = 0.98;
    } else if (rule.category === 'api_credential' || rule.category === 'auth_secret') {
      const entropy = calculateShannonEntropy(secret);
      if (entropy > 4.2) score = Math.min(1.0, score + 0.15);
      else if (entropy < 3.0 && secret.length > 10) score -= 0.2;
    }

    if (rule.category === 'pii_business' && rule.id === 'email-address') {
      score = 0.7; // Lower default confidence for general emails
    }

    return Math.min(1.0, Math.max(0.1, Math.round(score * 100) / 100));
  }
}
