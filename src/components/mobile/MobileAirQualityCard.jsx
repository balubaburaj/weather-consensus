import React from 'react';
import { Wind, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function MobileAirQualityCard({ airQuality }) {
  const aqi = airQuality?.aqi !== undefined ? airQuality.aqi : 20;
  const status = airQuality?.status || 'Good';
  const advice = airQuality?.advice || 'Ideal air quality for all outdoor activities.';
  const color = airQuality?.color || 'emerald';
  const hourly = airQuality?.hourly || [];

  // Circle progress calculation (circumference of r=32 is ~201)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  // European AQI scale: 0-100 max
  const progressPct = Math.min(100, (aqi / 80) * 100);
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Air Quality
          </h3>
        </div>
        <div className="p-1 rounded-full bg-slate-800 text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Main AQI Gauge & Advice */}
      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 mb-3">
        {/* Circular Gauge */}
        <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
          <svg className="w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              className="text-slate-800"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-emerald-400 transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black font-mono text-white leading-none">
              {aqi}
            </span>
            <span className="text-[9px] font-bold text-slate-400">AQI</span>
          </div>
        </div>

        {/* Text Status & Advice */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {status}
            </span>
            <span className="text-xs font-bold text-slate-200">European AQI</span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            {advice}
          </p>
        </div>
      </div>

      {/* Hourly AQI Mini-Bar Chart (if hourly data available) */}
      {hourly.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
            <span>24h AQI Trend</span>
            <span className="text-emerald-400 font-semibold">Low Pollution</span>
          </div>
          <div className="flex items-end justify-between gap-1 h-8">
            {hourly.slice(0, 16).map((val, i) => {
              const hPct = Math.min(100, Math.max(15, (val / 50) * 100));
              return (
                <div
                  key={i}
                  style={{ height: `${hPct}%` }}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-600/60 to-emerald-400/80"
                  title={`Hour +${i}: AQI ${val}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
