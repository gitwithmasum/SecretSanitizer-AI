import * as vscode from 'vscode';
import { SecretDiagnosticsManager } from './diagnostics';

export class SecretDashboardWebview {
  public static currentPanel: vscode.WebviewPanel | undefined;

  public static createOrShow(
    extensionUri: vscode.Uri,
    diagnosticsManager: SecretDiagnosticsManager
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SecretDashboardWebview.currentPanel) {
      SecretDashboardWebview.currentPanel.reveal(column);
      SecretDashboardWebview.updateContent(diagnosticsManager);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'secretsanitizerDashboard',
      'SecretSanitizer AI — Security Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    SecretDashboardWebview.currentPanel = panel;
    SecretDashboardWebview.updateContent(diagnosticsManager);

    panel.onDidDispose(() => {
      SecretDashboardWebview.currentPanel = undefined;
    });

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'scanWorkspace':
          vscode.commands.executeCommand('secretsanitizer.scanWorkspace');
          break;
        case 'scanActiveFile':
          vscode.commands.executeCommand('secretsanitizer.scanActiveFile');
          break;
        case 'sanitizeActiveFile':
          vscode.commands.executeCommand('secretsanitizer.sanitizeActiveFile');
          break;
        case 'installHook':
          vscode.commands.executeCommand('secretsanitizer.installPreCommitHook');
          break;
      }
    });
  }

  public static updateContent(diagnosticsManager: SecretDiagnosticsManager): void {
    if (!SecretDashboardWebview.currentPanel) return;

    const panel = SecretDashboardWebview.currentPanel;
    const allFindings = diagnosticsManager.getAllFindings();
    const totalCount = diagnosticsManager.getTotalFindingsCount();

    let findingsRows = '';
    for (const [uriStr, detections] of allFindings.entries()) {
      const fileName = uriStr.split('/').pop() || uriStr;
      for (const d of detections) {
        findingsRows += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #1E293B;">${fileName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #1E293B; font-weight: 600;">${d.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #1E293B;">
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${
                d.severity === 'critical' ? '#7F1D1D' : '#78350F'
              }; color: #FFF;">${d.severity.toUpperCase()}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #1E293B; font-family: monospace; color: #06B6D4;">${d.maskedValue}</td>
            <td style="padding: 10px; border-bottom: 1px solid #1E293B; font-family: monospace; color: #10B981;">${d.replacement}</td>
          </tr>
        `;
      }
    }

    if (!findingsRows) {
      findingsRows = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: #64748B;">
            🛡️ No exposed secrets detected in currently open workspace buffers.
          </td>
        </tr>
      `;
    }

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            background-color: #0B0F19;
            color: #F8FAFC;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 24px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1E293B;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            color: #06B6D4;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .btn {
            background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin-left: 8px;
          }
          .btn-secondary {
            background: #1E293B;
            color: #94A3B8;
            border: 1px solid #334155;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: #111827;
            border: 1px solid #1F2937;
            border-radius: 12px;
            padding: 16px;
          }
          .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #94A3B8;
            font-weight: 600;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 800;
            font-family: monospace;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #111827;
            border-radius: 12px;
            overflow: hidden;
            font-size: 12px;
          }
          th {
            background: #161F33;
            padding: 12px 10px;
            text-align: left;
            color: #94A3B8;
            font-size: 11px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">
            <span>🛡️ SecretSanitizer AI — Privacy Firewall</span>
          </div>
          <div>
            <button class="btn btn-secondary" onclick="sendMessage('installHook')">Install Git Pre-Commit Hook</button>
            <button class="btn btn-secondary" onclick="sendMessage('scanActiveFile')">Scan Active File</button>
            <button class="btn" onclick="sendMessage('scanWorkspace')">Scan Entire Workspace</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Detected Secrets</div>
            <div class="stat-value" style="color: ${totalCount > 0 ? '#EF4444' : '#10B981'};">${totalCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Security Posture</div>
            <div class="stat-value" style="color: #06B6D4;">${totalCount === 0 ? '100% CLEAN' : 'AT RISK'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Engine Mode</div>
            <div class="stat-value" style="color: #A855F7; font-size: 16px; margin-top: 10px;">100% LOCAL ZERO-EGRESS</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Guardrails</div>
            <div class="stat-value" style="color: #38BDF8; font-size: 16px; margin-top: 10px;">REALTIME ON-TYPE</div>
          </div>
        </div>

        <h3>Active Credential Detections in Workspace</h3>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Detected Rule</th>
              <th>Severity</th>
              <th>Masked Snippet</th>
              <th>Safe Replacement</th>
            </tr>
          </thead>
          <tbody>
            ${findingsRows}
          </tbody>
        </table>

        <script>
          const vscode = acquireVsCodeApi();
          function sendMessage(cmd) {
            vscode.postMessage({ command: cmd });
          }
        </script>
      </body>
      </html>
    `;
  }
}
