import { SecretDetection, SanitizeResult, SecretSeverity } from '../types';

export interface OverlapResolutionOptions {
  preferHigherSeverity?: boolean;
}

export class SanitizationEngine {
  private static severityWeight: Record<SecretSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  /**
   * Resolves any overlapping ranges among detections to ensure clean, non-corrupting string replacements.
   */
  public static resolveOverlaps(
    detections: SecretDetection[],
    _options: OverlapResolutionOptions = {}
  ): SecretDetection[] {
    if (detections.length <= 1) return [...detections];

    // Sort by start position ascending, then end descending
    const sorted = [...detections].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      const weightDiff =
        SanitizationEngine.severityWeight[b.severity] - SanitizationEngine.severityWeight[a.severity];
      if (weightDiff !== 0) return weightDiff;
      return b.end - a.end;
    });

    const nonOverlapping: SecretDetection[] = [];
    let currentEnd = -1;

    for (const det of sorted) {
      if (det.start >= currentEnd) {
        // Completely non-overlapping
        nonOverlapping.push(det);
        currentEnd = det.end;
      } else {
        // Overlap detected: check if current has higher severity than last added
        const lastDet = nonOverlapping[nonOverlapping.length - 1];
        const lastWeight = SanitizationEngine.severityWeight[lastDet.severity];
        const currentWeight = SanitizationEngine.severityWeight[det.severity];

        if (currentWeight > lastWeight && det.start >= lastDet.start && det.end >= lastDet.end) {
          // Replace last with higher severity candidate
          nonOverlapping.pop();
          nonOverlapping.push(det);
          currentEnd = det.end;
        }
        // Otherwise, ignore the overlapping lower-priority or enclosed sub-detection
      }
    }

    return nonOverlapping;
  }

  /**
   * Sanitizes input text by replacing detected secrets with meaningful placeholders.
   * Completely preserves code structure, indentation, whitespace, and formatting.
   */
  public static sanitize(
    text: string,
    detections: SecretDetection[],
    customPlaceholders?: Record<string, string>
  ): SanitizeResult {
    if (!text || detections.length === 0) {
      return {
        original: text,
        sanitized: text,
        detections: [],
        replacementMap: [],
        stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      };
    }

    const resolved = SanitizationEngine.resolveOverlaps(detections);
    const replacementMap: SanitizeResult['replacementMap'] = [];

    // Sort descending by start offset so index replacements do not shift earlier coordinates
    const sortedDesc = [...resolved].sort((a, b) => b.start - a.start);

    let sanitized = text;

    for (const det of sortedDesc) {
      const placeholder =
        (customPlaceholders && customPlaceholders[det.ruleId]) || det.replacement;

      const before = sanitized.slice(0, det.start);
      const after = sanitized.slice(det.end);
      sanitized = before + placeholder + after;

      replacementMap.unshift({
        placeholder,
        detectionId: det.id,
        category: det.category,
        ruleId: det.ruleId
      });
    }

    const stats = {
      total: resolved.length,
      critical: resolved.filter((d) => d.severity === 'critical').length,
      high: resolved.filter((d) => d.severity === 'high').length,
      medium: resolved.filter((d) => d.severity === 'medium').length,
      low: resolved.filter((d) => d.severity === 'low').length
    };

    return {
      original: text,
      sanitized,
      detections: resolved,
      replacementMap,
      stats
    };
  }

  /**
   * Generates diff metadata between original and sanitized text for side-by-side or inline preview.
   */
  public static computeDiff(original: string, sanitized: string) {
    const originalLines = original.split('\n');
    const sanitizedLines = sanitized.split('\n');

    const lineDiffs = originalLines.map((origLine, idx) => {
      const sanLine = sanitizedLines[idx] ?? '';
      return {
        lineNumber: idx + 1,
        original: origLine,
        sanitized: sanLine,
        modified: origLine !== sanLine
      };
    });

    return {
      totalLines: originalLines.length,
      modifiedLinesCount: lineDiffs.filter((l) => l.modified).length,
      lineDiffs
    };
  }
}

/**
 * Session history manager for undo/redo within the active review session.
 */
export class SessionUndoManager {
  private history: string[] = [];
  private pointer = -1;

  constructor(initialText: string) {
    this.push(initialText);
  }

  public push(text: string): void {
    // Truncate any redo branches
    if (this.pointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.pointer + 1);
    }
    this.history.push(text);
    this.pointer++;
  }

  public undo(): string | null {
    if (this.canUndo()) {
      this.pointer--;
      return this.history[this.pointer];
    }
    return null;
  }

  public redo(): string | null {
    if (this.canRedo()) {
      this.pointer++;
      return this.history[this.pointer];
    }
    return null;
  }

  public canUndo(): boolean {
    return this.pointer > 0;
  }

  public canRedo(): boolean {
    return this.pointer < this.history.length - 1;
  }

  public current(): string {
    return this.history[this.pointer] || '';
  }
}
