import React from 'react';
import { Sunrise, Sunset, Sun, Moon, ChevronRight } from 'lucide-react';
import { formatTime } from '../../utils/units';

export default function MobileSunMoonCard({
  currentWeather,
  timeFormat = '24h',
}) {
  if (!currentWeather) return null;

  const sunrise = formatTime(currentWeather.sunrise || '08:06', timeFormat);
  const sunset = formatTime(currentWeather.sunset || '16:33', timeFormat);
  const daylight = currentWeather.daylightDuration || '8h 27m';

  const moon = currentWeather.moon || {
    label: 'Waning Gibbous',
    illumination: 86,
    phase: 0.65,
  };

  // Calculate live sun position along arc (0.0 sunrise to 1.0 sunset)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sunriseParts = (currentWeather.sunrise || '08:06').split(':').map(Number);
  const sunsetParts = (currentWeather.sunset || '16:33').split(':').map(Number);
  const sunriseMin = sunriseParts[0] * 60 + sunriseParts[1];
  const sunsetMin = sunsetParts[0] * 60 + sunsetParts[1];

  let sunProgress = 0.5;
  if (currentMinutes <= sunriseMin) {
    sunProgress = 0.05;
  } else if (currentMinutes >= sunsetMin) {
    sunProgress = 0.95;
  } else {
    sunProgress = (currentMinutes - sunriseMin) / (sunsetMin - sunriseMin);
  }

  // Arc angle from PI to 0
  const angle = Math.PI * (1 - sunProgress);
  const arcRadius = 75;
  const sunX = 100 + arcRadius * Math.cos(angle);
  const sunY = 95 - arcRadius * Math.sin(angle);

  return (
    <div className="rounded-3xl border border-zinc-800/90 bg-[#111113] p-4 sm:p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Sun and Moon
          </h3>
        </div>
        <div className="p-1 rounded-full bg-zinc-800 text-zinc-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 1. Sun Daylight Arc Card */}
      <div className="p-3.5 rounded-2xl bg-black/75 border border-zinc-800/80 mb-3 relative overflow-hidden flex flex-col items-center">
        {/* SVG Arc Diagram */}
        <div className="relative w-[200px] h-[105px]">
          <svg viewBox="0 0 200 105" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* Background dashed arc */}
            <path
              d="M 25 95 A 75 75 0 0 1 175 95"
              fill="none"
              stroke="#27272a"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Colored arc path */}
            <path
              d="M 25 95 A 75 75 0 0 1 175 95"
              fill="none"
              stroke="url(#sunArcGrad)"
              strokeWidth="2.5"
            />

            {/* Glowing Sun Position Indicator */}
            <circle cx={sunX} cy={sunY} r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" className="drop-shadow-md animate-pulse" />
          </svg>

          {/* Central Daylight Info Badge */}
          <div className="absolute bottom-1 inset-x-0 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Daylight</span>
            <span className="text-xs font-black font-mono text-amber-300">{daylight}</span>
          </div>
        </div>

        {/* Sunrise & Sunset Timings Strip */}
        <div className="w-full flex items-center justify-between text-xs pt-1 px-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sunrise className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-tight">Sunrise</span>
              <span className="font-mono font-bold text-zinc-100">{sunrise}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-purple-300">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-tight">Sunset</span>
              <span className="font-mono font-bold text-zinc-100">{sunset}</span>
            </div>
            <Sunset className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </div>

      {/* 2. Moon Phase Card */}
      <div className="p-3.5 rounded-2xl bg-black/75 border border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Realistic Moon Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-700 shadow-md shadow-amber-500/10 flex items-center justify-center border border-zinc-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 rounded-full" />
            <div className="w-3 h-3 rounded-full bg-zinc-600/60 absolute top-2 left-2" />
            <div className="w-2 h-2 rounded-full bg-zinc-700/60 absolute bottom-3 right-3" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600/60 absolute top-6 right-2" />
            <Moon className="w-6 h-6 text-zinc-100 z-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-white block">
              {moon.label}
            </span>
            <span className="text-[11px] font-mono text-amber-300">
              {moon.illumination}% illuminated
            </span>
          </div>
        </div>

        <div className="text-right text-[11px] text-zinc-400">
          <div>Next Full Moon</div>
          <span className="font-bold text-zinc-200 font-mono">in 6 days</span>
        </div>
      </div>
    </div>
  );
}
