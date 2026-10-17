import React, { useRef } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Flame,
  Zap,
  Gauge,
  Upload,
  Clock,
} from 'lucide-react';

interface ControlToolbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (newSpeed: number) => void;
  currentIndex: number;
  totalRows: number;
  onSeek: (index: number) => void;
  onJumpToEvent: (index: number) => void;
  onUploadCsv: (file: File) => void;
  onRestoreDefaultData: () => void;
  isCustomData: boolean;
  currentTimestamp: string;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  currentIndex,
  totalRows,
  onSeek,
  onJumpToEvent,
  onUploadCsv,
  onRestoreDefaultData,
  isCustomData,
  currentTimestamp,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speeds = [0.5, 1, 2, 5, 10];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCsv(file);
    }
  };

  const progressPct = Math.round(((currentIndex + 1) / Math.max(1, totalRows)) * 100);

  return (
    <div className="px-4 py-2.5 backdrop-blur-xl bg-black/20 border-b border-white/[0.05]">
      <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Playback Controls & Apple-style Segmented Speed Control */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Apple Play / Pause Pill */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePlay}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_2px_12px_rgba(255,159,10,0.35)]'
                : 'bg-white hover:bg-white/90 text-black shadow-[0_2px_12px_rgba(255,255,255,0.25)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Play Feed</span>
              </>
            )}
          </motion.button>

          {/* Step Button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onStep}
            disabled={isPlaying || currentIndex >= totalRows - 1}
            className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white/90 text-xs font-medium border border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            title="Advance 1 step"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </motion.button>

          {/* Apple Segmented Speed Control */}
          <div className="flex items-center bg-white/[0.05] p-0.5 rounded-full border border-white/[0.08] ml-1 relative">
            <span className="text-[10px] font-medium text-white/40 pl-2 pr-1 hidden sm:inline">Speed</span>
            {speeds.map((s) => {
              const isSelected = speed === s;
              return (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`relative px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all z-10 ${
                    isSelected ? 'text-white font-semibold' : 'text-white/60 hover:text-white/90'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-speed-pill"
                      className="absolute inset-0 bg-blue-500 rounded-full shadow-[0_1px_6px_rgba(10,132,255,0.4)] -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  {s}x
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Apple QuickTime / Music style timeline scrub track */}
        <div className="flex-1 w-full max-w-2xl px-2">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-white/80 font-medium">
                {currentTimestamp ? currentTimestamp.split('T')[1]?.replace('Z', '') : '00:00:00'}
              </span>
            </span>
            <span>
              Frame <strong className="text-white/90">{currentIndex + 1}</strong> of{' '}
              <strong className="text-white/90">{totalRows}</strong> ({progressPct}%)
            </span>
          </div>

          <div className="relative pt-0.5 pb-2">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalRows - 1)}
              value={currentIndex}
              onChange={(e) => onSeek(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none"
            />

            {/* Apple-style subtle anomaly markers */}
            {!isCustomData && totalRows === 300 && (
              <div className="absolute top-4 left-0 right-0 pointer-events-none flex justify-between px-1 text-[10px]">
                <div style={{ left: '22%' }} className="absolute -translate-x-1/2 flex items-center gap-1 text-amber-300/80 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#ff9f0a]" />
                  <span>Overheat</span>
                </div>
                <div style={{ left: '54%' }} className="absolute -translate-x-1/2 flex items-center gap-1 text-purple-300/80 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#bf5af2]" />
                  <span>Vibration</span>
                </div>
                <div style={{ left: '80%' }} className="absolute -translate-x-1/2 flex items-center gap-1 text-rose-300/80 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_#ff453a]" />
                  <span>Pressure</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Jump Scenarios & Connector */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end">
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold hidden xl:inline mr-1">
            Jump to
          </span>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onJumpToEvent(64)}
            className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Overheat</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onJumpToEvent(154)}
            className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3 h-3 text-purple-400" />
            <span>Vibration</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onJumpToEvent(224)}
            className="px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Gauge className="w-3 h-3 text-rose-400" />
            <span>Pressure</span>
          </motion.button>

          {/* Custom CSV Connector */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            className="hidden"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-all ml-1"
            title="Import custom sensor stream CSV"
          >
            <Upload className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Connector</span>
          </motion.button>

          {isCustomData && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onRestoreDefaultData}
              className="px-2.5 py-1 rounded-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all"
            >
              Default
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
