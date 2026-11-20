import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class GitHookInstaller {
  public static async installPreCommitHook(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return false;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const gitHooksDir = path.join(rootPath, '.git', 'hooks');

    if (!fs.existsSync(gitHooksDir)) {
      vscode.window.showErrorMessage(
        'Current workspace is not a Git repository (.git/hooks directory not found).'
      );
      return false;
    }

    const preCommitPath = path.join(gitHooksDir, 'pre-commit');

    const hookScript = `#!/bin/sh
# SecretSanitizer AI — Pre-Commit Secret Scanner Hook
echo "🛡️ [SecretSanitizer AI] Scanning staged files for credentials before commit..."

node -e '
const fs = require("fs");
const { execSync } = require("child_process");

try {
  const stagedFiles = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" })
    .split("\\n")
    .map(f => f.trim())
    .filter(Boolean);

  let leaksFound = 0;
  const secretPatterns = [
    { name: "OpenAI API Key", regex: /sk-(?:proj-)?[a-zA-Z0-9_-]{24,}/ },
    { name: "Anthropic API Key", regex: /sk-ant-api03-[a-zA-Z0-9_-]{40,}/ },
    { name: "Stripe Secret Key", regex: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/ },
    { name: "AWS Key ID", regex: /(?:AKIA|ASIA|AROA)[0-9A-Z]{16}/ },
    { name: "GitHub PAT", regex: /ghp_[a-zA-Z0-9]{36,}/ },
    { name: "Database URI", regex: /postgres(?:ql)?:\\/\\/[^:\\s]+:[^@\\s]+@[^/\\s]+/ },
    { name: "Private SSH Key", regex: /-----BEGIN (?:RSA|OPENSSH) PRIVATE KEY-----/ }
  ];

  for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    if (file.includes("node_modules/") || file.includes("dist/")) continue;
    
    const content = fs.readFileSync(file, "utf8");
    for (const rule of secretPatterns) {
      if (rule.regex.test(content)) {
        console.error("\\x1b[31m[BLOCKED]\\x1b[0m " + rule.name + " detected in: " + file);
        leaksFound++;
      }
    }
  }

  if (leaksFound > 0) {
    console.error("\\x1b[31m❌ Git commit rejected by SecretSanitizer AI!\\x1b[0m");
    console.error("Please sanitize credentials using SecretSanitizer before committing.");
    process.exit(1);
  } else {
    console.log("\\x1b[32m✅ SecretSanitizer AI: Staged files verified clean!\\x1b[0m");
  }
} catch (err) {
  // If git command fails, proceed
  process.exit(0);
}
'
`;

    try {
      fs.writeFileSync(preCommitPath, hookScript, { mode: 0o755 });
      vscode.window.showInformationMessage(
        '🛡️ SecretSanitizer AI Git pre-commit hook installed successfully! Commits containing credentials will be automatically blocked.'
      );
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to install Git hook: ${err?.message}`);
      return false;
    }
  }
}
