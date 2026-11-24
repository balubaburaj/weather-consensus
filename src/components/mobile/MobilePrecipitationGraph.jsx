import React, { useState } from 'react';
import { CloudRain } from 'lucide-react';
import { formatTime } from '../../utils/units';

export default function MobilePrecipitationGraph({
  hours = [],
  timeFormat = '24h',
}) {
  const [metricMode, setMetricMode] = useState('prob'); // 'prob' | 'amount'

  if (!hours || hours.length === 0) return null;

  const currentIdx = hours.findIndex((h) => h.isCurrent);
  const startIdx = currentIdx !== -1 ? currentIdx : 0;
  const next12Hours = hours.slice(startIdx, startIdx + 12);

  const hasAnyRain = next12Hours.some((h) => {
    const prob = h.consensus?.precipitationProbability || 0;
    const precip = h.consensus?.precipitation || 0;
    return prob >= 25 || precip >= 0.1;
  });

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CloudRain className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-white tracking-wide">
          Precipitation
        </h3>
      </div>

      {/* Chart Box */}
      <div className="relative h-28 w-full border border-slate-800/80 rounded-2xl bg-slate-950/60 p-3 flex flex-col justify-between overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/40 pointer-events-none" />
        <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/40 pointer-events-none" />
        <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/40 pointer-events-none" />

        {/* Y-axis labels */}
        <div className="absolute left-2 inset-y-2 flex flex-col justify-between text-[9px] font-mono text-slate-500 pointer-events-none">
          <span>{metricMode === 'prob' ? '100%' : '5mm'}</span>
          <span>{metricMode === 'prob' ? '50%' : '2.5mm'}</span>
          <span>0</span>
        </div>

        {/* Content bars or "No precipitation" notice */}
        {!hasAnyRain ? (
          <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
            No precipitation expected in the next 12 hours
          </div>
        ) : (
          <div className="h-full pl-8 pr-1 flex items-end justify-between gap-1">
            {next12Hours.map((h, i) => {
              const prob = h.consensus?.precipitationProbability || 0;
              const precip = h.consensus?.precipitation || 0;
              const heightPct = metricMode === 'prob'
                ? Math.min(100, Math.max(8, prob))
                : Math.min(100, Math.max(8, (precip / 5) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[14px] rounded-t-md transition-all ${
                      prob >= 60
                        ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-sm shadow-cyan-500/20'
                        : 'bg-cyan-500/40'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-400 mt-1 truncate">
                    {formatTime(h.hourLabel || h.timeIso, timeFormat, false)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setMetricMode('prob')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            metricMode === 'prob'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Precip Probability
        </button>
        <button
          type="button"
          onClick={() => setMetricMode('amount')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            metricMode === 'amount'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Precipitation mm
        </button>
      </div>
    </div>
  );
}
