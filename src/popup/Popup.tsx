import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Power,
  Globe,
  Sliders,
  ExternalLink,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../storage';
import { ExtensionSettings, SystemMetrics, SecurityEvent } from '../types';

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [currentTabInfo, setCurrentTabInfo] = useState<{
    hostname: string;
    platformName: string;
    isSupported: boolean;
  }>({
    hostname: 'Loading...',
    platformName: 'Scanning...',
    isSupported: false
  });
  const [quickScanText, setQuickScanText] = useState('');
  const [quickScanCount, setQuickScanCount] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    detectActiveTab();
  }, []);

  const loadData = async () => {
    const s = await StorageService.getSettings();
    const m = await StorageService.getMetrics();
    const evts = await StorageService.getEvents();
    setSettings(s);
    setMetrics(m);
    setRecentEvents(evts.slice(0, 3));
  };

  const detectActiveTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            const host = url.hostname;
            let name = 'Web Page';
            let supported = false;

            if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) {
              name = 'ChatGPT';
              supported = true;
            } else if (host.includes('claude.ai')) {
              name = 'Claude AI';
              supported = true;
            } else if (host.includes('gemini.google.com')) {
              name = 'Google Gemini';
              supported = true;
            } else if (host.includes('copilot.microsoft.com')) {
              name = 'Microsoft Copilot';
              supported = true;
            } else if (host.includes('perplexity.ai')) {
              name = 'Perplexity AI';
              supported = true;
            }

            setCurrentTabInfo({
              hostname: host,
              platformName: name,
              isSupported: supported
            });
          } catch {
            setCurrentTabInfo({
              hostname: 'Internal Browser Tab',
              platformName: 'Browser System',
              isSupported: false
            });
          }
        }
      });
    } else {
      setCurrentTabInfo({
        hostname: 'chatgpt.com',
        platformName: 'ChatGPT (Preview)',
        isSupported: true
      });
    }
  };

  const toggleMaster = async () => {
    if (!settings) return;
    const updated = !settings.masterEnabled;
    await StorageService.saveSettings({ masterEnabled: updated });
    setSettings({ ...settings, masterEnabled: updated });

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'UPDATE_MASTER_STATUS', enabled: updated });
    }
  };

  const openDashboard = (tab?: string) => {
    const url = `dashboard.html${tab ? `?tab=${tab}` : ''}`;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL(url) });
    } else {
      window.open(url, '_blank');
    }
  };

  const handleQuickScan = () => {
    if (!quickScanText.trim()) return;
    // Fast count heuristic for popup
    const matches = quickScanText.match(/(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|postgres:\/\/|password\s*[:=])/g);
    setQuickScanCount(matches ? matches.length : 0);
  };

  if (!settings) return <div className="p-6 text-slate-400 bg-dark-900">Loading firewall state...</div>;

  return (
    <div className="w-[380px] bg-dark-900 text-slate-100 border border-dark-700 shadow-cyber font-sans select-none flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-700/80 bg-gradient-to-r from-dark-850 via-dark-900 to-dark-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              SecretSanitizer <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">AI</span>
            </div>
            <div className="text-[11px] text-slate-400">Next-Gen Privacy Firewall</div>
          </div>
        </div>

        {/* Master Power Toggle */}
        <button
          onClick={toggleMaster}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            settings.masterEnabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
          title="Toggle Global Extension Protection"
        >
          <Power className="w-3.5 h-3.5" />
          <span>{settings.masterEnabled ? 'ACTIVE' : 'PAUSED'}</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3.5 flex-1">
        {/* Current Website Status Card */}
        <div className="p-3 rounded-xl bg-dark-850/80 border border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentTabInfo.isSupported ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-400'}`}>
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">{currentTabInfo.platformName}</div>
              <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{currentTabInfo.hostname}</div>
            </div>
          </div>

          <div className="text-right">
            {settings.masterEnabled ? (
              currentTabInfo.isSupported ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Protected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Standard
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                <ShieldAlert className="w-3 h-3" /> Off
              </span>
            )}
          </div>
        </div>

        {/* Security Score & Quick Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Score</div>
            <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
              {metrics?.securityScore || 98}%
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Prevented</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {metrics?.exposuresPrevented || 18}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Redacted</div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
              {metrics?.totalSanitizations || 24}
            </div>
          </div>
        </div>

        {/* Quick Scan Input */}
        <div className="p-3 rounded-xl bg-dark-850/60 border border-dark-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Quick Text Inspector
            </span>
            {quickScanCount !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${quickScanCount > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {quickScanCount > 0 ? `${quickScanCount} SECRETS FOUND` : 'CLEAN'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste code or key snippet to scan..."
              value={quickScanText}
              onChange={(e) => {
                setQuickScanText(e.target.value);
                setQuickScanCount(null);
              }}
              className="flex-1 bg-dark-950 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleQuickScan}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all"
            >
              Scan
            </button>
          </div>
        </div>

        {/* Recent Detections Mini-List */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Activity</span>
            <button
              onClick={() => openDashboard('activity')}
              className="text-cyan-400 hover:text-cyan-300 lowercase text-[11px] flex items-center gap-0.5"
            >
              view all &rarr;
            </button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-[11px] text-slate-500 text-center py-2 bg-dark-850/40 rounded-lg border border-dark-700/50">
              No recent leaks intercepted. System secure.
            </div>
          ) : (
            recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2 rounded-lg bg-dark-850/80 border border-dark-700 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <Flame className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="text-slate-300 truncate max-w-[170px]">{evt.maskedSnippet || evt.ruleId}</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono uppercase bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {evt.actionTaken}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-dark-700 bg-dark-950 flex items-center justify-between">
        <button
          onClick={() => openDashboard('scanner')}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Code Scanner
        </button>

        <button
          onClick={() => openDashboard('overview')}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-glow-cyan transition-all"
        >
          <span>Open Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
