import React, { useState } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { formatTime } from '../../utils/units';
import { WeatherIcon } from '../../utils/weatherIcons';

export default function MobileHourlyForecast({
  hours = [],
  unit = 'C',
  timeFormat = '24h',
}) {
  const [activeMetric, setActiveMetric] = useState('temperature'); // 'temperature' | 'precipitation' | 'wind'

  if (!hours || hours.length === 0) return null;

  // Take next 18-24 hours from current or upcoming
  const currentIdx = hours.findIndex((h) => h.isCurrent);
  const startIdx = currentIdx !== -1 ? currentIdx : 0;
  const displayHours = hours.slice(startIdx, startIdx + 20);

  if (displayHours.length === 0) return null;

  // Extract values based on active metric
  const dataPoints = displayHours.map((h, i) => {
    const consensus = h.consensus || {};
    const actual = h.actual || {};
    const timeLabel = formatTime(h.hourLabel || h.timeIso, timeFormat, false);

    let val = 0;
    let label = '';
    let icon = consensus.weatherIcon || 'Cloud';

    if (activeMetric === 'temperature') {
      const t = consensus.temperature !== undefined ? consensus.temperature : (actual.temperature || 10);
      val = Math.round(t);
      label = `${val}°`;
    } else if (activeMetric === 'precipitation') {
      const p = consensus.precipitationProbability !== undefined ? consensus.precipitationProbability : (actual.precipitationProbability || 0);
      val = Math.round(p);
      label = `${val}%`;
      icon = val > 40 ? 'CloudRain' : (val > 15 ? 'CloudDrizzle' : 'CloudSun');
    } else {
      // Wind
      const w = actual.windSpeed !== undefined ? actual.windSpeed : 18;
      val = Math.round(w);
      label = `${val}`;
      icon = 'Wind';
    }

    return {
      index: i,
      hourLabel: timeLabel,
      val,
      label,
      icon,
      isNow: i === 0,
    };
  });

  const values = dataPoints.map((d) => d.val);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // SVG dimensions for smooth curve
  const itemWidth = 58;
  const svgWidth = dataPoints.length * itemWidth;
  const svgHeight = 70;
  const topPadding = 18;
  const bottomPadding = 14;
  const usableHeight = svgHeight - topPadding - bottomPadding;

  const points = dataPoints.map((d, i) => {
    const x = i * itemWidth + itemWidth / 2;
    // Normalized y: higher value is higher up (lower y coordinate)
    const normalized = (d.val - minVal) / range;
    const y = topPadding + (1 - normalized) * usableHeight;
    return { x, y, ...d };
  });

  // Build smooth bezier curve path
  let pathD = '';
  let fillD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    // Closed path for subtle golden gradient fill underneath curve
    fillD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Hourly
          </h3>
        </div>
        <div className="p-1 rounded-full bg-slate-800 text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Horizontal Swipeable Chart Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 pb-2 -mx-2 px-2">
        <div style={{ width: `${svgWidth}px` }} className="relative select-none">
          {/* Curve SVG */}
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            <defs>
              <linearGradient id="hourlyCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled area underneath curve */}
            {fillD && <path d={fillD} fill="url(#hourlyCurveGrad)" />}

            {/* Connecting curve line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Value Labels & Glow Points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
                <text
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-bold fill-slate-100"
                >
                  {p.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Weather Icons Row */}
          <div className="flex items-center pt-2">
            {points.map((p, i) => (
              <div
                key={i}
                style={{ width: `${itemWidth}px` }}
                className="flex flex-col items-center justify-center shrink-0"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <WeatherIcon iconName={p.icon} className="w-5 h-5 text-slate-300" />
                </div>
                <span className={`text-[11px] font-medium mt-1.5 ${p.isNow ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                  {p.isNow ? 'Now' : p.hourLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Filter Pills (Matching Section 4 of Reference Design) */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveMetric('temperature')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            activeMetric === 'temperature'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Temperature
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('precipitation')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            activeMetric === 'precipitation'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Precipitation
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('wind')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            activeMetric === 'wind'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          Wind
        </button>
      </div>
    </div>
  );
}
