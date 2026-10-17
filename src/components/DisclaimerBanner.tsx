import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <aside aria-label="Operational advisory notice" className="px-4 py-2.5 backdrop-blur-xl bg-black/40 border-t border-white/[0.06] text-white/50 text-[11px]">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
          <span>
            <strong className="text-white/80 font-medium">Advisory Decision Support:</strong> AI
            recommendations and telemetry alerts provide operational assistance. Human operators
            retain full executive authorization over physical machinery, valves, and power setpoints.
          </span>
        </div>
        <div className="flex items-center gap-3 text-white/40 text-[10px] font-mono">
          <span>High-Availability Target</span>
          <span>•</span>
          <span>IBM Z / LinuxONE</span>
        </div>
      </div>
    </aside>
  );
};
