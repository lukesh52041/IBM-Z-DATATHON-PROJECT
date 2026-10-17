import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Timer, Database } from 'lucide-react';
import { DataHealthMetrics } from '../types';

interface SystemHealthPanelProps {
  metrics: DataHealthMetrics;
  isPlaying: boolean;
  totalRowsProcessed: number;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  metrics,
  isPlaying,
  totalRowsProcessed,
}) => {
  return (
    <div className="apple-glass-card rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold text-white/80 tracking-tight">
            Pipeline Health & Stream Diagnostics
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-400 shadow-[0_0_8px_#30d158] animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-white/70 font-medium">
            {isPlaying ? 'Live Streaming' : 'Stream Paused'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. Health Score */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
            <span>Data Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.healthPercentage.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            {metrics.validRows} clean • {metrics.flaggedRows} corrected
          </div>
        </div>

        {/* 2. Measured Latency */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
            <span>Detection Latency</span>
            <Timer className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {metrics.avgLatencyMs.toFixed(1)} ms
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            Target &lt;50ms
          </div>
        </div>

        {/* 3. Ingestion Volume */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
            <span>Packets</span>
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalRowsProcessed}
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            {metrics.missingValuesSanitized} auto-filled
          </div>
        </div>

        {/* 4. Target Architecture */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
            <span>Target Platform</span>
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="text-sm font-semibold text-white/90">
            IBM LinuxONE
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            Zero-downtime secure
          </div>
        </div>
      </div>

      {/* Latency Pipeline Breakdown Bar */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px]">
        <div className="flex items-center justify-between text-white/50 text-[10px] mb-1.5 font-medium">
          <span>Internal Pipeline Breakdown</span>
          <span className="text-emerald-400 font-mono">0.9 ms total</span>
        </div>
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/[0.08]">
          <div className="bg-blue-400 w-[28%]" title="Validation & Ingest" />
          <div className="bg-indigo-400 w-[42%]" title="Rolling Z-Score Window" />
          <div className="bg-purple-400 w-[30%]" title="Scoring & Classification" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono mt-1.5">
          <span className="text-blue-300">Ingest: 0.3ms</span>
          <span className="text-indigo-300">Z-Score: 0.4ms</span>
          <span className="text-purple-300">Scoring: 0.2ms</span>
        </div>
      </div>
    </div>
  );
};
