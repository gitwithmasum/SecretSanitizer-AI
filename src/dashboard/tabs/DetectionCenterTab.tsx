import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Key,
  Lock,
  Database,
  UserCheck,
  Code,
  Info,
  ChevronDown
} from 'lucide-react';
import { BUILTIN_RULES } from '../../scanner/rules';
import { SecretSeverity, SecretCategory, DetectionRule } from '../../types';

export const DetectionCenterTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const filteredRules = BUILTIN_RULES.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.explanation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      selectedSeverity === 'all' || rule.severity === selectedSeverity;
    const matchesCategory =
      selectedCategory === 'all' || rule.category === selectedCategory;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getCategoryIcon = (cat: SecretCategory) => {
    switch (cat) {
      case 'api_credential':
        return <Key className="w-4 h-4 text-cyan-400" />;
      case 'auth_secret':
        return <Lock className="w-4 h-4 text-purple-400" />;
      case 'infrastructure_secret':
        return <Database className="w-4 h-4 text-amber-400" />;
      case 'pii_business':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Code className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>Detection Rule Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect active detection signatures, regex heuristics, and remediation advisories.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Total Signatures:</span>
          <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            {BUILTIN_RULES.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-dark-850 p-4 rounded-xl border border-dark-700 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rules by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            <option value="api_credential">API Credentials</option>
            <option value="auth_secret">Auth Secrets</option>
            <option value="infrastructure_secret">Infrastructure</option>
            <option value="pii_business">PII & Business</option>
          </select>
        </div>
      </div>

      {/* Rules Accordion / Cards */}
      <div className="space-y-3">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;

          return (
            <div
              key={rule.id}
              className="bg-dark-850 border border-dark-700 rounded-xl overflow-hidden hover:border-dark-600 transition-colors"
            >
              <div
                onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-dark-900 border border-dark-800">
                    {getCategoryIcon(rule.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{rule.name}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          rule.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : rule.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">{rule.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400 bg-dark-900 px-2 py-1 rounded border border-dark-800 hidden sm:inline">
                    {rule.placeholder}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t border-dark-700/80 bg-dark-900/60 space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Security Explanation:</span>
                    <p className="text-slate-300 leading-relaxed">{rule.explanation}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 space-y-1">
                    <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Remediation Recommendation:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rule.remediation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
