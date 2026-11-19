import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Flame,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { SystemMetrics, SecurityEvent, ExtensionSettings } from '../../types';

interface OverviewTabProps {
  metrics: SystemMetrics;
  events: SecurityEvent[];
  settings: ExtensionSettings;
  onNavigate: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  events,
  settings,
  onNavigate
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Metric */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-dark-700/80 p-6 shadow-cyber">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Egress Security Core &bull; Local Engine Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              AI Privacy Firewall & Developer Defense
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              SecretSanitizer AI intercepts and neutralizes leaked credentials, infrastructure URIs,
              and sensitive tokens before they transmit to third-party AI platforms or system clipboards.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-dark-900/80 p-4 rounded-xl border border-dark-700">
            <div className="text-center px-3 border-r border-dark-700">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Security Score</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-0.5">{metrics.securityScore}%</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Status</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4" /> Armored
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-850 p-5 rounded-xl border border-dark-700 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Detections</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">{metrics.totalDetections}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">+12%</span> vs last week
            </div>
          </div>
        </div>

        <div className="bg-dark-850 p-5 rounded-xl border border-dark-700 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Exposures Prevented</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-400">{metrics.exposuresPrevented}</div>
            <div className="text-xs text-slate-400 mt-1">Prompt leaks blocked at submit</div>
          </div>
        </div>

        <div className="bg-dark-850 p-5 rounded-xl border border-dark-700 hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sanitizations</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-purple-400">{metrics.totalSanitizations}</div>
            <div className="text-xs text-slate-400 mt-1">Placeholders safely injected</div>
          </div>
        </div>

        <div className="bg-dark-850 p-5 rounded-xl border border-dark-700 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Protected Platforms</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-blue-400">
              {Object.keys(settings.websiteConfigs).length}
            </div>
            <div className="text-xs text-slate-400 mt-1">ChatGPT, Claude, Gemini, +</div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Visual Graph & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Weekly Security Activity
              </h2>
              <span className="text-xs text-slate-400">Last 7 Days</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual breakdown of detected vs prevented secret exposures across all workflows.
            </p>
          </div>

          <div className="mt-8 pt-4">
            <div className="h-44 flex items-end justify-between gap-3 px-2">
              {metrics.weeklyDetections.map((d) => {
                const max = 20;
                const heightPercent = Math.min(100, (d.count / max) * 100);
                const preventedPercent = Math.min(100, (d.prevented / max) * 100);

                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-32">
                      {/* Detections Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-1/2 bg-cyan-500/40 hover:bg-cyan-400 rounded-t transition-all relative"
                        title={`${d.count} Detections`}
                      />
                      {/* Prevented Bar */}
                      <div
                        style={{ height: `${preventedPercent}%` }}
                        className="w-1/2 bg-emerald-500/60 hover:bg-emerald-400 rounded-t transition-all"
                        title={`${d.prevented} Prevented`}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-400 group-hover:text-cyan-400 transition-colors">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-dark-700 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-cyan-500/50" />
                <span>Detected Secrets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/70" />
                <span>Exposures Intercepted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Interceptions</h2>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Full Log <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No security incidents detected yet.
              </div>
            ) : (
              events.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-lg bg-dark-900 border border-dark-700 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{evt.domain}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          evt.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : evt.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-cyan-400 truncate max-w-[200px]">
                      {evt.maskedSnippet || evt.ruleId}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-2 py-1 rounded">
                    {evt.actionTaken}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
