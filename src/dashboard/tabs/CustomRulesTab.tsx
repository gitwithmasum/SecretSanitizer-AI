import React, { useState } from 'react';
import {
  Code,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Play,
  Shield
} from 'lucide-react';
import { CustomRule, SecretSeverity, SecretCategory } from '../../types';
import { StorageService } from '../../storage';
import { validateCustomRegex } from '../../scanner/rules';

interface CustomRulesTabProps {
  customRules: CustomRule[];
  onRefreshRules: () => void;
}

export const CustomRulesTab: React.FC<CustomRulesTabProps> = ({
  customRules,
  onRefreshRules
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [regex, setRegex] = useState('');
  const [category, setCategory] = useState<SecretCategory>('custom');
  const [severity, setSeverity] = useState<SecretSeverity>('high');
  const [placeholder, setPlaceholder] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live test runner state
  const [testString, setTestString] = useState('internal_corp_token_ABCD1234EFGH5678');
  const [testMatchResult, setTestMatchResult] = useState<boolean | null>(null);

  const handleTestRegex = (pattern: string, input: string) => {
    const val = validateCustomRegex(pattern);
    if (!val.valid) {
      setTestMatchResult(false);
      return;
    }
    try {
      const r = new RegExp(pattern);
      setTestMatchResult(r.test(input));
    } catch {
      setTestMatchResult(false);
    }
  };

  const handleSaveRule = async () => {
    setErrorMsg(null);
    if (!name.trim() || !regex.trim()) {
      setErrorMsg('Please enter a valid rule name and regex pattern.');
      return;
    }

    const val = validateCustomRegex(regex);
    if (!val.valid) {
      setErrorMsg(val.error || 'Invalid regex pattern or ReDoS vulnerability detected.');
      return;
    }

    const newRule: CustomRule = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      regex: regex.trim(),
      category,
      severity,
      placeholder: placeholder.trim() || `[REDACTED_${name.toUpperCase().replace(/\s+/g, '_')}]`,
      description: description.trim() || 'User-defined proprietary pattern.',
      enabled: true,
      createdAt: Date.now()
    };

    const updated = [newRule, ...customRules];
    await StorageService.saveCustomRules(updated);
    onRefreshRules();

    // Reset form
    setName('');
    setRegex('');
    setPlaceholder('');
    setDescription('');
    setShowAddModal(false);
  };

  const handleToggleRule = async (ruleId: string) => {
    const updated = customRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    await StorageService.saveCustomRules(updated);
    onRefreshRules();
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Delete this custom detection rule?')) {
      const updated = customRules.filter((r) => r.id !== ruleId);
      await StorageService.saveCustomRules(updated);
      onRefreshRules();
    }
  };

  const exportRules = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(customRules, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `secretsanitizer-custom-rules-${Date.now()}.json`);
    dl.click();
  };

  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const valid = imported.filter((r) => r.id && r.regex && r.name);
          const merged = [...valid, ...customRules];
          await StorageService.saveCustomRules(merged);
          onRefreshRules();
          alert(`Successfully imported ${valid.length} custom rules.`);
        }
      } catch (err: any) {
        alert('Invalid rules JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            <span>Custom Detection Signatures</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Author and enforce proprietary regex rules for company-specific tokens with automated ReDoS protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportRules} className="hidden" />
          </label>

          <button
            onClick={exportRules}
            disabled={customRules.length === 0}
            className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showAddModal && (
        <div className="p-6 rounded-xl bg-dark-900 border border-cyan-500/40 shadow-glow-cyan space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Define New Custom Rule</span>
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Rule Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Internal Auth Token"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Regex Pattern</label>
              <input
                type="text"
                placeholder="e.g. \\bacme_live_[0-9a-zA-Z]{32}\\b"
                value={regex}
                onChange={(e) => {
                  setRegex(e.target.value);
                  handleTestRegex(e.target.value, testString);
                }}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Placeholder</label>
              <input
                type="text"
                placeholder="[REDACTED_ACME_TOKEN]"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SecretSeverity)}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Live Regex Sandbox Tester */}
          <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Pattern Sandbox Tester</span>
              </span>
              {testMatchResult !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    testMatchResult
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {testMatchResult ? 'MATCH CONFIRMED' : 'NO MATCH'}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Test string candidate..."
              value={testString}
              onChange={(e) => {
                setTestString(e.target.value);
                handleTestRegex(regex, e.target.value);
              }}
              className="w-full bg-dark-900 border border-dark-700 rounded p-2 font-mono text-xs text-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="bg-dark-800 text-slate-300 text-xs px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRule}
              className="bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs px-5 py-2 rounded-lg transition-colors"
            >
              Save Custom Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {customRules.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-dark-850 border border-dark-700/60 text-slate-500 text-xs flex flex-col items-center gap-2">
            <Code className="w-8 h-8 text-cyan-500/30" />
            <span>No custom detection rules configured. Click "Create Rule" above.</span>
          </div>
        ) : (
          customRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                rule.enabled ? 'bg-dark-850 border-dark-700' : 'bg-dark-900/60 border-dark-800 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-white">{rule.name}</span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      rule.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300'
                        : rule.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
                <div className="font-mono text-xs text-cyan-400 truncate max-w-md">
                  /{rule.regex}/g
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  &rarr; {rule.placeholder}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule.id)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500" />
                </label>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
