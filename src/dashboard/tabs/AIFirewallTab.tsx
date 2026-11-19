import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { ExtensionSettings, ProtectionMode, WebsiteProtectionConfig } from '../../types';
import { StorageService } from '../../storage';

interface AIFirewallTabProps {
  settings: ExtensionSettings;
  onUpdateSettings: (newSettings: ExtensionSettings) => void;
}

export const AIFirewallTab: React.FC<AIFirewallTabProps> = ({
  settings,
  onUpdateSettings
}) => {
  const updateWebsiteConfig = async (
    domain: string,
    updates: Partial<WebsiteProtectionConfig>
  ) => {
    const current = settings.websiteConfigs[domain] || {
      domain,
      name: domain,
      enabled: true,
      mode: 'review',
      selectorFallback: true,
      interceptionType: 'all'
    };

    const updatedConfigs = {
      ...settings.websiteConfigs,
      [domain]: { ...current, ...updates }
    };

    const updatedSettings = { ...settings, websiteConfigs: updatedConfigs };
    await StorageService.saveSettings({ websiteConfigs: updatedConfigs });
    onUpdateSettings(updatedSettings);
  };

  const platforms = [
    {
      domain: 'chatgpt.com',
      name: 'ChatGPT',
      vendor: 'OpenAI',
      selectors: ['#prompt-textarea', 'button[data-testid="send-button"]'],
      desc: 'Protects prompts and attached code snippets submitted to ChatGPT.'
    },
    {
      domain: 'claude.ai',
      name: 'Claude AI',
      vendor: 'Anthropic',
      selectors: ['div.ProseMirror[contenteditable="true"]', 'button[aria-label="Send Message"]'],
      desc: 'Intercepts ProseMirror editor input and keystrokes on Claude.'
    },
    {
      domain: 'gemini.google.com',
      name: 'Google Gemini',
      vendor: 'Google',
      selectors: ['rich-textarea .ql-editor', 'button.send-button'],
      desc: 'Safeguards Quill rich text area and submit triggers on Google Gemini.'
    },
    {
      domain: 'copilot.microsoft.com',
      name: 'Microsoft Copilot',
      vendor: 'Microsoft',
      selectors: ['textarea#userInput', 'button[aria-label="Submit"]'],
      desc: 'Protects enterprise and standard chat sessions on Copilot.'
    },
    {
      domain: 'perplexity.ai',
      name: 'Perplexity AI',
      vendor: 'Perplexity',
      selectors: ['textarea[placeholder*="Ask"]', 'button[type="submit"]'],
      desc: 'Monitors query boxes and research prompts on Perplexity.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>AI Privacy Firewall Core</span>
          </div>
          <h2 className="text-xl font-bold text-white">Supported AI Platform Adapters</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Each platform features a dedicated DOM adapter engineered to intercept form submissions,
            Enter keystrokes, and synthetic inputs without breaking site accessibility or React/ProseMirror bindings.
          </p>
        </div>

        <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 flex items-center gap-4">
          <div className="text-center px-3 border-r border-dark-700">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Adapters</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{platforms.length}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Health</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Active
            </div>
          </div>
        </div>
      </div>

      {/* Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((p) => {
          const config = settings.websiteConfigs[p.domain] || {
            domain: p.domain,
            name: p.name,
            enabled: true,
            mode: 'review',
            selectorFallback: true,
            interceptionType: 'all'
          };

          return (
            <div
              key={p.domain}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                config.enabled
                  ? 'bg-dark-850 border-dark-700 hover:border-cyan-500/30'
                  : 'bg-dark-900/60 border-dark-800 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-[10px] bg-dark-700 text-slate-300 px-1.5 py-0.5 rounded font-normal">
                          {p.vendor}
                        </span>
                      </h3>
                      <div className="text-xs font-mono text-slate-400">{p.domain}</div>
                    </div>
                  </div>

                  {/* Toggle Enabled */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => updateWebsiteConfig(p.domain, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                  </label>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>

                {/* Target Selectors List */}
                <div className="p-2.5 rounded-lg bg-dark-900 border border-dark-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Target Hooks</div>
                  <div className="truncate text-slate-300">{p.selectors.join(', ')}</div>
                </div>
              </div>

              {/* Protection Mode Selector */}
              <div className="pt-3 border-t border-dark-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Interception Policy:</span>
                <select
                  value={config.mode}
                  onChange={(e) =>
                    updateWebsiteConfig(p.domain, { mode: e.target.value as ProtectionMode })
                  }
                  disabled={!config.enabled}
                  className="bg-dark-900 border border-dark-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="review">Review Before Redaction</option>
                  <option value="automatic">Automatic Redaction</option>
                  <option value="warning">Warning Only</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
