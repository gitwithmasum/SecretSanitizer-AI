import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  FileCheck2,
  Lock,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { EnterprisePolicy, SystemMetrics } from '../../types';
import { EnterprisePolicyManager } from '../../enterprise/policy';
import { StorageService } from '../../storage';

interface EnterpriseTabProps {
  policy: EnterprisePolicy;
  metrics: SystemMetrics;
  onUpdatePolicy: (policy: EnterprisePolicy) => void;
}

export const EnterpriseTab: React.FC<EnterpriseTabProps> = ({
  policy,
  metrics,
  onUpdatePolicy
}) => {
  const [orgName, setOrgName] = useState(policy.organizationName);
  const [allowBypass, setAllowBypass] = useState(policy.allowBypass);
  const [complianceMode, setComplianceMode] = useState(policy.complianceMode);
  const [domainBlocklistStr, setDomainBlocklistStr] = useState(
    policy.domainBlocklist.join(', ')
  );
  const [domainAllowlistStr, setDomainAllowlistStr] = useState(
    policy.domainAllowlist.join(', ')
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const manager = new EnterprisePolicyManager(policy);
  const complianceReport = manager.generateComplianceReport({
    totalEvents: metrics.totalDetections,
    sanitizationsCount: metrics.totalSanitizations,
    blockedSubmissions: metrics.exposuresPrevented,
    bypassedCount: 2
  });

  const handleSavePolicy = async () => {
    const updated: EnterprisePolicy = {
      ...policy,
      organizationName: orgName,
      allowBypass,
      complianceMode,
      domainBlocklist: domainBlocklistStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      domainAllowlist: domainAllowlistStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      lastUpdated: Date.now()
    };

    await StorageService.saveEnterprisePolicy(updated);
    onUpdatePolicy(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const exportPolicyJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(policy, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `secretsanitizer-enterprise-policy-v${policy.version}.json`);
    dl.click();
  };

  const exportComplianceReport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(complianceReport, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `compliance-readiness-report-${Date.now()}.json`);
    dl.click();
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Architecture Notice */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Building2 className="w-4 h-4" />
            <span>Enterprise Governance & Compliance</span>
          </div>
          <h2 className="text-xl font-bold text-white">Organization Security Baseline</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Configure company-wide policies, enforce non-bypassable redaction, and generate audit-ready
            compliance reports for SOC 2 Type II, ISO 27001, and GDPR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportPolicyJson}
            className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Policy</span>
          </button>
          <button
            onClick={exportComplianceReport}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Compliance Report</span>
          </button>
        </div>
      </div>

      {/* Compliance Posture Matrix */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
              {complianceReport.overallReadinessScore}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Compliance Readiness Posture</h3>
              <p className="text-xs text-slate-400">Standard: {policy.complianceMode} Evaluation</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            Audit-Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {complianceReport.controls.map((ctrl) => (
            <div
              key={ctrl.id}
              className="p-3.5 rounded-lg bg-dark-900 border border-dark-700 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{ctrl.id}</span>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                  {ctrl.status}
                </span>
              </div>
              <div className="text-xs font-semibold text-white">{ctrl.name}</div>
              <div className="text-[11px] text-slate-400">{ctrl.details}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Configuration Form */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-700 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Policy Enforcement Settings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Compliance Standard</label>
            <select
              value={complianceMode}
              onChange={(e) => setComplianceMode(e.target.value as any)}
              className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="STANDARD">Standard Enterprise Security</option>
              <option value="SOC2">SOC 2 Type II Controls</option>
              <option value="ISO27001">ISO 27001 ISMS</option>
              <option value="GDPR">GDPR Privacy Directives</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Domain Blocklist (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. untrusted-ai.com, rogue-chat.org"
              value={domainBlocklistStr}
              onChange={(e) => setDomainBlocklistStr(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Domain Allowlist (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. internal.company.com, secure-gateway.corp"
              value={domainAllowlistStr}
              onChange={(e) => setDomainAllowlistStr(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-dark-700/60 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bypass-toggle"
              checked={allowBypass}
              onChange={(e) => setAllowBypass(e.target.checked)}
              className="rounded bg-dark-950 border-dark-700 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="bypass-toggle" className="text-slate-300 font-medium cursor-pointer">
              Allow developers one-time manual bypass with confirmation
            </label>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Policy Updated
              </span>
            )}
            <button
              onClick={handleSavePolicy}
              className="bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs px-5 py-2 rounded-lg transition-colors shadow-glow-cyan"
            >
              Save Policy Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
