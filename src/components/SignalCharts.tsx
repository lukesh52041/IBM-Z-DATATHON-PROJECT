import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Zap, Gauge, Layers, Info } from 'lucide-react';
import { DetectionResult } from '../types';

interface SignalChartsProps {
  history: DetectionResult[];
}

export const SignalCharts: React.FC<SignalChartsProps> = ({ history }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'temperature' | 'vibration' | 'pressure'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const slice = history.slice(-50);
  const chartWidth = 720;
  const chartHeight = 155;
  const padding = { top: 20, right: 28, bottom: 24, left: 45 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate smooth cubic Bézier SVG path from points
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const renderAppleChart = (
    signalKey: 'temperature_c' | 'vibration_g' | 'pressure_kpa',
    label: string,
    unit: string,
    icon: React.ReactNode,
    color: string,
    gradientId: string,
    minVal: number,
    maxVal: number,
    warningThreshold: number,
    criticalThreshold: number,
    isThresholdLower: boolean = false
  ) => {
    if (slice.length < 2) {
      return (
        <div className="h-40 flex items-center justify-center text-white/40 font-mono text-xs">
          Awaiting streaming telemetry...
        </div>
      );
    }

    const values = slice.map((d) => d.row[signalKey]);
    const computedMin = Math.min(minVal, Math.min(...values));
    const computedMax = Math.max(maxVal, Math.max(...values));
    const range = computedMax - computedMin || 1;

    const getY = (val: number) => {
      const normalized = (val - computedMin) / range;
      return chartHeight - padding.bottom - normalized * innerHeight;
    };

    const getX = (idx: number) => {
      return padding.left + (idx / Math.max(1, slice.length - 1)) * innerWidth;
    };

    const pts = slice.map((d, i) => ({
      x: getX(i),
      y: getY(d.row[signalKey]),
    }));

    const linePath = createSmoothPath(pts);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${chartHeight - padding.bottom} L ${pts[0].x} ${chartHeight - padding.bottom} Z`;

    const warnY = getY(warningThreshold);
    const critY = getY(criticalThreshold);

    const hoveredItem = hoveredIndex !== null && slice[hoveredIndex] ? slice[hoveredIndex] : null;

    return (
      <div className="apple-glass-card rounded-2xl p-4 relative overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-semibold text-white/90 tracking-tight">
              {label}
            </span>
            <span className="text-[11px] font-mono text-white/40">({unit})</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-amber-400 rounded-full" />
              <span>Warn {warningThreshold}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-red-400 rounded-full" />
              <span>Crit {criticalThreshold}</span>
            </span>
            <span className="text-white font-medium pl-1">
              {slice[slice.length - 1].row[signalKey].toFixed(1)} {unit}
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-36 select-none overflow-visible"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="85%" stopColor={color} stopOpacity="0.01" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const yVal = computedMin + (1 - pct) * range;
              const yPos = padding.top + pct * innerHeight;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={chartWidth - padding.right}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 3}
                    fill="rgba(255, 255, 255, 0.3)"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {yVal.toFixed(unit === 'g' ? 1 : 0)}
                  </text>
                </g>
              );
            })}

            {/* Warning threshold dashed line */}
            {warnY >= padding.top && warnY <= chartHeight - padding.bottom && (
              <line
                x1={padding.left}
                y1={warnY}
                x2={chartWidth - padding.right}
                y2={warnY}
                stroke="#FF9F0A"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
              />
            )}

            {/* Critical threshold dashed line */}
            {critY >= padding.top && critY <= chartHeight - padding.bottom && (
              <line
                x1={padding.left}
                y1={critY}
                x2={chartWidth - padding.right}
                y2={critY}
                stroke="#FF453A"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.75"
              />
            )}

            {/* Translucent Area Gradient */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Smooth Anti-aliased Curve */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Anomaly Dots */}
            {slice.map((d, i) => {
              const val = d.row[signalKey];
              const isCrit = isThresholdLower ? val <= criticalThreshold : val >= criticalThreshold;
              const isWarn = isThresholdLower ? val <= warningThreshold : val >= warningThreshold;
              const zVal =
                signalKey === 'temperature_c'
                  ? d.temperature_z
                  : signalKey === 'vibration_g'
                  ? d.vibration_z
                  : d.pressure_z;
              const isZ = Math.abs(zVal) >= 3;

              if (isCrit || isZ) {
                return (
                  <circle
                    key={`crit-${i}`}
                    cx={getX(i)}
                    cy={getY(val)}
                    r="4.5"
                    fill="#FF453A"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                );
              } else if (isWarn) {
                return (
                  <circle
                    key={`warn-${i}`}
                    cx={getX(i)}
                    cy={getY(val)}
                    r="3.5"
                    fill="#FF9F0A"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                );
              }
              return null;
            })}

            {/* Interactive hover rects */}
            {slice.map((_, i) => (
              <rect
                key={`hit-${i}`}
                x={getX(i) - innerWidth / slice.length / 2}
                y={padding.top}
                width={innerWidth / slice.length}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                className="cursor-crosshair"
              />
            ))}

            {/* Hover guideline and dot */}
            {hoveredIndex !== null && slice[hoveredIndex] && (
              <g>
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={chartHeight - padding.bottom}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(slice[hoveredIndex].row[signalKey])}
                  r="5"
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2.5"
                />
              </g>
            )}
          </svg>

          {/* Floating Apple Frosted Tooltip */}
          {hoveredItem && hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute pointer-events-none apple-glass rounded-xl p-2.5 text-xs shadow-xl z-20"
              style={{
                left: `${Math.min(chartWidth - 165, Math.max(50, getX(hoveredIndex) - 75))}px`,
                top: '12px',
              }}
            >
              <div className="text-white/40 text-[10px] font-mono">
                {hoveredItem.row.timestamp.split('T')[1]?.replace('Z', '')} (Frame {hoveredItem.row.index + 1})
              </div>
              <div className="flex items-baseline gap-1 mt-0.5 font-bold text-white text-sm">
                <span>{hoveredItem.row[signalKey]}</span>
                <span className="text-[11px] text-white/50">{unit}</span>
              </div>
              <div className="text-[11px] text-white/70 font-mono mt-0.5">
                Variance:{' '}
                <span
                  className={
                    Math.abs(hoveredItem.temperature_z) >= 3 ? 'text-red-400 font-semibold' : 'text-white'
                  }
                >
                  {signalKey === 'temperature_c'
                    ? hoveredItem.temperature_z
                    : signalKey === 'vibration_g'
                    ? hoveredItem.vibration_z
                    : hoveredItem.pressure_z}
                  σ
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Apple-style segmented tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-white/[0.05] p-0.5 rounded-full border border-white/[0.08] relative">
          {[
            { id: 'all', label: 'All Channels', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'temperature', label: 'Thermal', icon: <Flame className="w-3.5 h-3.5" /> },
            { id: 'vibration', label: 'Vibration', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'pressure', label: 'Pressure', icon: <Gauge className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 z-10 ${
                  isSelected ? 'text-white font-semibold' : 'text-white/60 hover:text-white/90'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-chart-tab"
                    className="absolute inset-0 bg-white/[0.12] rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.3)] border border-white/[0.08] -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/40">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Rolling 50s Horizon • Smooth Bézier Interpolation</span>
        </div>
      </div>

      {/* Render selected charts */}
      {(activeTab === 'all' || activeTab === 'temperature') &&
        renderAppleChart(
          'temperature_c',
          'Thermal Core (TE-01)',
          '°C',
          <Flame className="w-3.5 h-3.5 text-amber-400" />,
          '#FF9F0A',
          'tempGrad',
          65,
          110,
          82,
          95,
          false
        )}

      {(activeTab === 'all' || activeTab === 'vibration') &&
        renderAppleChart(
          'vibration_g',
          'Turbine Shaft Vibration (VE-02)',
          'g',
          <Zap className="w-3.5 h-3.5 text-purple-400" />,
          '#BF5AF2',
          'vibGrad',
          0.5,
          8.0,
          2.8,
          4.5,
          false
        )}

      {(activeTab === 'all' || activeTab === 'pressure') &&
        renderAppleChart(
          'pressure_kpa',
          'Hydraulic Intake Pressure (PT-03)',
          'kPa',
          <Gauge className="w-3.5 h-3.5 text-blue-400" />,
          '#0A84FF',
          'pressGrad',
          160,
          540,
          400,
          280,
          true
        )}
    </div>
  );
};
