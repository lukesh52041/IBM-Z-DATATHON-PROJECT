import React from 'react';
import { motion } from 'motion/react';
import { X, History, Download, Clock } from 'lucide-react';
import { SystemAlert } from '../types';

interface AuditLogModalProps {
  alerts: SystemAlert[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ alerts, onClose }) => {
  const exportAuditLog = () => {
    const csvContent =
      'timestamp,alert_id,source_id,risk_tier,risk_score,primary_event,action,operator,note\n' +
      alerts
        .flatMap((a) =>
          a.history && a.history.length > 0
            ? a.history.map(
                (h) =>
                  `"${h.timestamp}","${a.id}","${a.sourceId}","${a.riskTier}","${a.riskScore}","${a.primaryEvent}","${h.action}","${h.operator}","${(h.note || '').replace(/"/g, '""')}"`
              )
            : [
                `"${a.timestamp}","${a.id}","${a.sourceId}","${a.riskTier}","${a.riskScore}","${a.primaryEvent}","CREATED","SYSTEM",""`
              ]
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-support-audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="apple-glass rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-white/10 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Operator Action & Decision Audit Trail
              </h2>
              <p className="text-xs text-white/50">
                Chronological log of alerts, supervisor acknowledgments, and mitigations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {alerts.length === 0 ? (
            <div className="py-14 text-center text-white/40 text-xs">
              No alerts or operator actions recorded yet.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="apple-glass-card rounded-xl p-3.5 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        alert.riskTier === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : alert.riskTier === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {alert.riskTier} ({alert.riskScore})
                    </span>
                    <span className="font-semibold text-white capitalize">
                      {alert.primaryEvent.replace('_', ' ')}
                    </span>
                    <span className="text-white/40 font-mono text-[11px]">{alert.sourceId}</span>
                  </div>

                  <span className="text-white/40 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/30" />
                    {alert.timestamp}
                  </span>
                </div>

                <div className="text-white/85 text-[12px] bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] leading-relaxed">
                  <span className="text-blue-300 font-medium">Directive: </span>
                  {alert.recommendedAction}
                </div>

                {/* History items */}
                <div className="space-y-1 pt-1.5 border-t border-white/[0.05] font-mono">
                  {alert.history.map((hist, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-white/60">
                      <span className="text-white/35">{hist.timestamp.split('T')[1]?.replace('Z', '')}</span>
                      <span className="text-blue-400 font-medium">[{hist.operator}]</span>
                      <span className="uppercase text-white font-medium">{hist.action}</span>
                      {hist.note && <span className="text-white/50 italic font-sans">"{hist.note}"</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={exportAuditLog}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-white transition-all shadow-[0_1px_6px_rgba(10,132,255,0.4)]"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
