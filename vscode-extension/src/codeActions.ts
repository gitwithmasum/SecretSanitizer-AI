import * as vscode from 'vscode';
import { SecretDiagnosticsManager } from './diagnostics';
import { SanitizationEngine } from '../../src/sanitizer/engine';
import { SecurityAIAssistant } from '../../src/security/assistant';

export class SecretCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  constructor(private diagnosticsManager: SecretDiagnosticsManager) {}

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const findings = this.diagnosticsManager.getFindingsForDocument(document.uri);
    if (findings.length === 0) return [];

    const actions: vscode.CodeAction[] = [];

    // Find if current cursor/range intersects any detection
    const intersectingDetections = findings.filter((det) => {
      const detStart = new vscode.Position(det.line - 1, det.column - 1);
      const detEnd = new vscode.Position(
        det.line - 1,
        det.column - 1 + (det.end - det.start)
      );
      const detRange = new vscode.Range(detStart, detEnd);
      return detRange.intersection(range) !== undefined || detRange.contains(range);
    });

    for (const det of intersectingDetections) {
      const detStart = new vscode.Position(det.line - 1, det.column - 1);
      const detEnd = new vscode.Position(
        det.line - 1,
        det.column - 1 + (det.end - det.start)
      );
      const detRange = new vscode.Range(detStart, detEnd);

      // Action 1: Replace this specific secret with placeholder
      const fixAction = new vscode.CodeAction(
        `🛡️ Redact ${det.name} with ${det.replacement}`,
        vscode.CodeActionKind.QuickFix
      );
      fixAction.edit = new vscode.WorkspaceEdit();
      fixAction.edit.replace(document.uri, detRange, det.replacement);
      fixAction.isPreferred = true;
      actions.push(fixAction);

      // Action 2: Explain security risk
      const advisory = SecurityAIAssistant.generateAdvisory(det);
      const explainAction = new vscode.CodeAction(
        `💡 Explain Exposure Risk: ${advisory.threatLevel}`,
        vscode.CodeActionKind.Empty
      );
      explainAction.command = {
        command: 'secretsanitizer.explainDetection',
        title: 'Explain Secret Exposure Risk',
        arguments: [det]
      };
      actions.push(explainAction);
    }

    // Action 3: Redact all secrets in this document if multiple exist
    if (findings.length > 1) {
      const fixAllAction = new vscode.CodeAction(
        `📋 Redact All ${findings.length} Secrets in Current File`,
        vscode.CodeActionKind.QuickFix
      );
      const result = SanitizationEngine.sanitize(document.getText(), findings);
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      fixAllAction.edit = new vscode.WorkspaceEdit();
      fixAllAction.edit.replace(document.uri, fullRange, result.sanitized);
      actions.push(fixAllAction);
    }

    return actions;
  }
}
