import React, { memo, useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { WeatherIcon } from '../../utils/weatherIcons';
import { getCardinalWindDirection } from '../../utils/units';
import { resolveDailySkySummary } from '../../services/consensusEngine';
import downArrowIcon from '../../../user_references/down-arrows.png';

function MobileDailyForecast({
  dates = [],
  todayDateStr,
  hoursByDate = {},
  unit = 'C',
  onOpenDetailedDaily,
}) {
  const [activeFilter, setActiveFilter] = useState('precipitation'); // 'precipitation' | 'wind' | 'pressure'

  // Build daily items (7 days)
  const dailyData = useMemo(() => {
    if (!dates || dates.length === 0) return [];

    const now = new Date();
    const localTodayStr =
      todayDateStr ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
          minFeels: 4,
          maxFeels: 10,
          rainProb: 20,
          rainAmountLabel: unit === 'F' ? '0in' : '0mm',
          maxWind: 20,
          windDirDeg: 180,
          avgPressure: 1013,
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

      const feelsC = dayHours.map(
        (h) =>
          h.consensus?.apparentTemperature ??
          h.actual?.apparentTemperature ??
          h.consensus?.temperature ??
          h.actual?.temperature ??
          10
      );
      const rawFeelsMin = Math.min(...feelsC);
      const rawFeelsMax = Math.max(...feelsC);
      const minFeels = unit === 'F' ? Math.round((rawFeelsMin * 9) / 5 + 32) : Math.round(rawFeelsMin);
      const maxFeels = unit === 'F' ? Math.round((rawFeelsMax * 9) / 5 + 32) : Math.round(rawFeelsMax);

      const probs = dayHours.map((h) => h.consensus?.precipitationProbability ?? h.actual?.precipitationProbability ?? 0);
      const rainProb = Math.round(Math.max(...probs));
      const precips = dayHours.map((h) => h.consensus?.precipitation ?? h.actual?.precipitation ?? 0);
      const totalRain = precips.reduce((s, v) => s + v, 0);
      const rainAmountLabel =
        unit === 'F'
          ? `${totalRain >= 0.25 ? (totalRain * 0.03937).toFixed(2) : '0'}in`
          : `${totalRain >= 0.05 ? totalRain.toFixed(1) : '0'}mm`;

      const windsKmh = dayHours.map((h) => h.consensus?.windSpeed ?? h.actual?.windSpeed ?? 15);
      const rawMaxWind = Math.max(...windsKmh);
      const maxWind = unit === 'F' ? Math.round(rawMaxWind * 0.621371) : Math.round(rawMaxWind);

      // Use wind direction from the peak wind hour (representative for daily arrow)
      let maxWindIdx = 0;
      windsKmh.forEach((w, wIdx) => {
        if (w > windsKmh[maxWindIdx]) maxWindIdx = wIdx;
      });
      const peakWindHour = dayHours[maxWindIdx] || dayHours[0];
      const windDirDeg =
        peakWindHour?.actual?.windDirection !== undefined
          ? peakWindHour.actual.windDirection
          : (peakWindHour?.consensus?.windDirection ?? 180);

      // Average surface pressure (hPa) for the day
      const pressures = dayHours.map(
        (h) => h.actual?.surfacePressure ?? h.consensus?.surfacePressure ?? 1013
      );
      const avgPressure = Math.round(pressures.reduce((s, v) => s + v, 0) / pressures.length);

      // Intensity-aware daily icon anchored on daytime sky & daytime rainfall
      const { icon } = resolveDailySkySummary(dayHours);
      const isNight = idx === 0 && dayHours.every((h) => h.isDay === false);

      return {
        dateStr,
        dayLabel: `${dayName} ${dayNum}`,
        minTemp,
        maxTemp,
        minFeels,
        maxFeels,
        rainProb,
        rainAmountLabel,
        maxWind,
        windDirDeg,
        avgPressure,
        icon,
        isNight,
        isToday: idx === 0,
      };
    });
  }, [dates, todayDateStr, hoursByDate, unit]);

  if (dailyData.length === 0) return null;

  // Global scales
  const allMins = dailyData.map((d) => d.minTemp);
  const allMaxs = dailyData.map((d) => d.maxTemp);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const tempSpan = globalMax - globalMin || 1;

  const windMax = Math.max(10, ...dailyData.map((d) => d.maxWind));
  const presMin = Math.min(...dailyData.map((d) => d.avgPressure)) - 4;
  const presMax = Math.max(...dailyData.map((d) => d.avgPressure)) + 2;
  const presSpan = presMax - presMin || 1;

  const chartHeightPx = 104;
  const tempRangeZonePx = 64; // Inner vertical range for High/Low pill inside chart box

  const windUnit = unit === 'F' ? 'mph' : 'km/h';

  return (
    <div className="rounded-3xl border border-zinc-800/90 bg-[#111113] p-3.5 sm:p-4 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <h3 className="text-base font-extrabold text-white tracking-wide">
            Daily
          </h3>
          {activeFilter === 'precipitation' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 ml-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Rain %/mm</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
              <span className="text-amber-300">High/Low &amp; Feels</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenDetailedDaily?.(null)}
          className="p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
          title="View 10-day detailed forecast (Table & Graph)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7-Day Interactive Columns (Clicking any day opens expanded details for that day) */}
      <div className="grid grid-cols-7 gap-1 text-center pb-1">
        {dailyData.map((day) => {
          // Temperature pill position inside chart box (with room for max above and min below)
          const topOffsetNorm = (globalMax - day.maxTemp) / tempSpan;
          const pillHeightNorm = (day.maxTemp - day.minTemp) / tempSpan;
          const pillTopPx = 18 + Math.max(0, topOffsetNorm * (tempRangeZonePx - 14));
          const pillHeightPx = Math.max(12, pillHeightNorm * (tempRangeZonePx - 14));

          // Precipitation % bar height (0..100%)
          const precipBarPx = Math.max(4, (Math.min(100, Math.max(0, day.rainProb)) / 100) * (chartHeightPx - 8));

          // Wind bar height (leave 20px headroom for speed label)
          const windBarPx = Math.max(8, (day.maxWind / windMax) * (chartHeightPx - 24));

          // Pressure bar height (leave 20px headroom for hPa label)
          const presBarPx = Math.max(10, ((day.avgPressure - presMin) / presSpan) * (chartHeightPx - 24));

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onOpenDetailedDaily?.(day.dateStr)}
              className="flex flex-col items-center rounded-xl py-1 hover:bg-white/[0.04] active:scale-[0.97] transition cursor-pointer group"
              title={`Open expanded forecast for ${day.isToday ? 'Today' : day.dayLabel}`}
            >
              {/* Chart Column Box */}
              <div
                style={{ height: `${chartHeightPx}px` }}
                className="w-full relative rounded-md bg-white/[0.03] overflow-hidden flex justify-center"
              >
                {activeFilter === 'precipitation' && (
                  <>
                    {/* Blue Background Bar = Precipitation Probability % */}
                    <div
                      style={{ height: `${precipBarPx}px` }}
                      className="absolute bottom-0 inset-x-1 rounded-t-sm bg-gradient-to-t from-sky-950/90 via-sky-700/75 to-sky-400/85"
                    />

                    {/* Overlaid Yellow High / Low Temperature Range Pill */}
                    <div
                      style={{ top: `${pillTopPx - 15}px` }}
                      className="relative z-10 flex flex-col items-center pointer-events-none"
                    >
                      <span className="text-[12px] font-mono font-extrabold text-zinc-100 leading-none drop-shadow">
                        {day.maxTemp}°
                      </span>
                      <div
                        style={{ height: `${pillHeightPx}px` }}
                        className="w-2 my-1 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_0_6px_rgba(0,0,0,0.6)]"
                      />
                      <span className="text-[12px] font-mono font-bold text-zinc-100 leading-none drop-shadow">
                        {day.minTemp}°
                      </span>
                    </div>
                  </>
                )}

                {activeFilter === 'wind' && (
                  <div className="absolute bottom-0 inset-x-1 flex flex-col items-center justify-end">
                    <span className="text-[12px] font-mono font-bold text-zinc-100 mb-1 leading-none">
                      {day.maxWind}
                    </span>
                    <div
                      style={{ height: `${windBarPx}px` }}
                      className="w-full rounded-t-sm bg-gradient-to-t from-zinc-900/90 to-zinc-400/80"
                    />
                  </div>
                )}

                {activeFilter === 'pressure' && (
                  <div className="absolute bottom-0 inset-x-1 flex flex-col items-center justify-end">
                    <span className="text-[11px] font-mono font-bold text-zinc-100 mb-1 leading-none">
                      {day.avgPressure}
                    </span>
                    <div
                      style={{ height: `${presBarPx}px` }}
                      className="w-full rounded-t-sm bg-gradient-to-t from-emerald-950/90 to-emerald-500/80"
                    />
                  </div>
                )}
              </div>

              {/* Below-Chart Details */}
              {activeFilter === 'precipitation' && (
                <div className="mt-1.5 flex flex-col items-center leading-tight">
                  <span className={`text-xs font-extrabold ${day.rainProb >= 50 ? 'text-sky-400' : 'text-zinc-300'}`}>
                    {day.rainProb}%
                  </span>
                  <span className="text-[10px] font-mono text-sky-300/85">
                    {day.rainAmountLabel}
                  </span>
                  <span
                    className="text-[10px] font-mono text-amber-300/90 mt-0.5"
                    title="Feels like High / Low"
                  >
                    {day.maxFeels}°/{day.minFeels}°
                  </span>
                </div>
              )}

              {/* Icon Row (Weather Icon for Precip/Pressure, Wind Direction Arrow for Wind) */}
              <div className="w-9 h-9 flex items-center justify-center my-1">
                {activeFilter === 'wind' ? (
                  <img
                    src={downArrowIcon}
                    alt={`${getCardinalWindDirection(day.windDirDeg)} wind direction`}
                    className="w-5 h-5 object-contain brightness-0 invert opacity-90"
                    style={{ transform: `rotate(${day.windDirDeg}deg)` }}
                  />
                ) : (
                  <WeatherIcon iconName={day.icon} isNight={day.isNight} className="w-9 h-9" />
                )}
              </div>

              {/* Day Label */}
              <span className={`text-[11px] font-bold tracking-tight ${day.isToday ? 'text-amber-400' : 'text-zinc-300'}`}>
                {day.isToday ? 'Today' : day.dayLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3 Filter Pills: Precipitation %, Wind km/h, Pressure hPa */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-zinc-800/80 overflow-x-auto scrollbar-none">
        {[
          { id: 'precipitation', label: 'Precipitation', unitLabel: '%' },
          { id: 'wind', label: 'Wind', unitLabel: windUnit },
          { id: 'pressure', label: 'Pressure', unitLabel: 'hPa' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 inline-flex items-baseline gap-1 ${
              activeFilter === tab.id
                ? 'bg-zinc-900 text-white border border-zinc-500 font-bold shadow-sm'
                : 'bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] text-zinc-400 font-normal">{tab.unitLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(MobileDailyForecast);
