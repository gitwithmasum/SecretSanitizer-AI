import * as vscode from 'vscode';
import { DetectionEngine } from '../../src/scanner/engine';
import { SecretDetection, SecretSeverity } from '../../src/types';

export class SecretDiagnosticsManager {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private engine: DetectionEngine;
  private documentFindings = new Map<string, SecretDetection[]>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('secretsanitizer');
    this.engine = new DetectionEngine();
  }

  public getCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }

  public getFindingsForDocument(uri: vscode.Uri): SecretDetection[] {
    return this.documentFindings.get(uri.toString()) || [];
  }

  public getAllFindings(): Map<string, SecretDetection[]> {
    return this.documentFindings;
  }

  public getTotalFindingsCount(): number {
    let count = 0;
    for (const findings of this.documentFindings.values()) {
      count += findings.length;
    }
    return count;
  }

  /**
   * Scans a text document and updates in-editor squiggly diagnostics
   */
  public scanDocument(document: vscode.TextDocument): SecretDetection[] {
    // Ignore git output, settings, or output windows
    if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
      return [];
    }

    const config = vscode.workspace.getConfiguration('secretsanitizer');
    const detectPII = config.get<boolean>('detectPII', true);
    const sensitivity = config.get<any>('sensitivity', 'balanced');

    const text = document.getText();
    const detections = this.engine.scan(text, {
      detectPII,
      sensitivity
    });

    this.documentFindings.set(document.uri.toString(), detections);

    const diagnostics: vscode.Diagnostic[] = detections.map((det) => {
      // Line is 1-based from scanner, vscode Position is 0-based
      const startPos = new vscode.Position(det.line - 1, det.column - 1);
      const endPos = new vscode.Position(
        det.line - 1,
        det.column - 1 + (det.end - det.start)
      );
      const range = new vscode.Range(startPos, endPos);

      let severity = vscode.DiagnosticSeverity.Warning;
      if (det.severity === 'critical') {
        severity = vscode.DiagnosticSeverity.Error;
      } else if (det.severity === 'low') {
        severity = vscode.DiagnosticSeverity.Information;
      }

      const diagnostic = new vscode.Diagnostic(
        range,
        `[SecretSanitizer AI] ${det.name} detected! Exposure Risk: ${det.severity.toUpperCase()}. Replace with ${det.replacement}`,
        severity
      );

      diagnostic.source = 'SecretSanitizer AI';
      diagnostic.code = det.ruleId;
      return diagnostic;
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
    return detections;
  }

  /**
   * Debounced scanning for active typing events
   */
  public triggerDebouncedScan(document: vscode.TextDocument, delayMs = 300): void {
    const key = document.uri.toString();
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.scanDocument(document);
      this.debounceTimers.delete(key);
    }, delayMs);

    this.debounceTimers.set(key, timer);
  }

  public clearDocument(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
    this.documentFindings.delete(uri.toString());
  }

  public clearAll(): void {
    this.diagnosticCollection.clear();
    this.documentFindings.clear();
  }

  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
