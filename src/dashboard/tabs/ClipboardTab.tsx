import React, { useState } from 'react';
import {
  Clipboard,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Copy,
  Info,
  CheckCircle2
} from 'lucide-react';
import { ExtensionSettings } from '../../types';
import { StorageService } from '../../storage';
import { DetectionEngine } from '../../scanner/engine';
import { SanitizationEngine } from '../../sanitizer/engine';

interface ClipboardTabProps {
  settings: ExtensionSettings;
  onUpdateSettings: (newSettings: ExtensionSettings) => void;
}

export const ClipboardTab: React.FC<ClipboardTabProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [testText, setTestText] = useState(
    'const apiKey = "sk_test_51MzFakeStripeSecretTestKey9876543210";'
  );
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const toggleClipboard = async (field: 'clipboardProtection' | 'clipboardAutoSanitize') => {
    const updated = { ...settings, [field]: !settings[field] };
    await StorageService.saveSettings({ [field]: updated[field] });
    onUpdateSettings(updated);
  };

  const handleTestSimulatedCopy = async () => {
    const engine = new DetectionEngine();
    const detections = engine.scan(testText);

    if (detections.length === 0) {
      setCopyStatus('No secrets in selection. Copied plain text.');
      navigator.clipboard.writeText(testText);
    } else {
      const sanitized = SanitizationEngine.sanitize(testText, detections);
      await navigator.clipboard.writeText(sanitized.sanitized);
      setCopyStatus(
        `Intercepted ${detections.length} secret(s)! Sanitized text written to clipboard.`
      );
    }

    setTimeout(() => setCopyStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Clipboard className="w-4 h-4" />
            <span>Dedicated Clipboard Guardian</span>
          </div>
          <h2 className="text-xl font-bold text-white">Local Copy & Paste Interception</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Inspects user-initiated copy gestures entirely inside the local browser context.
            Never silently polls or accesses your system clipboard in the background.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleClipboard('clipboardProtection')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              settings.clipboardProtection
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-dark-900 border-dark-700 text-slate-400'
            }`}
          >
            {settings.clipboardProtection ? 'GUARDIAN ARMED' : 'GUARDIAN PAUSED'}
          </button>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Protection Mode */}
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-700 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Automatic Redaction on Copy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically substitutes detected secrets with safe placeholders in the clipboard buffer
                during copy events.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.clipboardAutoSanitize}
                onChange={() => toggleClipboard('clipboardAutoSanitize')}
                disabled={!settings.clipboardProtection}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
            </label>
          </div>

          <div className="p-3 rounded-lg bg-dark-900 border border-dark-800 text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              If disabled, a high-visibility warning notification appears offering a one-click sanitized copy.
            </span>
          </div>
        </div>

        {/* Security & Permissions Policy */}
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-700 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Browser Permission Guarantees</span>
          </h3>
          <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
            <li>Zero background polling: Never reads your clipboard without an explicit copy action.</li>
            <li>No persistent storage of unredacted copy snippets.</li>
            <li>Fully operates within standard Chrome Manifest V3 user-gesture sandbox.</li>
          </ul>
        </div>
      </div>

      {/* Interactive Clipboard Tester */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-700 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Test Clipboard Interceptor</span>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
            Interactive Sandbox
          </span>
        </h3>

        <div className="space-y-2">
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleTestSimulatedCopy}
            className="bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-glow-cyan"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Trigger Test Copy Event</span>
          </button>

          {copyStatus && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              {copyStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
