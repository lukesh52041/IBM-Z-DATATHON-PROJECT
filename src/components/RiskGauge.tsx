import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, TrendingUp, TrendingDown, Minus, Flame, Zap, Gauge } from 'lucide-react';
import { RiskTier, SignalContribution } from '../types';

interface RiskGaugeProps {
  score: number;
  tier: RiskTier;
  topSignals: SignalContribution[];
  trendSlope: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, tier, topSignals, trendSlope }) => {
  // Apple Watch Activity Ring style calculation
  const radius = 74;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // 180 degree semi-circle
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  const needleAngle = -90 + (clampedScore / 100) * 180;

  const getTierDetails = () => {
    switch (tier) {
      case 'CRITICAL':
        return {
          color: '#FF453A',
          gradientStart: '#FF9F0A',
          gradientEnd: '#FF453A',
          glow: 'rgba(255, 69, 58, 0.4)',
          badge: 'bg-red-500/15 text-red-400 border-red-500/30',
          title: 'Critical Risk',
        };
      case 'HIGH':
        return {
          color: '#FF9F0A',
          gradientStart: '#FFD60A',
          gradientEnd: '#FF9F0A',
          glow: 'rgba(255, 159, 10, 0.35)',
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          title: 'High Risk',
        };
      case 'MEDIUM':
        return {
          color: '#FFD60A',
          gradientStart: '#30D158',
          gradientEnd: '#FFD60A',
          glow: 'rgba(255, 214, 10, 0.25)',
          badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
          title: 'Moderate Risk',
        };
      case 'LOW':
      default:
        return {
          color: '#30D158',
          gradientStart: '#0A84FF',
          gradientEnd: '#30D158',
          glow: 'rgba(48, 209, 88, 0.25)',
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          title: 'Nominal Level',
        };
    }
  };

  const details = getTierDetails();

  const getSignalIcon = (sig: string) => {
    switch (sig) {
      case 'temperature':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'vibration':
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
      case 'pressure':
      default:
        return <Gauge className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="apple-glass-card rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
        style={{ backgroundColor: details.color }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-1 relative z-10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-white/70" />
          <h2 className="text-xs font-semibold text-white/80 tracking-tight">
            Composite Risk
          </h2>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-white/50 font-mono">
          <span>Trajectory</span>
          {trendSlope > 0.5 ? (
            <span className="flex items-center text-red-400 font-medium">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{trendSlope.toFixed(1)}/s
            </span>
          ) : trendSlope < -0.5 ? (
            <span className="flex items-center text-emerald-400 font-medium">
              <TrendingDown className="w-3 h-3 mr-0.5" /> {trendSlope.toFixed(1)}/s
            </span>
          ) : (
            <span className="flex items-center text-white/40">
              <Minus className="w-3 h-3 mr-0.5" /> Steady
            </span>
          )}
        </div>
      </div>

      {/* Apple Activity Style Arc Dial */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg width="210" height="120" viewBox="0 0 210 120" className="overflow-visible">
          <defs>
            <linearGradient id="appleRingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0A84FF" />
              <stop offset="35%" stopColor="#30D158" />
              <stop offset="70%" stopColor="#FF9F0A" />
              <stop offset="100%" stopColor="#FF453A" />
            </linearGradient>
            <filter id="appleRingGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track with rounded caps */}
          <path
            d="M 31 106 A 74 74 0 0 1 179 106"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <path
            d="M 31 106 A 74 74 0 0 1 179 106"
            fill="none"
            stroke="url(#appleRingGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={tier === 'CRITICAL' ? 'url(#appleRingGlow)' : undefined}
            className="transition-all duration-500 ease-out"
          />

          {/* Minimalist Apple Dial Pin */}
          <g transform={`translate(105, 106) rotate(${needleAngle})`} className="transition-transform duration-500 ease-out">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-64"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="0" cy="-64" r="3.5" fill={details.color} />
          </g>
          <circle cx="105" cy="106" r="6" fill="#16181d" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" />

          {/* Subtle tick labels */}
          <text x="30" y="118" fill="rgba(255, 255, 255, 0.3)" fontSize="9" fontFamily="monospace" textAnchor="middle">0</text>
          <text x="105" y="26" fill="rgba(255, 255, 255, 0.3)" fontSize="9" fontFamily="monospace" textAnchor="middle">50</text>
          <text x="180" y="118" fill="rgba(255, 255, 255, 0.3)" fontSize="9" fontFamily="monospace" textAnchor="middle">100</text>
        </svg>

        {/* Center Big Typography */}
        <div className="text-center -mt-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold tracking-tight text-white font-mono">
              {score}
            </span>
            <span className="text-xs text-white/40 font-mono">/ 100</span>
          </div>
          <span
            className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border mt-1 ${details.badge}`}
          >
            {tier}
          </span>
        </div>
      </div>

      {/* Signal Contribution Bars */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-white/50">
          <span>Signal Attribution</span>
          <span>Relative Weight</span>
        </div>
        <div className="space-y-1.5">
          {topSignals.map((sig) => (
            <div key={sig.signal} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-[110px]">
                {getSignalIcon(sig.signal)}
                <span className="text-white/80 text-[11px] font-medium">{sig.name}</span>
              </div>
              <div className="flex-1 mx-2">
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${sig.contributionPct}%`,
                      backgroundColor:
                        sig.contributionPct > 50
                          ? '#FF453A'
                          : sig.contributionPct > 25
                          ? '#FF9F0A'
                          : '#0A84FF',
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-white/40">{sig.contributionPct}%</span>
                <span
                  className={`w-12 text-right ${
                    Math.abs(sig.zScore) >= 3
                      ? 'text-red-400 font-semibold'
                      : Math.abs(sig.zScore) >= 2
                      ? 'text-amber-400'
                      : 'text-white/60'
                  }`}
                >
                  {sig.zScore > 0 ? `+${sig.zScore.toFixed(1)}` : sig.zScore.toFixed(1)}σ
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
