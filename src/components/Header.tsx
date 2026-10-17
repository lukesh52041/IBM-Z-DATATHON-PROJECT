import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Cpu,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Sliders,
  BarChart2,
} from 'lucide-react';
import { RiskTier, DataHealthMetrics } from '../types';

interface HeaderProps {
  currentTier: RiskTier;
  riskScore: number;
  healthMetrics: DataHealthMetrics;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenEvaluation: () => void;
  onOpenAuditLog: () => void;
  onReset: () => void;
  activeAlertCount: number;
  aiEngineStatus: 'gemini-active' | 'rule-engine-fallback';
}

export const Header: React.FC<HeaderProps> = ({
  currentTier,
  riskScore,
  healthMetrics,
  isMuted,
  onToggleMute,
  onOpenEvaluation,
  onOpenAuditLog,
  onReset,
  activeAlertCount,
  aiEngineStatus,
}) => {
  const getStatusColor = () => {
    switch (currentTier) {
      case 'CRITICAL':
        return {
          pill: 'bg-red-500/15 border-red-500/30 text-red-400',
          dot: 'bg-red-500 shadow-[0_0_8px_#ff453a]',
          label: 'Critical Anomaly',
        };
      case 'HIGH':
        return {
          pill: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-500 shadow-[0_0_8px_#ff9f0a]',
          label: 'High Variance',
        };
      case 'MEDIUM':
        return {
          pill: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
          dot: 'bg-yellow-400',
          label: 'Elevated Drift',
        };
      case 'LOW':
      default:
        return {
          pill: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_#30d158]',
          label: 'Nominal State',
        };
    }
  };

  const status = getStatusColor();

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 pb-2 backdrop-blur-2xl bg-black/40 border-b border-white/[0.06] transition-all">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Left: macOS window indicator + Title */}
        <div className="flex items-center gap-3.5">
          {/* Subtle macOS Traffic Lights */}
          <div className="flex items-center gap-1.5 pr-2 hidden sm:flex">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-sm" />
          </div>

          <div className="w-[1px] h-5 bg-white/10 hidden sm:block" />

          {/* Icon & App Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_2px_10px_rgba(10,132,255,0.4)]">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-semibold tracking-[-0.015em] text-white/95">
                  Real-Time AI for Critical Decisions
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-white/[0.08] text-white/70 border border-white/[0.06]">
                  Simulated Stream
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  <Cpu className="w-2.5 h-2.5" />
                  IBM Z / LinuxONE Target
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Apple-style Status Pill */}
        <div className="hidden lg:flex items-center gap-2.5">
          <motion.div
            layout
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${status.pill}`}
          >
            <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
            <span className="tracking-tight">{status.label}</span>
            <span className="font-mono text-[11px] opacity-80">({riskScore}/100)</span>
          </motion.div>

          {/* Engine indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.07] text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-white/45">Advisor:</span>
            <span className="text-white/90">
              {aiEngineStatus === 'gemini-active' ? 'Gemini 3.8 Flash' : 'Expert Rule Model'}
            </span>
          </div>

          {/* Measured Latency */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.07] text-white/70 font-mono">
            <span className="text-white/45">Latency:</span>
            <span className="text-emerald-400 font-semibold">{healthMetrics.avgLatencyMs.toFixed(1)} ms</span>
          </div>
        </div>

        {/* Right: Apple Controls and Menus */}
        <div className="flex items-center gap-1.5">
          {/* Active Alerts Pill Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAuditLog}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeAlertCount > 0
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 shadow-[0_0_12px_rgba(255,69,58,0.2)]'
                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.08]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Alerts</span>
            {activeAlertCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeAlertCount}
              </span>
            )}
          </motion.button>

          {/* Evaluation Modal Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenEvaluation}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.08] transition-all flex items-center gap-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Model Evaluation</span>
          </motion.button>

          {/* Audio Alert Toggle */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onToggleMute}
            className={`p-1.5 rounded-full transition-all border ${
              isMuted
                ? 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25'
            }`}
            title={isMuted ? 'Turn on audio cues' : 'Mute audio cues'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>

          {/* Reset */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onReset}
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white transition-all"
            title="Reset stream to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
