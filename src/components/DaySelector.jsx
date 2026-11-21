import React from 'react';
import { Calendar, History, Sparkles } from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp } from '../utils/units';

export default function DaySelector({
  dates,
  selectedDate,
  onSelectDate,
  hoursByDate,
  unit,
  onSelectAuditMode,
  isAuditMode,
}) {
  const getDayLabel = (dateStr, idx) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';
    
    // Check if tomorrow
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getFormattedDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Day for Hourly Comparison
          </span>
        </div>

        {/* Audit Mode Quick Switcher */}
        <button
          onClick={onSelectAuditMode}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
            isAuditMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>Truth Verification (Who Got It Right?)</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
        {dates.map((dateStr, idx) => {
          const isSelected = !isAuditMode && selectedDate === dateStr;
          const dayHours = hoursByDate[dateStr] || [];
          const validConsensus = dayHours.map((h) => h.consensus).filter(Boolean);

          const maxTemp = validConsensus.length > 0 ? Math.max(...validConsensus.map((c) => c.temperature)) : null;
          const minTemp = validConsensus.length > 0 ? Math.min(...validConsensus.map((c) => c.temperature)) : null;
          const maxRainProb = validConsensus.length > 0 ? Math.max(...validConsensus.map((c) => c.precipitationProbability)) : 0;
          const dominantCode = validConsensus.length > 0 ? validConsensus[Math.floor(validConsensus.length / 2)]?.weatherCode : 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-slate-900/70 hover:bg-slate-850/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
              )}

              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {getDayLabel(dateStr, idx)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {getFormattedDate(dateStr)}
                </span>
              </div>

              <div className="my-2 flex items-center justify-between">
                <WeatherIcon code={dominantCode} className="w-7 h-7" />
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-100">
                    {formatTemp(maxTemp, unit)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatTemp(minTemp, unit)}
                  </div>
                </div>
              </div>

              {/* Rain Badge */}
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Rain chance</span>
                <span className={`font-semibold px-1.5 py-0.5 rounded ${
                  maxRainProb >= 60
                    ? 'bg-blue-500/20 text-blue-300'
                    : maxRainProb >= 30
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {maxRainProb}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
