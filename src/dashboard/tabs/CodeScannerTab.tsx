import React, { useState, useMemo } from 'react';
import {
  FileCode,
  UploadCloud,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Beaker,
  FileText,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { DetectionEngine } from '../../scanner/engine';
import { SanitizationEngine } from '../../sanitizer/engine';
import { SecurityAIAssistant } from '../../security/assistant';
import type { SecretDetection, SanitizeResult } from '../../types';

// Preloaded synthetic fixtures for the Security Test Lab
const SYNTHETIC_FIXTURES = {
  envFile: `# Production Environment Variables - DO NOT SHARE
PORT=8080
NODE_ENV=production
OPENAI_API_KEY=sk-proj-ab9876543210zyxwvutsrqponmlkjihgfedcba9876543210
STRIPE_SECRET_KEY=sk_test_51MzFakeStripeSecretTestKey9876543210
DATABASE_URL=postgres://app_admin:SecretSuperPass123!@db.internal:5432/core_production
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SLACK_BOT_TOKEN=xoxb-mockworkspace12345678-userauthtokenmock9876
ADMIN_EMAIL=security-lead@company.internal
`,
  serverJs: `import { S3Client } from "@aws-sdk/client-s3";
import Stripe from "stripe";

const stripe = new Stripe("sk_test_51MzFakeStripeSecretTestKey9876543210");
const githubToken = "ghp_FakeGitHubPersonalAccessToken36CharsLong";
const userJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export async function connectDatabase() {
  const mongoUri = "mongodb+srv://clusterUser:MongoPass99@cluster0.abcde.mongodb.net/prod?retryWrites=true&w=majority";
  return mongoUri;
}
`,
  sshAndPii: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3FakeSSHPrivateKeyBlockExampleDoNotCommitEver
bXlTZWNyZXRJc1NhZmVBbmRTZWN1cmVJblRoaXNUZXN0TGFiQ2hlY2tzT25seQ==
-----END RSA PRIVATE KEY-----

# Customer Invoicing Data:
Customer SSN: 000-45-6789
Corporate Card: 4532 0150 1234 5674
Contact Email: client-support@corp.internal
Private IP: 10.240.0.14
`
};

export const CodeScannerTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'testlab'>('editor');
  const [sourceCode, setSourceCode] = useState<string>(SYNTHETIC_FIXTURES.envFile);
  const [fileName, setFileName] = useState<string>('sample.env');
  const [copied, setCopied] = useState<boolean>(false);

  const engine = useMemo(() => new DetectionEngine(), []);

  // Run scan and sanitization reactively
  const { detections, sanitizeResult } = useMemo(() => {
    if (!sourceCode.trim()) {
      return {
        detections: [],
        sanitizeResult: {
          original: '',
          sanitized: '',
          detections: [],
          replacementMap: [],
          stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
        }
      };
    }
    const dets = engine.scan(sourceCode);
    const result = SanitizationEngine.sanitize(sourceCode, dets);
    return { detections: dets, sanitizeResult: result };
  }, [sourceCode, engine]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5MB safety limit to prevent browser resource exhaustion.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSourceCode(content);
    };
    reader.readAsText(file);
  };

  const handleCopySanitized = () => {
    navigator.clipboard.writeText(sanitizeResult.sanitized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSanitized = () => {
    const blob = new Blob([sanitizeResult.sanitized], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanitized-${fileName || 'file.txt'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header controls & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-850 p-4 rounded-xl border border-dark-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Developer Code & Secret Scanner</h2>
            <p className="text-xs text-slate-400">
              Inspect multi-language code snippets or files locally with zero network egress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-dark-900 p-1 rounded-lg border border-dark-700 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveSubTab('editor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'editor'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct Editor
            </button>
            <button
              onClick={() => setActiveSubTab('testlab')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeSubTab === 'testlab'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Beaker className="w-3.5 h-3.5" />
              <span>Security Test Lab</span>
            </button>
          </div>

          <label className="bg-dark-900 hover:bg-dark-700 text-slate-200 border border-dark-700 hover:border-dark-600 text-xs px-3 py-2 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Upload File</span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.php,.go,.rs,.cpp,.c,.cs,.sql,.json,.yaml,.yml,.env,.toml,.xml,.properties,.sh,.md,.txt"
            />
          </label>
        </div>
      </div>

      {/* Security Test Lab Quick Presets */}
      {activeSubTab === 'testlab' && (
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">Security Test Lab Fixtures:</span>
            <span className="text-purple-300/70">Safe synthetic sample credentials for validation</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSourceCode(SYNTHETIC_FIXTURES.envFile);
                setFileName('production.env');
              }}
              className="text-xs bg-dark-900/80 hover:bg-dark-800 text-purple-300 border border-purple-500/40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              .env Credentials
            </button>
            <button
              onClick={() => {
                setSourceCode(SYNTHETIC_FIXTURES.serverJs);
                setFileName('server.js');
              }}
              className="text-xs bg-dark-900/80 hover:bg-dark-800 text-purple-300 border border-purple-500/40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Node.js API & JWT
            </button>
            <button
              onClick={() => {
                setSourceCode(SYNTHETIC_FIXTURES.sshAndPii);
                setFileName('keys-and-pii.txt');
              }}
              className="text-xs bg-dark-900/80 hover:bg-dark-800 text-purple-300 border border-purple-500/40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              SSH Key & PII
            </button>
          </div>
        </div>
      )}

      {/* Code Editor & Sanitized Output Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Code Input */}
        <div className="bg-dark-850 rounded-xl border border-dark-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-dark-700 bg-dark-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>{fileName}</span>
            </div>
            <button
              onClick={() => setSourceCode('')}
              className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="Paste code snippet, connection string, or .env file contents here..."
            rows={14}
            className="w-full bg-dark-950 p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
          />

          <div className="p-3 border-t border-dark-700 bg-dark-900 flex items-center justify-between text-xs text-slate-400">
            <span>{sourceCode.length} chars &bull; {sourceCode.split('\n').length} lines</span>
            <span className="text-cyan-400 font-semibold font-mono">
              {detections.length} Secret(s) Found
            </span>
          </div>
        </div>

        {/* Sanitized Code Preview */}
        <div className="bg-dark-850 rounded-xl border border-dark-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-dark-700 bg-dark-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Sanitized Output (Safe to Share)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySanitized}
                className="bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadSanitized}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors font-medium"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={sanitizeResult.sanitized}
            rows={14}
            className="w-full bg-dark-950 p-4 font-mono text-xs text-emerald-300 focus:outline-none resize-none leading-relaxed select-all"
          />

          <div className="p-3 border-t border-dark-700 bg-dark-900 flex items-center justify-between text-xs text-slate-400">
            <span>Structure & Formatting Preserved</span>
            <span className="text-emerald-400 font-semibold">
              {sanitizeResult.replacementMap.length} Redactions Applied
            </span>
          </div>
        </div>
      </div>

      {/* Line-by-Line Findings Breakdown */}
      <div className="bg-dark-850 rounded-xl border border-dark-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Detection Findings Breakdown</span>
              <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                {detections.length} Total
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic matches, entropy confidence scores, and local remediation guidance.
            </p>
          </div>
        </div>

        {detections.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-dark-900 border border-dark-700/60 text-slate-500 text-xs flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-500/40" />
            <span>No secrets or credentials detected in current buffer.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {detections.map((det) => {
              const advisory = SecurityAIAssistant.generateAdvisory(det);
              return (
                <div
                  key={det.id}
                  className="p-4 rounded-xl bg-dark-900 border border-dark-700 space-y-3 hover:border-dark-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          det.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : det.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {det.severity}
                      </span>
                      <span className="text-sm font-semibold text-white">{det.name}</span>
                      <span className="text-xs font-mono text-slate-500">({det.ruleId})</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400 font-mono">
                        Line {det.line}, Col {det.column}
                      </span>
                      <span className="text-cyan-400 font-mono font-semibold">
                        {Math.round(det.confidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Masked Value</div>
                      <div className="font-mono text-cyan-300">{det.maskedValue}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Recommended Replacement</div>
                      <div className="font-mono text-emerald-400">{det.replacement}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-dark-850/60 border border-dark-700/60 text-xs space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Security Advisory & Immediate Action:</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">{advisory.threatLevel}</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{det.remediation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
