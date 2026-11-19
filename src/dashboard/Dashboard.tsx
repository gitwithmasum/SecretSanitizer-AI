import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileCode,
  Globe,
  Clipboard,
  ShieldAlert,
  Activity,
  Code,
  Building2,
  Sliders,
  HelpCircle,
  ExternalLink,
  Power,
  ChevronRight
} from 'lucide-react';
import {
  ExtensionSettings,
  SystemMetrics,
  SecurityEvent,
  CustomRule,
  EnterprisePolicy
} from '../types';
import { StorageService } from '../storage';
import { OverviewTab } from './tabs/OverviewTab';
import { CodeScannerTab } from './tabs/CodeScannerTab';
import { AIFirewallTab } from './tabs/AIFirewallTab';
import { ClipboardTab } from './tabs/ClipboardTab';
import { DetectionCenterTab } from './tabs/DetectionCenterTab';
import { ActivityCenterTab } from './tabs/ActivityCenterTab';
import { CustomRulesTab } from './tabs/CustomRulesTab';
import { EnterpriseTab } from './tabs/EnterpriseTab';
import { SettingsTab } from './tabs/SettingsTab';
import { OnboardingModal } from './tabs/OnboardingModal';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [enterprisePolicy, setEnterprisePolicy] = useState<EnterprisePolicy | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    // Check URL parameters for active tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      if (tabParam === 'onboarding') {
        setShowOnboarding(true);
      } else {
        setActiveTab(tabParam);
      }
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const s = await StorageService.getSettings();
    const m = await StorageService.getMetrics();
    const evts = await StorageService.getEvents();
    const rules = await StorageService.getCustomRules();
    const policy = await StorageService.getEnterprisePolicy();

    setSettings(s);
    setMetrics(m);
    setEvents(evts);
    setCustomRules(rules);
    setEnterprisePolicy(policy);

    if (!s.onboardingCompleted && !window.location.search.includes('tab=')) {
      setShowOnboarding(true);
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

  if (!settings || !metrics || !enterprisePolicy) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing SecretSanitizer AI Security Engine...
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'scanner', label: 'Code Scanner', icon: FileCode },
    { id: 'firewall', label: 'AI Firewall', icon: Globe },
    { id: 'clipboard', label: 'Clipboard Guardian', icon: Clipboard },
    { id: 'detection', label: 'Detection Center', icon: ShieldAlert },
    { id: 'activity', label: 'Activity Center', icon: Activity },
    { id: 'rules', label: 'Custom Rules', icon: Code },
    { id: 'enterprise', label: 'Enterprise', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Sliders }
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Navbar */}
      <header className="h-16 border-b border-dark-700 bg-dark-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              SecretSanitizer <span className="text-xs bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">AI</span>
            </div>
            <div className="text-[11px] text-slate-400">Enterprise AI Privacy Firewall & Developer Security</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOnboarding(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Guided Tour</span>
          </button>

          {/* Master Killswitch Button */}
          <button
            onClick={toggleMaster}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              settings.masterEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{settings.masterEnabled ? 'FIREWALL ACTIVE' : 'FIREWALL PAUSED'}</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Left Sidebar Navigation */}
        <aside className="w-60 flex-shrink-0 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            );
          })}

          <div className="pt-6 px-3">
            <div className="p-3.5 rounded-xl bg-dark-850 border border-dark-700/80 space-y-2">
              <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Local Engine</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero cloud egress. 100% deterministic pattern heuristics & Shannon entropy analysis.
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              metrics={metrics}
              events={events}
              settings={settings}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'scanner' && <CodeScannerTab />}
          {activeTab === 'firewall' && (
            <AIFirewallTab settings={settings} onUpdateSettings={setSettings} />
          )}
          {activeTab === 'clipboard' && (
            <ClipboardTab settings={settings} onUpdateSettings={setSettings} />
          )}
          {activeTab === 'detection' && <DetectionCenterTab />}
          {activeTab === 'activity' && (
            <ActivityCenterTab
              events={events}
              onRefreshEvents={async () => {
                const fresh = await StorageService.getEvents();
                setEvents(fresh);
              }}
            />
          )}
          {activeTab === 'rules' && (
            <CustomRulesTab
              customRules={customRules}
              onRefreshRules={async () => {
                const fresh = await StorageService.getCustomRules();
                setCustomRules(fresh);
              }}
            />
          )}
          {activeTab === 'enterprise' && (
            <EnterpriseTab
              policy={enterprisePolicy}
              metrics={metrics}
              onUpdatePolicy={setEnterprisePolicy}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} onUpdateSettings={setSettings} />
          )}
        </main>
      </div>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingModal
          settings={settings}
          onUpdateSettings={setSettings}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};
