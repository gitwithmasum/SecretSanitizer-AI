import * as vscode from 'vscode';
import { SecretDiagnosticsManager } from './diagnostics';
import { SecurityAIAssistant } from '../../src/security/assistant';

export class SecretHoverProvider implements vscode.HoverProvider {
  constructor(private diagnosticsManager: SecretDiagnosticsManager) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | null {
    const findings = this.diagnosticsManager.getFindingsForDocument(document.uri);
    if (findings.length === 0) return null;

    const matched = findings.find((det) => {
      const start = new vscode.Position(det.line - 1, det.column - 1);
      const end = new vscode.Position(
        det.line - 1,
        det.column - 1 + (det.end - det.start)
      );
      const range = new vscode.Range(start, end);
      return range.contains(position);
    });

    if (!matched) return null;

    const advisory = SecurityAIAssistant.generateAdvisory(matched);
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`### 🛡️ SecretSanitizer AI — Credential Exposure\n\n`);
    md.appendMarkdown(`**${matched.name}** &bull; Severity: **${matched.severity.toUpperCase()}**\n\n`);
    md.appendMarkdown(`- **Masked Token**: \`${matched.maskedValue}\`\n`);
    md.appendMarkdown(`- **Safe Replacement**: \`${matched.replacement}\`\n`);
    md.appendMarkdown(`- **Confidence**: \`${Math.round(matched.confidence * 100)}%\`\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`**⚠️ Threat Assessment**: ${advisory.threatLevel}\n\n`);
    md.appendMarkdown(`${advisory.impactDescription}\n\n`);
    md.appendMarkdown(`**🚨 Blast Radius**: ${advisory.blastRadius}\n\n`);
    md.appendMarkdown(`**Immediate Remediation Steps**:\n`);
    for (const step of advisory.immediateActions) {
      md.appendMarkdown(`1. ${step}\n`);
    }

    const startPos = new vscode.Position(matched.line - 1, matched.column - 1);
    const endPos = new vscode.Position(
      matched.line - 1,
      matched.column - 1 + (matched.end - matched.start)
    );
    const range = new vscode.Range(startPos, endPos);

    return new vscode.Hover(md, range);
  }
}
