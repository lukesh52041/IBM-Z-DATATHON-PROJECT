import React from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, FileSpreadsheet, Download } from 'lucide-react';
import { ConfusionMatrixMetrics } from '../types';

interface ModelEvaluationModalProps {
  metrics: ConfusionMatrixMetrics;
  onClose: () => void;
  currentRowIndex: number;
}

export const ModelEvaluationModal: React.FC<ModelEvaluationModalProps> = ({
  metrics,
  onClose,
  currentRowIndex,
}) => {
  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      rowsEvaluated: metrics.totalProcessed,
      confusionMatrix: {
        truePositives: metrics.truePositives,
        falsePositives: metrics.falsePositives,
        trueNegatives: metrics.trueNegatives,
        falseNegatives: metrics.falseNegatives,
      },
      evaluationMetrics: {
        precisionPct: metrics.precision,
        recallPct: metrics.recall,
        f1ScorePct: metrics.f1Score,
        falseAlarmRatePct: metrics.falseAlarmRate,
      },
      labeledEpisodes: [
        { episode: 'overheat', rows: '65-95', status: currentRowIndex >= 65 ? 'evaluated' : 'pending' },
        { episode: 'vibration_spike', rows: '155-185', status: currentRowIndex >= 155 ? 'evaluated' : 'pending' },
        { episode: 'pressure_drop', rows: '225-260', status: currentRowIndex >= 225 ? 'evaluated' : 'pending' },
      ],
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-evaluation-report-row-${currentRowIndex + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="apple-glass rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Model Evaluation & Confusion Matrix
              </h2>
              <p className="text-xs text-white/50">
                Ground truth benchmark validation against CSV label annotations
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">
                Precision
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {metrics.precision}%
              </span>
              <span className="text-[10px] text-white/30 font-mono block mt-0.5">
                TP / (TP + FP)
              </span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">
                Recall
              </span>
              <span className="text-2xl font-bold font-mono text-blue-400">
                {metrics.recall}%
              </span>
              <span className="text-[10px] text-white/30 font-mono block mt-0.5">
                TP / (TP + FN)
              </span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">
                F1 Score
              </span>
              <span className="text-2xl font-bold font-mono text-indigo-400">
                {metrics.f1Score}%
              </span>
              <span className="text-[10px] text-white/30 font-mono block mt-0.5">
                Harmonic Mean
              </span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">
                False Alarms
              </span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {metrics.falseAlarmRate}%
              </span>
              <span className="text-[10px] text-white/30 font-mono block mt-0.5">
                FP / (FP + TN)
              </span>
            </div>
          </div>

          {/* 2x2 Confusion Matrix */}
          <div className="apple-glass-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/80 tracking-tight mb-3">
              Confusion Matrix ({metrics.totalProcessed} Rows Evaluated)
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between text-emerald-400 font-medium mb-1">
                  <span>True Positives (TP)</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {metrics.truePositives}
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-1">
                  Real anomalies accurately flagged
                </p>
              </div>

              <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between text-amber-400 font-medium mb-1">
                  <span>False Positives (FP)</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {metrics.falsePositives}
                </div>
                <p className="text-[10px] text-amber-400/80 mt-1">
                  Alerts during nominal baseline
                </p>
              </div>

              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between text-red-400 font-medium mb-1">
                  <span>False Negatives (FN)</span>
                  <X className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {metrics.falseNegatives}
                </div>
                <p className="text-[10px] text-red-400/80 mt-1">
                  Missed labeled anomalies
                </p>
              </div>

              <div className="bg-blue-500/[0.08] border border-blue-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between text-blue-400 font-medium mb-1">
                  <span>True Negatives (TN)</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {metrics.trueNegatives}
                </div>
                <p className="text-[10px] text-blue-400/80 mt-1">
                  Correctly identified nominal state
                </p>
              </div>
            </div>
          </div>

          {/* Episode Tracker */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/80 tracking-tight">
              Labeled Ground Truth Anomaly Episodes
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <span className="text-amber-400 font-medium">1. Thermal Overheat</span>
                  <span className="text-white/40 ml-2 font-mono text-[11px]">Rows 65–95 (31s)</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentRowIndex >= 95
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : currentRowIndex >= 65
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                      : 'bg-white/[0.05] text-white/40'
                  }`}
                >
                  {currentRowIndex >= 95 ? 'Evaluated' : currentRowIndex >= 65 ? 'Active Frame' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <span className="text-purple-400 font-medium">2. Vibration Spike</span>
                  <span className="text-white/40 ml-2 font-mono text-[11px]">Rows 155–185 (31s)</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentRowIndex >= 185
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : currentRowIndex >= 155
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse'
                      : 'bg-white/[0.05] text-white/40'
                  }`}
                >
                  {currentRowIndex >= 185 ? 'Evaluated' : currentRowIndex >= 155 ? 'Active Frame' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <span className="text-rose-400 font-medium">3. Hydraulic Pressure Drop</span>
                  <span className="text-white/40 ml-2 font-mono text-[11px]">Rows 225–260 (36s)</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentRowIndex >= 260
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : currentRowIndex >= 225
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                      : 'bg-white/[0.05] text-white/40'
                  }`}
                >
                  {currentRowIndex >= 260 ? 'Evaluated' : currentRowIndex >= 225 ? 'Active Frame' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={exportReport}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Report</span>
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
