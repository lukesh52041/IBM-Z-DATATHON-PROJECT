import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  XCircle,
  History,
  Shield,
} from 'lucide-react';
import { SystemAlert, RiskTier, AlertStatus } from '../types';

interface PrioritizedAlertListProps {
  alerts: SystemAlert[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string, note?: string) => void;
  onEscalate: (alertId: string, note?: string) => void;
}

export const PrioritizedAlertList: React.FC<PrioritizedAlertListProps> = ({
  alerts,
  onAcknowledge,
  onDismiss,
  onEscalate,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'critical_high'>('active');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [actionModalAlert, setActionModalAlert] = useState<{ id: string; type: 'dismiss' | 'escalate' } | null>(null);
  const [operatorNote, setOperatorNote] = useState('');

  const tierWeight: Record<RiskTier, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    const weightDiff = tierWeight[b.riskTier] - tierWeight[a.riskTier];
    if (weightDiff !== 0) return weightDiff;
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    return b.rowIndex - a.rowIndex;
  });

  const filteredAlerts = sortedAlerts.filter((a) => {
    if (filter === 'active') return a.status === 'active';
    if (filter === 'critical_high') return a.riskTier === 'CRITICAL' || a.riskTier === 'HIGH';
    return true;
  });

  const getTierBadge = (tier: RiskTier, score: number) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            Critical ({score})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High ({score})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
            Medium ({score})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Nominal ({score})
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'acknowledged':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
            Acknowledged
          </span>
        );
      case 'escalated':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
            Escalated
          </span>
        );
      case 'dismissed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-white/50 border border-white/[0.08]">
            Dismissed
          </span>
        );
      case 'active':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
            Action Required
          </span>
        );
    }
  };

  const handleConfirmAction = () => {
    if (!actionModalAlert) return;
    if (actionModalAlert.type === 'dismiss') {
      onDismiss(actionModalAlert.id, operatorNote);
    } else {
      onEscalate(actionModalAlert.id, operatorNote);
    }
    setActionModalAlert(null);
    setOperatorNote('');
  };

  return (
    <div className="apple-glass-card rounded-2xl p-4 flex flex-col h-full shadow-lg">
      {/* Header and Filter segmented control */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold tracking-tight text-white/90">
            Incident Queue & Decision Advisory
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/[0.08] text-white/70">
            {filteredAlerts.length}
          </span>
        </div>

        <div className="flex items-center bg-white/[0.05] p-0.5 rounded-full border border-white/[0.08] text-xs">
          {[
            { id: 'active', label: 'Active' },
            { id: 'critical_high', label: 'Priority' },
            { id: 'all', label: 'All History' },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`relative px-3 py-1 rounded-full text-xs font-medium transition-all z-10 ${
                  isSelected ? 'text-white font-semibold' : 'text-white/60 hover:text-white/90'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-filter-pill"
                    className="absolute inset-0 bg-white/[0.12] rounded-full border border-white/[0.08] -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1 max-h-[500px]">
        {filteredAlerts.length === 0 ? (
          <div className="py-14 text-center text-white/40 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
            No active incidents. Systems are running within nominal parameters.
          </div>
        ) : (
          <AnimatePresence>
            {filteredAlerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`rounded-xl p-3.5 border transition-all ${
                    alert.riskTier === 'CRITICAL' && alert.status === 'active'
                      ? 'bg-red-500/[0.07] border-red-500/30 shadow-[0_2px_12px_rgba(255,69,58,0.12)]'
                      : alert.riskTier === 'HIGH' && alert.status === 'active'
                      ? 'bg-amber-500/[0.06] border-amber-500/25'
                      : alert.status === 'active'
                      ? 'bg-white/[0.04] border-white/[0.08]'
                      : 'bg-white/[0.02] border-white/[0.04] opacity-75'
                  }`}
                >
                  {/* Top Bar of Alert */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getTierBadge(alert.riskTier, alert.riskScore)}
                      <span className="text-xs font-semibold text-white/95 capitalize">
                        {alert.primaryEvent.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-white/40">
                        {alert.sourceId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(alert.status)}
                      <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/30" />
                        {alert.timestamp.split('T')[1]?.replace('Z', '')}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Card (Apple Intelligence style suggestion) */}
                  <div className="apple-glass rounded-xl p-3 my-2 border border-white/[0.08]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-white/60 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        Operational Recommendation
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-white/60">
                        {alert.recommendationSource === 'gemini-3.8-flash'
                          ? 'Gemini 3.8 Flash'
                          : 'Deterministic Model'}
                      </span>
                    </div>
                    <p className="text-[13px] text-white/90 leading-relaxed font-normal">
                      {alert.recommendedAction}
                    </p>
                  </div>

                  {/* Signal Drivers & Measured Latency */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.05] text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-white/40 text-[10px]">Drivers:</span>
                      {alert.topContributingSignals.map((sig) => (
                        <span
                          key={sig.signal}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.05] border border-white/[0.06] text-white/70 font-mono"
                        >
                          {sig.name} ({sig.contributionPct}%)
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-white/40 text-[10px]">
                        Latency: <strong className="text-emerald-400">{alert.detectionLatencyMs.toFixed(1)} ms</strong>
                      </span>
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="text-white/40 hover:text-white p-0.5 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Human-in-the-Loop Operator Decision Buttons */}
                  {alert.status === 'active' && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] text-white/40 mr-auto italic">
                        Operator confirmation required
                      </span>

                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onAcknowledge(alert.id)}
                        className="px-3.5 py-1.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(10,132,255,0.3)]"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setActionModalAlert({ id: alert.id, type: 'escalate' })}
                        className="px-3 py-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1 transition-all"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setActionModalAlert({ id: alert.id, type: 'dismiss' })}
                        className="px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-xs font-medium border border-white/[0.08] transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </motion.button>
                    </div>
                  )}

                  {/* Expanded Audit History */}
                  {isExpanded && alert.history && alert.history.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-2.5 border-t border-white/[0.06] text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-semibold mb-1">
                        <History className="w-3 h-3 text-blue-400" />
                        <span>Event Audit Trail</span>
                      </div>
                      {alert.history.map((hist, idx) => (
                        <div key={idx} className="text-[11px] text-white/60 flex items-start gap-2">
                          <span className="text-white/40">
                            {hist.timestamp.split('T')[1]?.replace('Z', '')}
                          </span>
                          <span className="text-blue-400 font-medium">[{hist.operator}]</span>
                          <span className="uppercase text-white/80">{hist.action}</span>
                          {hist.note && <span className="text-white/50 italic">"{hist.note}"</span>}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Operator Modal (Apple Sheet style) */}
      <AnimatePresence>
        {actionModalAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="apple-glass rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10"
            >
              <h3 className="text-base font-semibold text-white mb-1.5">
                {actionModalAlert.type === 'dismiss' ? 'Dismiss Advisory' : 'Escalate to Supervisor'}
              </h3>
              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                {actionModalAlert.type === 'dismiss'
                  ? 'Record operator rationale for dismissing this notification.'
                  : 'Dispatches incident packet to engineering supervisor and logs action.'}
              </p>

              <textarea
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                placeholder="Optional operator note..."
                className="w-full h-24 bg-white/[0.04] border border-white/[0.1] rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 transition-all mb-4"
              />

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => {
                    setActionModalAlert(null);
                    setOperatorNote('');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 rounded-full text-xs font-semibold text-white transition-all shadow-md ${
                    actionModalAlert.type === 'dismiss'
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-purple-600 hover:bg-purple-500 shadow-[0_2px_12px_rgba(191,90,242,0.4)]'
                  }`}
                >
                  Confirm {actionModalAlert.type === 'dismiss' ? 'Dismiss' : 'Escalate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
