import { DetectionEngine } from '../../src/scanner/engine';
import { SanitizationEngine } from '../../src/sanitizer/engine';

// Mock minimal VS Code types for standalone compilation or integration
export interface VSCodeExtensionContext {
  subscriptions: { dispose(): any }[];
}

export function activate(context: any) {
  console.log('[SecretSanitizer AI] VS Code Extension activated.');

  const engine = new DetectionEngine();

  // Command: Scan Active Document
  const scanCommand = {
    command: 'secretsanitizer.scanActiveFile',
    handler: async (vscode: any) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor open.');
        return;
      }

      const text = editor.document.getText();
      const detections = engine.scan(text);

      if (detections.length === 0) {
        vscode.window.showInformationMessage('🛡️ SecretSanitizer: No sensitive credentials found. Clean!');
      } else {
        vscode.window.showWarningMessage(
          `⚠️ SecretSanitizer: Detected ${detections.length} sensitive secret(s) in this file!`
        );
      }
    }
  };

  // Command: Sanitize Selection
  const sanitizeSelectionCommand = {
    command: 'secretsanitizer.sanitizeSelection',
    handler: async (vscode: any) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) return;

      const detections = engine.scan(text);
      if (detections.length === 0) {
        vscode.window.showInformationMessage('No secrets found in selection.');
        return;
      }

      const result = SanitizationEngine.sanitize(text, detections);
      editor.edit((editBuilder: any) => {
        editBuilder.replace(selection, result.sanitized);
      });

      vscode.window.showInformationMessage(
        `🛡️ SecretSanitizer: Redacted ${detections.length} secret(s) in selection.`
      );
    }
  };

  return {
    engine,
    commands: [scanCommand, sanitizeSelectionCommand]
  };
}

export function deactivate() {
  console.log('[SecretSanitizer AI] VS Code Extension deactivated.');
}
