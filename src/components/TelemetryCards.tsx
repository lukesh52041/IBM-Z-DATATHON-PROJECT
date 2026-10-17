import React from 'react';
import { motion } from 'motion/react';
import { Flame, Zap, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ValidatedSensorRow, SignalContribution } from '../types';

interface TelemetryCardsProps {
  currentRow: ValidatedSensorRow;
  contributions: SignalContribution[];
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ currentRow, contributions }) => {
  const tempContrib = contributions.find((c) => c.signal === 'temperature');
  const vibContrib = contributions.find((c) => c.signal === 'vibration');
  const pressContrib = contributions.find((c) => c.signal === 'pressure');

  const getStatusBadge = (status: 'nominal' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-2.5 h-2.5" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-2.5 h-2.5" />
            Elevated
          </span>
        );
      case 'nominal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Nominal
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Thermal Core Card */}
      <motion.div
        layout
        className={`apple-glass-card rounded-2xl p-4 transition-all relative overflow-hidden ${
          tempContrib?.status === 'critical'
            ? 'border-red-500/40 shadow-[0_4px_24px_rgba(255,69,58,0.15)]'
            : tempContrib?.status === 'warning'
            ? 'border-amber-500/30 shadow-[0_4px_20px_rgba(255,159,10,0.1)]'
            : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white/90">Temperature</h3>
              <p className="text-[11px] text-white/40">Thermal Core TE-01</p>
            </div>
          </div>
          {getStatusBadge(tempContrib?.status || 'nominal')}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-bold tracking-tight font-mono ${
                tempContrib?.status === 'critical'
                  ? 'text-red-400'
                  : tempContrib?.status === 'warning'
                  ? 'text-amber-300'
                  : 'text-white'
              }`}
            >
              {currentRow.temperature_c.toFixed(1)}
            </span>
            <span className="text-xs text-white/40 font-mono">°C</span>
          </div>

          <div className="text-right font-mono text-[11px]">
            <span className="text-white/40 text-[10px] block">Deviation</span>
            <span
              className={`font-semibold ${
                Math.abs(tempContrib?.zScore || 0) >= 3
                  ? 'text-red-400'
                  : Math.abs(tempContrib?.zScore || 0) >= 2
                  ? 'text-amber-400'
                  : 'text-white/60'
              }`}
            >
              {(tempContrib?.zScore || 0) > 0 ? `+${tempContrib?.zScore.toFixed(2)}` : tempContrib?.zScore.toFixed(2)}σ
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
          <span>Baseline: ~70.0°C</span>
          <span>Warn: &gt;82°C • Crit: &gt;95°C</span>
        </div>
      </motion.div>

      {/* 2. Vibration Card */}
      <motion.div
        layout
        className={`apple-glass-card rounded-2xl p-4 transition-all relative overflow-hidden ${
          vibContrib?.status === 'critical'
            ? 'border-purple-500/40 shadow-[0_4px_24px_rgba(191,90,242,0.15)]'
            : vibContrib?.status === 'warning'
            ? 'border-purple-500/30 shadow-[0_4px_20px_rgba(191,90,242,0.1)]'
            : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white/90">Vibration</h3>
              <p className="text-[11px] text-white/40">Shaft Accelerometer VE-02</p>
            </div>
          </div>
          {getStatusBadge(vibContrib?.status || 'nominal')}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-bold tracking-tight font-mono ${
                vibContrib?.status === 'critical'
                  ? 'text-purple-300'
                  : vibContrib?.status === 'warning'
                  ? 'text-purple-200'
                  : 'text-white'
              }`}
            >
              {currentRow.vibration_g.toFixed(2)}
            </span>
            <span className="text-xs text-white/40 font-mono">g</span>
          </div>

          <div className="text-right font-mono text-[11px]">
            <span className="text-white/40 text-[10px] block">Deviation</span>
            <span
              className={`font-semibold ${
                Math.abs(vibContrib?.zScore || 0) >= 3
                  ? 'text-purple-400'
                  : Math.abs(vibContrib?.zScore || 0) >= 2
                  ? 'text-purple-300'
                  : 'text-white/60'
              }`}
            >
              {(vibContrib?.zScore || 0) > 0 ? `+${vibContrib?.zScore.toFixed(2)}` : vibContrib?.zScore.toFixed(2)}σ
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
          <span>Baseline: ~1.05g</span>
          <span>Warn: &gt;2.8g • Crit: &gt;4.5g</span>
        </div>
      </motion.div>

      {/* 3. Hydraulic Pressure Card */}
      <motion.div
        layout
        className={`apple-glass-card rounded-2xl p-4 transition-all relative overflow-hidden ${
          pressContrib?.status === 'critical'
            ? 'border-blue-500/40 shadow-[0_4px_24px_rgba(10,132,255,0.15)]'
            : pressContrib?.status === 'warning'
            ? 'border-blue-500/30 shadow-[0_4px_20px_rgba(10,132,255,0.1)]'
            : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white/90">Pressure</h3>
              <p className="text-[11px] text-white/40">Intake Hydraulics PT-03</p>
            </div>
          </div>
          {getStatusBadge(pressContrib?.status || 'nominal')}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-bold tracking-tight font-mono ${
                pressContrib?.status === 'critical'
                  ? 'text-blue-300'
                  : pressContrib?.status === 'warning'
                  ? 'text-blue-200'
                  : 'text-white'
              }`}
            >
              {currentRow.pressure_kpa.toFixed(1)}
            </span>
            <span className="text-xs text-white/40 font-mono">kPa</span>
          </div>

          <div className="text-right font-mono text-[11px]">
            <span className="text-white/40 text-[10px] block">Deviation</span>
            <span
              className={`font-semibold ${
                Math.abs(pressContrib?.zScore || 0) >= 3
                  ? 'text-blue-400'
                  : Math.abs(pressContrib?.zScore || 0) >= 2
                  ? 'text-blue-300'
                  : 'text-white/60'
              }`}
            >
              {(pressContrib?.zScore || 0) > 0 ? `+${pressContrib?.zScore.toFixed(2)}` : pressContrib?.zScore.toFixed(2)}σ
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
          <span>Baseline: ~500.0 kPa</span>
          <span>Warn: &lt;400 • Crit: &lt;280</span>
        </div>
      </motion.div>
    </div>
  );
};
