import * as vscode from 'vscode';
import { SecretDiagnosticsManager } from './diagnostics';
import { SecretCodeActionProvider } from './codeActions';
import { SecretHoverProvider } from './hoverProvider';
import { SecretFindingsTreeProvider } from './treeDataProvider';
import { SecretDashboardWebview } from './dashboardWebview';
import { GitHookInstaller } from './gitHook';
import { SanitizationEngine } from '../../src/sanitizer/engine';
import { SecurityAIAssistant } from '../../src/security/assistant';
import { SecretDetection } from '../../src/types';

let statusBarItem: vscode.StatusBarItem;
let isRealtimeEnabled = true;

export function activate(context: vscode.ExtensionContext) {
  console.log('[SecretSanitizer AI] Enterprise Security Extension activating...');

  const diagnosticsManager = new SecretDiagnosticsManager();
  const treeProvider = new SecretFindingsTreeProvider(diagnosticsManager);

  // Register Tree View in Sidebar
  vscode.window.registerTreeDataProvider('secretsanitizer.findingsView', treeProvider);

  // Register Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'secretsanitizer.openDashboard';
  context.subscriptions.push(statusBarItem);
  updateStatusBar(diagnosticsManager.getTotalFindingsCount());

  // Register Code Actions (Quick Fixes)
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file' },
      new SecretCodeActionProvider(diagnosticsManager),
      {
        providedCodeActionKinds: SecretCodeActionProvider.providedCodeActionKinds
      }
    )
  );

  // Register Hover Provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file' },
      new SecretHoverProvider(diagnosticsManager)
    )
  );

  // Function to refresh and update UI
  const handleDocumentChange = (doc: vscode.TextDocument) => {
    if (!isRealtimeEnabled) return;
    diagnosticsManager.triggerDebouncedScan(doc);
    setTimeout(() => {
      updateStatusBar(diagnosticsManager.getTotalFindingsCount());
      treeProvider.refresh();
      SecretDashboardWebview.updateContent(diagnosticsManager);
    }, 350);
  };

  // Event Listeners
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => handleDocumentChange(e.document)),
    vscode.workspace.onDidOpenTextDocument((doc) => handleDocumentChange(doc)),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const config = vscode.workspace.getConfiguration('secretsanitizer');
      if (config.get<boolean>('scanOnSave', true)) {
        diagnosticsManager.scanDocument(doc);
        updateStatusBar(diagnosticsManager.getTotalFindingsCount());
        treeProvider.refresh();
      }
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticsManager.clearDocument(doc.uri);
      updateStatusBar(diagnosticsManager.getTotalFindingsCount());
      treeProvider.refresh();
    })
  );

  // COMMAND 1: Scan Active File
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.scanActiveFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor open.');
        return;
      }

      const detections = diagnosticsManager.scanDocument(editor.document);
      updateStatusBar(diagnosticsManager.getTotalFindingsCount());
      treeProvider.refresh();

      if (detections.length === 0) {
        vscode.window.showInformationMessage(
          '🛡️ SecretSanitizer AI: No credentials or secrets found in current file. Clean!'
        );
      } else {
        const criticalCount = detections.filter((d) => d.severity === 'critical').length;
        vscode.window.showWarningMessage(
          `⚠️ SecretSanitizer AI: Found ${detections.length} secret(s) (${criticalCount} Critical)! Check squiggly lines or Quick Fix (Ctrl+.) to redact.`
        );
      }
    })
  );

  // COMMAND 2: Scan Entire Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.scanWorkspace', async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'SecretSanitizer AI: Scanning Workspace for Secrets...',
          cancellable: true
        },
        async (progress, token) => {
          const files = await vscode.workspace.findFiles(
            '**/*.{js,jsx,ts,tsx,py,java,go,rs,cpp,c,cs,sql,json,yaml,yml,env,toml,xml,properties,sh,md,txt}',
            '**/{node_modules,dist,out,.git,.vscode-test}/**'
          );

          let totalFound = 0;
          let scannedFiles = 0;

          for (const file of files) {
            if (token.isCancellationRequested) break;
            try {
              const doc = await vscode.workspace.openTextDocument(file);
              const findings = diagnosticsManager.scanDocument(doc);
              totalFound += findings.length;
              scannedFiles++;
              progress.report({
                increment: (1 / files.length) * 100,
                message: `Scanning ${scannedFiles}/${files.length} files...`
              });
            } catch {
              // Ignore binary or inaccessible files
            }
          }

          updateStatusBar(diagnosticsManager.getTotalFindingsCount());
          treeProvider.refresh();
          SecretDashboardWebview.updateContent(diagnosticsManager);

          if (totalFound === 0) {
            vscode.window.showInformationMessage(
              `🛡️ SecretSanitizer AI: Scanned ${scannedFiles} workspace files. 0 secrets found. Clean!`
            );
          } else {
            vscode.window.showErrorMessage(
              `🚨 SecretSanitizer AI: Workspace Scan complete! Identified ${totalFound} secret exposures across ${scannedFiles} files.`
            );
          }
        }
      );
    })
  );

  // COMMAND 3: Sanitize Selection
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.sanitizeSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text || text.trim().length === 0) {
        vscode.window.showInformationMessage('Please highlight text to sanitize.');
        return;
      }

      const engine = diagnosticsManager['engine'];
      const detections = engine.scan(text);

      if (detections.length === 0) {
        vscode.window.showInformationMessage(
          'No secrets or sensitive tokens found in highlighted selection.'
        );
        return;
      }

      const result = SanitizationEngine.sanitize(text, detections);
      await editor.edit((editBuilder) => {
        editBuilder.replace(selection, result.sanitized);
      });

      vscode.window.showInformationMessage(
        `🛡️ SecretSanitizer AI: Redacted ${detections.length} secret(s) with safe placeholders!`
      );
    })
  );

  // COMMAND 4: Sanitize Entire Active File
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.sanitizeActiveFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const doc = editor.document;
      const findings = diagnosticsManager.getFindingsForDocument(doc.uri);

      if (findings.length === 0) {
        vscode.window.showInformationMessage('No detected secrets in active file to sanitize.');
        return;
      }

      const choice = await vscode.window.showWarningMessage(
        `Redact all ${findings.length} detected secrets in ${doc.fileName}?`,
        { modal: true },
        'Replace In-Place',
        'Open Side-by-Side Diff'
      );

      const result = SanitizationEngine.sanitize(doc.getText(), findings);

      if (choice === 'Replace In-Place') {
        const fullRange = new vscode.Range(
          doc.positionAt(0),
          doc.positionAt(doc.getText().length)
        );
        await editor.edit((editBuilder) => {
          editBuilder.replace(fullRange, result.sanitized);
        });
        vscode.window.showInformationMessage(
          `🛡️ Sanitized ${findings.length} secret(s) in-place!`
        );
      } else if (choice === 'Open Side-by-Side Diff') {
        const untitledDoc = await vscode.workspace.openTextDocument({
          content: result.sanitized,
          language: doc.languageId
        });
        await vscode.commands.executeCommand(
          'vscode.diff',
          doc.uri,
          untitledDoc.uri,
          `SecretSanitizer: Original ↔ Sanitized`
        );
      }
    })
  );

  // COMMAND 5: Open Dashboard Webview
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.openDashboard', () => {
      SecretDashboardWebview.createOrShow(context.extensionUri, diagnosticsManager);
    })
  );

  // COMMAND 6: Toggle Real-time Protection
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.toggleRealtime', () => {
      isRealtimeEnabled = !isRealtimeEnabled;
      if (isRealtimeEnabled) {
        vscode.window.showInformationMessage('🛡️ SecretSanitizer AI Real-Time Protection: ON');
        if (vscode.window.activeTextEditor) {
          diagnosticsManager.scanDocument(vscode.window.activeTextEditor.document);
        }
      } else {
        diagnosticsManager.clearAll();
        vscode.window.showWarningMessage('⚠️ SecretSanitizer AI Real-Time Protection: PAUSED');
      }
      updateStatusBar(diagnosticsManager.getTotalFindingsCount());
      treeProvider.refresh();
    })
  );

  // COMMAND 7: Install Git Pre-Commit Hook
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.installPreCommitHook', async () => {
      await GitHookInstaller.installPreCommitHook();
    })
  );

  // COMMAND 8: Explain Detection
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'secretsanitizer.explainDetection',
      (detection: SecretDetection) => {
        const advisory = SecurityAIAssistant.generateAdvisory(detection);
        vscode.window.showInformationMessage(
          `🛡️ ${advisory.title} [${advisory.threatLevel}]\n${advisory.impactDescription}\nRemediation: ${advisory.immediateActions[0]}`,
          { modal: true }
        );
      }
    )
  );

  // COMMAND 9: Clear All Diagnostics
  context.subscriptions.push(
    vscode.commands.registerCommand('secretsanitizer.clearDiagnostics', () => {
      diagnosticsManager.clearAll();
      updateStatusBar(0);
      treeProvider.refresh();
      vscode.window.showInformationMessage('SecretSanitizer diagnostics cleared.');
    })
  );

  // Initial Scan of active document on startup
  if (vscode.window.activeTextEditor) {
    diagnosticsManager.scanDocument(vscode.window.activeTextEditor.document);
    updateStatusBar(diagnosticsManager.getTotalFindingsCount());
    treeProvider.refresh();
  }

  console.log('✅ [SecretSanitizer AI] VS Code Extension active and guarding workspace.');
}

function updateStatusBar(findingsCount: number): void {
  if (!statusBarItem) return;

  if (!isRealtimeEnabled) {
    statusBarItem.text = `$(shield) SecretSanitizer: Paused`;
    statusBarItem.color = new vscode.ThemeColor('disabledForeground');
    statusBarItem.tooltip = 'SecretSanitizer AI is currently paused. Click to open dashboard.';
  } else if (findingsCount === 0) {
    statusBarItem.text = `$(shield) SecretSanitizer: Armored`;
    statusBarItem.color = new vscode.ThemeColor('terminal.ansiCyan');
    statusBarItem.tooltip = 'SecretSanitizer AI is actively protecting your workspace. 0 secrets found.';
  } else {
    statusBarItem.text = `$(alert) SecretSanitizer: ${findingsCount} Leaks`;
    statusBarItem.color = new vscode.ThemeColor('errorForeground');
    statusBarItem.tooltip = `Warning: ${findingsCount} exposed credential(s) detected! Click to inspect.`;
  }

  statusBarItem.show();
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
