import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo } from '../../constants/providers';

export default function MobileDailyForecast({
  dates = [],
  todayDateStr,
  hoursByDate = {},
  unit = 'C',
  onOpenDetailedDaily,
}) {
  const [activeFilter, setActiveFilter] = useState('precipitation'); // 'precipitation' | 'wind' | 'temperature'

  // Build daily items
  const dailyData = useMemo(() => {
    if (!dates || dates.length === 0) return [];

    // Prefer city-local date string over UTC ISO date so late-night timezones stay on Today
    const now = new Date();
    const localTodayStr = todayDateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startIndex = dates.indexOf(localTodayStr) !== -1 ? dates.indexOf(localTodayStr) : 0;
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

      // Intensity-aware daily icon anchored on daytime sky majority & cloud cover
      const daytimeHours = dayHours.filter((h) => h.isDay !== false);
      const skySample = daytimeHours.length > 0 ? daytimeHours : dayHours;
      const fogHrs = skySample.filter((h) => [45, 48].includes(h.consensus?.weatherCode ?? h.actual?.weatherCode)).length;
      const overcastHrs = skySample.filter((h) => (h.consensus?.weatherCode ?? h.actual?.weatherCode) === 3 || (h.consensus?.cloudCover ?? 0) >= 80).length;
      const partlyHrs = skySample.filter((h) => (h.consensus?.weatherCode ?? h.actual?.weatherCode) === 2 || (h.consensus?.cloudCover ?? 0) >= 45).length;

      const refHour = skySample[Math.floor(skySample.length / 2)] || dayHours[0];
      const refCode = refHour.consensus?.weatherCode ?? refHour.actual?.weatherCode ?? 2;
      const refCloud = refHour.consensus?.cloudCover ?? refHour.actual?.cloudCover ?? null;

      let icon = resolveSmartWeatherInfo(refCode, 0, 0, daytimeHours.length > 0, refCloud).icon || 'CloudSun';
      if (fogHrs >= Math.max(2, Math.ceil(skySample.length * 0.35))) {
        icon = 'fog';
      } else if (overcastHrs >= Math.ceil(skySample.length * 0.5)) {
        icon = 'overcast';
      } else if (partlyHrs >= Math.ceil(skySample.length * 0.4) && icon === 'Sun') {
        icon = 'CloudSun';
      }

      const severeHour = dayHours.find((h) => {
        const c = h.consensus?.weatherCode ?? h.actual?.weatherCode ?? 0;
        return [71, 73, 75, 77, 85, 86, 95, 96, 99].includes(c);
      });
      if (severeHour) {
        const sc = severeHour.consensus?.weatherCode ?? severeHour.actual?.weatherCode ?? 0;
        icon = resolveSmartWeatherInfo(sc, rainProb, maxHourlyRain, daytimeHours.length > 0).icon;
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
  }, [dates, todayDateStr, hoursByDate, unit]);

  if (dailyData.length === 0) return null;

  // Global scale for vertical bars
  const allMins = dailyData.map((d) => d.minTemp);
  const allMaxs = dailyData.map((d) => d.maxTemp);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const tempSpan = globalMax - globalMin || 1;

  const barTotalHeightPx = 74;

  return (
    <div className="rounded-3xl border border-zinc-800/90 bg-[#111113] p-3.5 sm:p-4 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <h3 className="text-base font-extrabold text-white tracking-wide">
            Daily
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenDetailedDaily}
          className="p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
          title="View 10-day detailed forecast (Table & Graph)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7-Day Vertical Range Bar Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 text-center pb-1">
        {dailyData.map((day, i) => {
          // Calculate vertical position and height of temperature bar
          const topOffsetNorm = (globalMax - day.maxTemp) / tempSpan;
          const barHeightNorm = (day.maxTemp - day.minTemp) / tempSpan;
          const topOffsetPx = Math.max(0, topOffsetNorm * (barTotalHeightPx - 22));
          const barHeightPx = Math.max(16, barHeightNorm * (barTotalHeightPx - 22));

          return (
            <div key={day.dateStr} className="flex flex-col items-center justify-between">
              {/* Max Temp label */}
              <span className="text-[13px] font-mono font-extrabold text-zinc-100">
                {day.maxTemp}°
              </span>

              {/* Vertical Range Bar Track */}
              <div
                style={{ height: `${barTotalHeightPx}px` }}
                className="w-4 sm:w-5 relative my-0.5 flex justify-center items-center"
              >
                {/* Thin background track */}
                <div className="absolute inset-y-0 w-1 bg-zinc-800/80 rounded-full" />

                {/* Range Bar Pill with Warm Amber gradient (avoiding blue-on-blue near rain icons) */}
                <div
                  style={{
                    top: `${topOffsetPx}px`,
                    height: `${barHeightPx}px`,
                  }}
                  className={`absolute w-3 sm:w-3.5 rounded-full shadow-sm transition-all ${
                    day.isToday
                      ? 'bg-gradient-to-b from-amber-300 to-orange-500 border border-amber-200/80'
                      : 'bg-gradient-to-b from-amber-400/90 to-zinc-500/85 border border-zinc-700'
                  }`}
                />
              </div>

              {/* Min Temp label */}
              <span className="text-[13px] font-mono text-zinc-300 font-bold">
                {day.minTemp}°
              </span>

              {/* Rain Probability / Value Badge based on filter */}
              <div className="mt-1.5 min-h-[18px]">
                {activeFilter === 'precipitation' && (
                  <span className={`text-xs font-extrabold ${day.rainProb >= 60 ? 'text-sky-400' : 'text-zinc-300'}`}>
                    {day.rainProb}%
                  </span>
                )}
                {activeFilter === 'wind' && (
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {day.maxWind}k
                  </span>
                )}
                {activeFilter === 'temperature' && (
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    &Delta;{day.maxTemp - day.minTemp}°
                  </span>
                )}
              </div>

              {/* Weather Icon */}
              <div className="w-10 h-10 flex items-center justify-center my-0.5">
                <WeatherIcon iconName={day.icon} isNight={day.isNight} className="w-10 h-10" />
              </div>

              {/* Day Label */}
              <span className={`text-[11px] font-bold tracking-tight ${day.isToday ? 'text-amber-400' : 'text-zinc-300'}`}>
                {day.isToday ? 'Today' : day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter Pills (Matching Section 5 of Reference Design) */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => setActiveFilter('precipitation')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeFilter === 'precipitation'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Precipitation
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('wind')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeFilter === 'wind'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Wind
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('temperature')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeFilter === 'temperature'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Temperature
        </button>
      </div>
    </div>
  );
}
