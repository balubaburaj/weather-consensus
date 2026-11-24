import React from 'react';
import { formatTemp, formatTime } from '../../utils/units';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo, getRainHumanType } from '../../constants/providers';
import WeatherHouse3D from '../WeatherHouse3D';

export default function MobileHeroCard({
  currentWeather,
  isCurrentlyRaining,
  selectedCity,
  dailySummary,
  unit = 'C',
  timeFormat = '24h',
}) {
  if (!currentWeather) return null;

  const temp = currentWeather.temperature !== null ? Math.round(currentWeather.temperature) : '--';
  const feels = currentWeather.apparentTemperature !== null ? Math.round(currentWeather.apparentTemperature) : temp;
  const weatherCode = currentWeather.weatherCode || 0;
  const precip = currentWeather.precipitation || 0;
  const weatherInfo = resolveSmartWeatherInfo(weatherCode, isCurrentlyRaining ? 85 : 10, precip);
  const rainInfo = getRainHumanType(precip, isCurrentlyRaining ? 85 : 0, weatherCode);

  const minTemp = dailySummary?.minTemp !== undefined ? Math.round(dailySummary.minTemp) : temp - 2;
  const maxTemp = dailySummary?.maxTemp !== undefined ? Math.round(dailySummary.maxTemp) : temp + 4;

  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D Model Scene Backdrop (Replaces stock photo per user direction) */}
      <div className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
        <WeatherHouse3D
          currentWeather={currentWeather}
          isCurrentlyRaining={isCurrentlyRaining}
          selectedCity={selectedCity}
          showControls={false}
          className="w-full h-full border-none rounded-none"
        />

        {/* Gradient shadow overlay for crystal-clear readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-16 pointer-events-none bg-gradient-to-b from-slate-950/70 to-transparent" />

        {/* Bottom-left Hero Information Overlay (Matching Reference Design) */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex items-end justify-between">
          <div>
            {/* Big Temperature */}
            <div className="flex items-start">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg font-mono">
                {temp}°
              </span>
              <span className="text-sm font-bold text-slate-300 ml-1 mt-2">
                {unit === 'F' ? 'F' : 'C'}
              </span>
            </div>

            {/* Condition with Icon */}
            <div className="flex items-center gap-2 mt-0.5">
              <WeatherIcon iconName={weatherInfo.icon} className="w-5 h-5 text-cyan-300 drop-shadow" />
              <span className="text-sm font-semibold text-slate-100 drop-shadow">
                {weatherInfo.label}
              </span>
            </div>

            {/* City Label */}
            <div className="text-xs font-bold text-slate-300 tracking-wide mt-0.5 flex items-center gap-1.5 drop-shadow">
              <span>{selectedCity?.name || 'Cork'}</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedCity?.admin1 || selectedCity?.country || 'Ireland'}
              </span>
            </div>
          </div>

          {/* Timestamp / Live Pulse Indicator */}
          <div className="text-right pb-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[10px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* High/Low Bar & Daily Status Strip (Section 3 of Reference Design) */}
      <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 font-mono font-bold text-slate-200">
            <span className="text-amber-400">&uarr;</span>
            <span>{maxTemp}°</span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-cyan-400">&darr;</span>
            <span>{minTemp}°</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <WeatherIcon iconName={rainInfo.icon} className="w-4 h-4 text-cyan-400" />
            <span className="truncate max-w-[130px] sm:max-w-none">
              {isCurrentlyRaining ? rainInfo.label : 'Dry Roads'}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          {todayDateStr}
        </div>
      </div>
    </div>
  );
}
