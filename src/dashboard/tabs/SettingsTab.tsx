import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Eye,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  Lock,
  Moon,
  Sun
} from 'lucide-react';
import { ExtensionSettings, ProtectionMode, SensitivityLevel } from '../../types';
import { StorageService, DEFAULT_SETTINGS } from '../../storage';

interface SettingsTabProps {
  settings: ExtensionSettings;
  onUpdateSettings: (settings: ExtensionSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [savedFeedback, setSavedFeedback] = useState(false);

  const updateField = async <K extends keyof ExtensionSettings>(
    field: K,
    value: ExtensionSettings[K]
  ) => {
    const updated = { ...settings, [field]: value };
    await StorageService.saveSettings({ [field]: value });
    onUpdateSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset all extension preferences to default settings?')) {
      await StorageService.saveSettings(DEFAULT_SETTINGS);
      onUpdateSettings(DEFAULT_SETTINGS);
    }
  };

  const handleClearAllData = async () => {
    if (
      confirm(
        'WARNING: This will permanently erase all local settings, custom rules, and audit logs. Continue?'
      )
    ) {
      await StorageService.clearAllData();
      onUpdateSettings(DEFAULT_SETTINGS);
      alert('All local storage data has been cleared.');
    }
  };

  const handleExportConfig = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(settings, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `secretsanitizer-config-${Date.now()}.json`);
    dl.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Platform Settings & Privacy Controls</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure local scanning parameters, protection sensitivity, and privacy boundaries.
          </p>
        </div>

        {savedFeedback && (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Changes Saved
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Protection Mode */}
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-700 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Default Protection Policy</h3>
            <p className="text-xs text-slate-400">
              Determines how intercepted sensitive prompts are handled by the firewall.
            </p>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 cursor-pointer">
              <input
                type="radio"
                name="protectionMode"
                value="review"
                checked={settings.protectionMode === 'review'}
                onChange={() => updateField('protectionMode', 'review')}
                className="text-cyan-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-slate-200">Review Before Redaction (Recommended)</div>
                <div className="text-[11px] text-slate-400">Presents an in-page modal with preview before submitting.</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 cursor-pointer">
              <input
                type="radio"
                name="protectionMode"
                value="automatic"
                checked={settings.protectionMode === 'automatic'}
                onChange={() => updateField('protectionMode', 'automatic')}
                className="text-cyan-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-slate-200">Automatic Redaction</div>
                <div className="text-[11px] text-slate-400">Immediately sanitizes and submits clean placeholders seamlessly.</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 cursor-pointer">
              <input
                type="radio"
                name="protectionMode"
                value="warning"
                checked={settings.protectionMode === 'warning'}
                onChange={() => updateField('protectionMode', 'warning')}
                className="text-cyan-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-slate-200">Warning Only</div>
                <div className="text-[11px] text-slate-400">Audits and alerts without halting form submission.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Detection Sensitivity */}
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-700 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Detection Sensitivity & Confidence</h3>
            <p className="text-xs text-slate-400">
              Entropy thresholds and false-positive suppression tuning.
            </p>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 cursor-pointer">
              <input
                type="radio"
                name="sensitivity"
                value="balanced"
                checked={settings.sensitivity === 'balanced'}
                onChange={() => updateField('sensitivity', 'balanced')}
                className="text-cyan-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-slate-200">Balanced (Recommended)</div>
                <div className="text-[11px] text-slate-400">High entropy + keyword boost. Optimal signal-to-noise ratio.</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 cursor-pointer">
              <input
                type="radio"
                name="sensitivity"
                value="aggressive"
                checked={settings.sensitivity === 'aggressive'}
                onChange={() => updateField('sensitivity', 'aggressive')}
                className="text-cyan-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-slate-200">Aggressive</div>
                <div className="text-[11px] text-slate-400">Lower entropy barriers for strict production environments.</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 cursor-pointer">
              <input
                type="radio"
                name="sensitivity"
                value="low"
                checked={settings.sensitivity === 'low'}
                onChange={() => updateField('sensitivity', 'low')}
                className="text-cyan-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-slate-200">Low (Explicit Vendor Keys Only)</div>
                <div className="text-[11px] text-slate-400">Only flags deterministic vendor prefixes (OpenAI, Stripe, etc.).</div>
              </div>
            </label>
          </div>
        </div>

        {/* PII Detection Toggle */}
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-700 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">PII & Business Information Scanning</h3>
            <p className="text-xs text-slate-400">
              Scans for credit card numbers, SSNs, personal emails, and internal IP ranges.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.detectPII}
              onChange={(e) => updateField('detectPII', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
          </label>
        </div>

        {/* Master Kill-switch */}
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-700 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Global Firewall Active</h3>
            <p className="text-xs text-slate-400">
              Master on/off switch for all content script hooks and clipboard monitoring.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.masterEnabled}
              onChange={(e) => updateField('masterEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
          </label>
        </div>
      </div>

      {/* Data Management & Export Section */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-700 space-y-4">
        <h3 className="text-sm font-bold text-white">Storage & Data Management</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          SecretSanitizer operates locally on your machine. You maintain full sovereignty over your
          data, with instant export or complete eradication controls.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportConfig}
            className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Configuration JSON</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Settings to Defaults</span>
          </button>

          <button
            onClick={handleClearAllData}
            className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Erase All Local Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
