import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { WeatherIcon } from '../../utils/weatherIcons';

export default function MobileDailyForecast({
  dates = [],
  hoursByDate = {},
  unit = 'C',
}) {
  const [activeFilter, setActiveFilter] = useState('precipitation'); // 'precipitation' | 'wind' | 'temperature'

  // Build daily items
  const dailyData = useMemo(() => {
    if (!dates || dates.length === 0) return [];

    // Filter to next 7 days starting from today or date index 2 (skip past days)
    const todayStr = new Date().toISOString().split('T')[0];
    const startIndex = dates.indexOf(todayStr) !== -1 ? dates.indexOf(todayStr) : 0;
    const selectedDates = dates.slice(startIndex, startIndex + 7);

    return selectedDates.map((dateStr, idx) => {
      const dayHours = hoursByDate[dateStr] || [];
      const d = new Date(dateStr + 'T12:00:00');
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayNum = d.getDate();

      if (dayHours.length === 0) {
        return {
          dateStr,
          dayLabel: `${dayName} ${dayNum}`,
          minTemp: 6,
          maxTemp: 12,
          rainProb: 20,
          maxWind: 20,
          icon: 'Cloud',
          isToday: idx === 0,
        };
      }

      const temps = dayHours.map((h) => h.consensus?.temperature || h.actual?.temperature || 10);
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));

      const probs = dayHours.map((h) => h.consensus?.precipitationProbability || h.actual?.precipitationProbability || 0);
      const rainProb = Math.max(...probs);

      const winds = dayHours.map((h) => h.actual?.windSpeed || 15);
      const maxWind = Math.round(Math.max(...winds));

      // Dominant midday icon
      const midHour = dayHours[Math.floor(dayHours.length / 2)] || dayHours[0];
      const icon = midHour.consensus?.weatherIcon || (rainProb >= 60 ? 'CloudRain' : (rainProb >= 30 ? 'CloudDrizzle' : 'CloudSun'));

      return {
        dateStr,
        dayLabel: `${dayName} ${dayNum}`,
        minTemp,
        maxTemp,
        rainProb,
        maxWind,
        icon,
        isToday: idx === 0,
      };
    });
  }, [dates, hoursByDate]);

  if (dailyData.length === 0) return null;

  // Global scale for vertical bars
  const allMins = dailyData.map((d) => d.minTemp);
  const allMaxs = dailyData.map((d) => d.maxTemp);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const tempSpan = globalMax - globalMin || 1;

  const barTotalHeightPx = 80;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Daily
          </h3>
        </div>
        <div className="p-1 rounded-full bg-slate-800 text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 7-Day Vertical Range Bar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-2">
        {dailyData.map((day, i) => {
          // Calculate vertical position and height of temperature bar
          const topOffsetNorm = (globalMax - day.maxTemp) / tempSpan;
          const barHeightNorm = (day.maxTemp - day.minTemp) / tempSpan;
          const topOffsetPx = Math.max(0, topOffsetNorm * (barTotalHeightPx - 24));
          const barHeightPx = Math.max(16, barHeightNorm * (barTotalHeightPx - 24));

          return (
            <div key={day.dateStr} className="flex flex-col items-center justify-between">
              {/* Max Temp label */}
              <span className="text-[11px] font-mono font-bold text-slate-100">
                {day.maxTemp}°
              </span>

              {/* Vertical Range Bar Track */}
              <div
                style={{ height: `${barTotalHeightPx}px` }}
                className="w-4 sm:w-5 relative my-1 flex justify-center items-center"
              >
                {/* Thin background track */}
                <div className="absolute inset-y-0 w-1 bg-slate-800/60 rounded-full" />

                {/* Range Bar Pill with Blue to Amber gradient */}
                <div
                  style={{
                    top: `${topOffsetPx}px`,
                    height: `${barHeightPx}px`,
                  }}
                  className={`absolute w-3 sm:w-3.5 rounded-full shadow-sm transition-all ${
                    day.isToday
                      ? 'bg-gradient-to-b from-amber-400 to-cyan-400 border border-amber-300'
                      : 'bg-gradient-to-b from-amber-500/80 to-blue-500/80 border border-slate-700'
                  }`}
                />
              </div>

              {/* Min Temp label */}
              <span className="text-[11px] font-mono text-slate-400 font-medium">
                {day.minTemp}°
              </span>

              {/* Rain Probability / Value Badge based on filter */}
              <div className="mt-2 min-h-[18px]">
                {activeFilter === 'precipitation' && (
                  <span className={`text-[10px] font-bold ${day.rainProb >= 60 ? 'text-cyan-400 font-extrabold' : 'text-slate-400'}`}>
                    {day.rainProb}%
                  </span>
                )}
                {activeFilter === 'wind' && (
                  <span className="text-[10px] font-mono font-semibold text-sky-300">
                    {day.maxWind}k
                  </span>
                )}
                {activeFilter === 'temperature' && (
                  <span className="text-[10px] font-mono text-amber-300 font-semibold">
                    &Delta;{day.maxTemp - day.minTemp}°
                  </span>
                )}
              </div>

              {/* Weather Icon */}
              <div className="w-5 h-5 flex items-center justify-center my-1">
                <WeatherIcon iconName={day.icon} className="w-4 h-4 text-slate-200" />
              </div>

              {/* Day Label */}
              <span className={`text-[10px] font-semibold tracking-tight ${day.isToday ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                {day.isToday ? 'Today' : day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter Pills (Matching Section 5 of Reference Design) */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveFilter('precipitation')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            activeFilter === 'precipitation'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Precipitation
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('wind')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            activeFilter === 'wind'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Wind
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('temperature')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            activeFilter === 'temperature'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Temperature
        </button>
      </div>
    </div>
  );
}
