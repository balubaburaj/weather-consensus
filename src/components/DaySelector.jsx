import React from 'react';
import { Calendar, History, CloudRain, Sun, Cloud, Clock } from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp } from '../utils/units';
import { generateDailySummary } from '../services/consensusEngine';

export default function DaySelector({
  dates,
  selectedDate,
  onSelectDate,
  hoursByDate,
  unit,
  onSelectAuditMode,
  isAuditMode,
}) {
  const getDayInfo = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', isPast: false, isToday: true, badge: 'Current' };
    if (diffDays === 1) return { label: 'Tomorrow', isPast: false, isToday: false, badge: null };
    if (diffDays === -1) return { label: 'Yesterday', isPast: true, isToday: false, badge: 'Recorded' };
    if (diffDays === -2) return { label: '2 Days Ago', isPast: true, isToday: false, badge: 'Recorded' };

    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isPast: diffDays < 0,
      isToday: false,
      badge: null,
    };
  };

  const getFormattedDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Timeline (Past 2 Days + Next 6 Days Forecast)
          </span>
          <span className="text-[11px] text-slate-400 font-normal hidden md:inline">
            • Explore sunny yesterday vs rainy days ahead
          </span>
        </div>

        {/* Audit Mode Quick Switcher */}
        <button
          onClick={onSelectAuditMode}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isAuditMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>Full Ground Truth Audit</span>
        </button>
      </div>

      <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 touch-pan-x scrollbar-thin">
        {dates.map((dateStr) => {
          const isSelected = !isAuditMode && selectedDate === dateStr;
          const dayHours = hoursByDate[dateStr] || [];
          const summary = generateDailySummary(dayHours, dateStr);
          const dayInfo = getDayInfo(dateStr);

          const maxTemp = summary?.maxTemp;
          const minTemp = summary?.minTemp;
          const maxRainProb = summary?.maxRainProb || 0;
          const totalRain = summary?.totalRain || 0;
          const dailyIcon = summary?.dailyIcon || 'CloudSun';
          const dailyCondition = summary?.dailyCondition || 'Partly Cloudy';
          const hasHeavyRain = maxRainProb >= 70 || totalRain >= 2.0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col min-w-[130px] sm:min-w-0 flex-shrink-0 sm:flex-shrink p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative overflow-hidden group active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/70 to-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-500/15 scale-[1.02] ring-1 ring-cyan-500/50'
                  : dayInfo.isPast
                  ? 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  : 'bg-slate-900/70 hover:bg-slate-850/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
              )}

              {/* Day & Date & Past badge */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black tracking-tight ${
                    isSelected ? 'text-cyan-300' : dayInfo.isToday ? 'text-white' : 'text-slate-300'
                  }`}>
                    {dayInfo.label}
                  </span>
                  {dayInfo.isToday && (
                    <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 animate-pulse">
                      NOW
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {getFormattedDate(dateStr)}
                </span>
              </div>

              {/* Weather Icon & Temperatures */}
              <div className="my-2 flex items-center justify-between">
                <div className="p-1 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <WeatherIcon iconName={dailyIcon} className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black text-white font-mono">
                    {formatTemp(maxTemp, unit)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                    {formatTemp(minTemp, unit)}
                  </div>
                </div>
              </div>

              {/* Explicit Condition Text so Icons tell the story */}
              <div className="text-[10px] font-semibold text-slate-200 truncate mb-1" title={dailyCondition}>
                {dailyCondition}
              </div>

              {/* Rain or Dry Indicator Badge */}
              <div className="mt-auto flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60">
                <span className="text-slate-400">
                  {dayInfo.isPast ? 'Rain rec.' : 'Rain'}
                </span>
                <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  hasHeavyRain
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : maxRainProb >= 35
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {maxRainProb > 0 ? `${maxRainProb}%` : 'Dry'} {totalRain > 0 && `(${totalRain}mm)`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
