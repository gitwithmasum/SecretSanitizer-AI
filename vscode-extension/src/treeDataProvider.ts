import * as vscode from 'vscode';
import { SecretDiagnosticsManager } from './diagnostics';
import { SecretDetection } from '../../src/types';

export class SecretTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly uri?: vscode.Uri,
    public readonly detection?: SecretDetection
  ) {
    super(label, collapsibleState);

    if (detection && uri) {
      this.description = `Line ${detection.line}, Col ${detection.column} [${detection.maskedValue}]`;
      this.tooltip = `${detection.name} (${detection.severity.toUpperCase()})\nReplacement: ${detection.replacement}`;
      
      if (detection.severity === 'critical') {
        this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
      } else if (detection.severity === 'high' || detection.severity === 'medium') {
        this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
      } else {
        this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
      }

      const startPos = new vscode.Position(detection.line - 1, detection.column - 1);
      const endPos = new vscode.Position(
        detection.line - 1,
        detection.column - 1 + (detection.end - detection.start)
      );

      this.command = {
        command: 'vscode.open',
        title: 'Open Finding Location',
        arguments: [
          uri,
          {
            selection: new vscode.Range(startPos, endPos)
          }
        ]
      };
    } else if (uri) {
      this.resourceUri = uri;
      this.iconPath = vscode.ThemeIcon.File;
    }
  }
}

export class SecretFindingsTreeProvider implements vscode.TreeDataProvider<SecretTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SecretTreeItem | undefined | void> =
    new vscode.EventEmitter<SecretTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<SecretTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private diagnosticsManager: SecretDiagnosticsManager) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: SecretTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: SecretTreeItem): Thenable<SecretTreeItem[]> {
    if (!element) {
      // Root level: return all files that have detected secrets
      const allFindings = this.diagnosticsManager.getAllFindings();
      const fileItems: SecretTreeItem[] = [];

      for (const [uriStr, findings] of allFindings.entries()) {
        if (findings.length > 0) {
          const uri = vscode.Uri.parse(uriStr);
          const fileName = uri.path.split('/').pop() || uri.fsPath;
          const label = `${fileName} (${findings.length})`;
          fileItems.push(
            new SecretTreeItem(label, vscode.TreeItemCollapsibleState.Expanded, uri)
          );
        }
      }

      if (fileItems.length === 0) {
        return Promise.resolve([
          new SecretTreeItem('🛡️ No secrets detected in active workspace', vscode.TreeItemCollapsibleState.None)
        ]);
      }

      return Promise.resolve(fileItems);
    }

    if (element.uri && !element.detection) {
      // Child level: return individual detections for this file
      const findings = this.diagnosticsManager.getFindingsForDocument(element.uri);
      const items = findings.map(
        (det) =>
          new SecretTreeItem(
            det.name,
            vscode.TreeItemCollapsibleState.None,
            element.uri,
            det
          )
      );
      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }
}
