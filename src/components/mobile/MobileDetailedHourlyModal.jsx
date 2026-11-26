import React from 'react';
import { ArrowLeft } from 'lucide-react';
import MobileHourlyTimelineView from './MobileHourlyTimelineView';

export default function MobileDetailedHourlyModal({
  hours = [],
  selectedCity,
  unit = 'C',
  timeFormat = '24h',
  onClose,
}) {
  if (!hours || hours.length === 0) return null;

  // Take the next 24 hours starting from current (or first upcoming)
  const currentIdx = hours.findIndex((h) => h.isCurrent);
  const startIdx = currentIdx !== -1 ? currentIdx : 0;
  const displayHours = hours.slice(startIdx, startIdx + 24);

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col overflow-hidden select-none animate-fade-in font-sans">
      {/* Top App Bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/95 border-b border-zinc-800/90 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-full hover:bg-zinc-800 text-zinc-200 transition cursor-pointer active:scale-95"
            title="Back to Mobile Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">
            Hourly
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <span>{selectedCity?.name || 'Cork'}</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-amber-400 font-mono">24h</span>
        </div>
      </div>

      {/* Shared 12-Metric Timeline */}
      <MobileHourlyTimelineView
        hours={displayHours}
        unit={unit}
        timeFormat={timeFormat}
      />
    </div>
  );
}
