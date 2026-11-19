import React, { useState } from 'react';
import {
  Activity,
  Download,
  Trash2,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { SecurityEvent } from '../../types';
import { StorageService } from '../../storage';

interface ActivityCenterTabProps {
  events: SecurityEvent[];
  onRefreshEvents: () => void;
}

export const ActivityCenterTab: React.FC<ActivityCenterTabProps> = ({
  events,
  onRefreshEvents
}) => {
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filterAction === 'all') return true;
    return e.actionTaken === filterAction;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `secretsanitizer-audit-${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Domain', 'Category', 'Rule ID', 'Severity', 'Action Taken', 'Masked Snippet'];
    const rows = events.map((e) => [
      new Date(e.timestamp).toISOString(),
      `"${e.domain}"`,
      `"${e.category}"`,
      `"${e.ruleId}"`,
      `"${e.severity}"`,
      `"${e.actionTaken}"`,
      `"${(e.maskedSnippet || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', encodeURI(csvContent));
    dlAnchorElem.setAttribute('download', `secretsanitizer-audit-${Date.now()}.csv`);
    dlAnchorElem.click();
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your local security event audit logs?')) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['secretsanitizer_events'], () => {
          onRefreshEvents();
        });
      } else {
        localStorage.removeItem('secretsanitizer_events');
        onRefreshEvents();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-dark-850 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Security Activity & Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero raw secret retention: audit trails record only masked identifiers, timestamps, and policy actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportJSON}
            className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={exportCSV}
            className="bg-dark-900 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="bg-dark-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-dark-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-dark-850 p-3 rounded-xl border border-dark-700 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Action Filter:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-dark-900 border border-dark-700 text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Actions</option>
            <option value="sanitized">Sanitized</option>
            <option value="blocked">Blocked</option>
            <option value="bypassed">Bypassed</option>
            <option value="warned">Warned</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono">
          Showing {filteredEvents.length} of {events.length} records
        </div>
      </div>

      {/* Table / Event List */}
      <div className="bg-dark-850 border border-dark-700 rounded-xl overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit records matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900 border-b border-dark-700 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Domain</th>
                  <th className="p-3.5">Detection Rule</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Action Taken</th>
                  <th className="p-3.5">Masked Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200 whitespace-nowrap">
                      {evt.domain}
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">
                      {evt.ruleId}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : evt.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.actionTaken === 'sanitized'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : evt.actionTaken === 'blocked'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {evt.actionTaken}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-300 truncate max-w-[280px]">
                      {evt.maskedSnippet || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
