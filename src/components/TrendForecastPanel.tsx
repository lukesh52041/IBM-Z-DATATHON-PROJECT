import React from 'react';
import { motion } from 'motion/react';
import { Compass, TrendingUp, TrendingDown, Minus, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { TrendForecast } from '../types';

interface TrendForecastPanelProps {
  trend: TrendForecast;
  currentValues: {
    temp: number;
    vib: number;
    press: number;
  };
}

export const TrendForecastPanel: React.FC<TrendForecastPanelProps> = ({ trend, currentValues }) => {
  const getUrgencyBadge = () => {
    switch (trend.urgencyLevel) {
      case 'hazardous':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Hazardous Trajectory
          </span>
        );
      case 'escalating':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <AlertTriangle className="w-3 h-3" />
            Elevated Drift
          </span>
        );
      case 'monitoring':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
            Dynamic Shift
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Stable Horizon
          </span>
        );
    }
  };

  const renderSlopeIndicator = (slope: number, unit: string) => {
    if (Math.abs(slope) < 0.05) {
      return (
        <span className="flex items-center gap-1 text-white/40 font-mono text-xs">
          <Minus className="w-3 h-3" />
          <span>0.0 {unit}/s</span>
        </span>
      );
    }
    if (slope > 0) {
      return (
        <span className="flex items-center gap-1 text-red-400 font-mono text-xs font-semibold">
          <TrendingUp className="w-3 h-3" />
          <span>+{slope.toFixed(2)} {unit}/s</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-blue-400 font-mono text-xs font-semibold">
        <TrendingDown className="w-3 h-3" />
        <span>{slope.toFixed(2)} {unit}/s</span>
      </span>
    );
  };

  return (
    <div className="apple-glass-card rounded-2xl p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-semibold text-white/80 tracking-tight">
            Predictive Horizon: What May Happen Next
          </h2>
        </div>
        {getUrgencyBadge()}
      </div>

      {/* Plain Language Prognosis Card */}
      <div className="apple-glass rounded-xl p-3 mb-3 border border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-1 font-medium">
          <Clock className="w-3 h-3 text-blue-400" />
          <span>Extrapolated Prognosis (+5s to +15s)</span>
        </div>
        <p className="text-[13px] text-white/90 leading-relaxed font-normal">
          {trend.summary}
        </p>
      </div>

      {/* Derivative Rate of Change Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="text-[10px] text-white/45 uppercase tracking-wider mb-1 font-medium">
            Thermal Rate
          </div>
          {renderSlopeIndicator(trend.temperatureSlopePerSec, '°C')}
          <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/40">Now: {currentValues.temp.toFixed(1)}°C</span>
            <span className="text-white/85 font-medium">In 5s: {trend.tempProjected5s.toFixed(1)}°C</span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="text-[10px] text-white/45 uppercase tracking-wider mb-1 font-medium">
            Vibration Rate
          </div>
          {renderSlopeIndicator(trend.vibrationSlopePerSec, 'g')}
          <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/40">Now: {currentValues.vib.toFixed(2)}g</span>
            <span className="text-white/85 font-medium">In 5s: {trend.vibProjected5s.toFixed(2)}g</span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="text-[10px] text-white/45 uppercase tracking-wider mb-1 font-medium">
            Hydraulic Drift
          </div>
          {renderSlopeIndicator(trend.pressureSlopePerSec, 'kPa')}
          <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/40">Now: {currentValues.press.toFixed(1)}</span>
            <span className="text-white/85 font-medium">In 5s: {trend.pressProjected5s.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
