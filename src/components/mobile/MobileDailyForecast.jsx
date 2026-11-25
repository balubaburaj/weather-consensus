import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo } from '../../constants/providers';

export default function MobileDailyForecast({
  dates = [],
  hoursByDate = {},
  unit = 'C',
  onOpenDetailedDaily,
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
          isNight: false,
          isToday: idx === 0,
        };
      }

      const tempsC = dayHours.map((h) => h.consensus?.temperature ?? h.actual?.temperature ?? 10);
      const rawMin = Math.min(...tempsC);
      const rawMax = Math.max(...tempsC);
      const minTemp = unit === 'F' ? Math.round((rawMin * 9) / 5 + 32) : Math.round(rawMin);
      const maxTemp = unit === 'F' ? Math.round((rawMax * 9) / 5 + 32) : Math.round(rawMax);

      const probs = dayHours.map((h) => h.consensus?.precipitationProbability ?? h.actual?.precipitationProbability ?? 0);
      const rainProb = Math.max(...probs);
      const precips = dayHours.map((h) => h.consensus?.precipitation ?? h.actual?.precipitation ?? 0);
      const totalRain = precips.reduce((s, v) => s + v, 0);
      const maxHourlyRain = Math.max(...precips);

      const windsKmh = dayHours.map((h) => h.consensus?.windSpeed ?? h.actual?.windSpeed ?? 15);
      const rawMaxWind = Math.max(...windsKmh);
      const maxWind = unit === 'F' ? Math.round(rawMaxWind * 0.621371) : Math.round(rawMaxWind);

      // Intensity-aware daily icon
      const daytimeHours = dayHours.filter((h) => h.isDay);
      const refHour = daytimeHours[Math.floor(daytimeHours.length / 2)] || dayHours[Math.floor(dayHours.length / 2)] || dayHours[0];
      const refCode = refHour.consensus?.weatherCode ?? refHour.actual?.weatherCode ?? 2;
      const smartRef = resolveSmartWeatherInfo(refCode, 0, 0);

      let icon = smartRef.icon || 'CloudSun';
      const severeHour = dayHours.find((h) => {
        const c = h.consensus?.weatherCode ?? h.actual?.weatherCode ?? 0;
        return [71, 73, 75, 77, 85, 86, 95, 96, 99].includes(c);
      });
      if (severeHour) {
        const sc = severeHour.consensus?.weatherCode ?? severeHour.actual?.weatherCode ?? 0;
        icon = resolveSmartWeatherInfo(sc, rainProb, maxHourlyRain).icon;
      } else if (maxHourlyRain >= 6.0) {
        icon = 'torrential';
      } else if (maxHourlyRain >= 2.5 || totalRain >= 8.0) {
        icon = 'heavy_rain';
      } else if (maxHourlyRain >= 0.7 || totalRain >= 2.0 || rainProb >= 70) {
        icon = 'moderate_rain';
      } else if (maxHourlyRain >= 0.25 || totalRain >= 0.5 || rainProb >= 55) {
        icon = 'light_rain';
      } else if (totalRain >= 0.1 || rainProb >= 40) {
        icon = 'drizzle';
      }

      const isNight = idx === 0 && dayHours.every((h) => h.isDay === false);

      return {
        dateStr,
        dayLabel: `${dayName} ${dayNum}`,
        minTemp,
        maxTemp,
        rainProb,
        maxWind,
        icon,
        isNight,
        isToday: idx === 0,
      };
    });
  }, [dates, hoursByDate, unit]);

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
        <button
          type="button"
          onClick={onOpenDetailedDaily}
          className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
          title="View 10-day detailed forecast (Table & Graph)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
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
              <div className="w-9 h-9 flex items-center justify-center my-1.5">
                <WeatherIcon iconName={day.icon} isNight={day.isNight} className="w-8 h-8 text-slate-200" />
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
