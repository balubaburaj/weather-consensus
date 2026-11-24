import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatTime, formatWind, getCardinalWindDirection } from '../../utils/units';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo } from '../../constants/providers';

export default function MobileHourlyForecast({
  hours = [],
  dailySummary,
  unit = 'C',
  timeFormat = '24h',
  onOpenDetailedHourly,
}) {
  const [activeMetric, setActiveMetric] = useState('temperature'); // 'temperature' | 'precipitation' | 'wind'
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const isAutoScrolling = useRef(false);

  if (!hours || hours.length === 0) return null;

  // Take next 24 hours starting from current (or first upcoming)
  const currentIdx = hours.findIndex((h) => h.isCurrent);
  const startIdx = currentIdx !== -1 ? currentIdx : 0;
  const displayHours = hours.slice(startIdx, startIdx + 24);

  if (displayHours.length === 0) return null;

  const itemWidth = 62;
  const svgWidth = displayHours.length * itemWidth;
  const svgHeight = 82;
  const topPadding = 24;
  const bottomPadding = 16;
  const usableHeight = svgHeight - topPadding - bottomPadding;

  // Extract values based on active metric
  const dataPoints = displayHours.map((h, i) => {
    const consensus = h.consensus || {};
    const actual = h.actual || {};
    const timeLabel = formatTime(h.hourLabel || h.timeIso, timeFormat, false);

    let val = 0;
    let label = '';
    let feelsVal = null;
    let feelsLabel = '';

    const code = consensus.weatherCode !== undefined ? consensus.weatherCode : (actual.weatherCode || 0);
    const prob = consensus.precipitationProbability !== undefined ? consensus.precipitationProbability : (actual.precipitationProbability || 0);
    const rainMm = consensus.precipitation !== undefined ? consensus.precipitation : (actual.precipitation || 0);
    const smartInfo = resolveSmartWeatherInfo(code, rainMm > 0 || prob >= 40 ? prob : 0, rainMm);
    let icon = smartInfo.icon || 'Cloud';

    const tRaw = consensus.temperature !== undefined ? consensus.temperature : (actual.temperature || 10);
    const fRaw = consensus.apparentTemperature !== undefined ? consensus.apparentTemperature : (actual.apparentTemperature !== undefined ? actual.apparentTemperature : tRaw);

    if (activeMetric === 'temperature') {
      val = unit === 'F' ? Math.round((tRaw * 9) / 5 + 32) : Math.round(tRaw);
      label = `${val}°`;
      feelsVal = unit === 'F' ? Math.round((fRaw * 9) / 5 + 32) : Math.round(fRaw);
      feelsLabel = `${feelsVal}°`;
    } else if (activeMetric === 'precipitation') {
      val = Math.round(prob);
      label = `${val}%`;
      if (smartInfo.category === 'rain' || smartInfo.category === 'storm' || smartInfo.category === 'snow') {
        icon = smartInfo.icon;
      } else {
        icon = val > 60 ? 'moderate_rain' : (val > 40 ? 'drizzle' : (smartInfo.icon || 'Cloud'));
      }
    } else {
      // Wind
      const w = consensus.windSpeed !== undefined ? consensus.windSpeed : (actual.windSpeed || 15);
      val = unit === 'F' ? Math.round(w * 0.621371) : Math.round(w);
      label = `${val}`;
      icon = 'Wind';
    }

    return {
      index: i,
      hourLabel: timeLabel,
      val,
      label,
      feelsVal,
      feelsLabel,
      icon,
      isDay: h.isDay !== undefined ? Boolean(h.isDay) : true,
      isNow: i === 0 && h.isCurrent,
      rawHour: h,
    };
  });

  const values = dataPoints.map((d) => d.val);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = dataPoints.map((d, i) => {
    const x = i * itemWidth + itemWidth / 2;
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
    fillD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;
  }

  // Active Selected Hour Details for the Top Inspector Card
  const activePoint = points[selectedHourIndex] || points[0];
  const activeRaw = activePoint.rawHour || {};
  const aConsensus = activeRaw.consensus || {};
  const aActual = activeRaw.actual || {};

  // Inspector Temperature
  const tRaw = aConsensus.temperature !== undefined ? aConsensus.temperature : (aActual.temperature !== undefined ? aActual.temperature : 10);
  const tDisp = unit === 'F' ? Math.round(((tRaw * 9) / 5 + 32) * 10) / 10 : Math.round(tRaw * 10) / 10;
  const tempUnit = unit === 'F' ? '°F' : '°C';

  // Inspector Feels Like
  const feelsRaw = aConsensus.apparentTemperature !== undefined ? aConsensus.apparentTemperature : (aActual.apparentTemperature !== undefined ? aActual.apparentTemperature : tRaw);
  const feelsDisp = unit === 'F' ? Math.round(((feelsRaw * 9) / 5 + 32) * 10) / 10 : Math.round(feelsRaw * 10) / 10;

  // Wind chill or heat index difference
  const chillDelta = Math.round(Math.abs(tRaw - feelsRaw) * 10) / 10;
  let chillBadgeText = 'Matched';
  if (tRaw - feelsRaw >= 0.5) {
    chillBadgeText = `${chillDelta}° Wind Chill`;
  } else if (feelsRaw - tRaw >= 0.5) {
    chillBadgeText = `${chillDelta}° Heat Index`;
  }

  // Wind speed & compass direction
  const windKmh = aConsensus.windSpeed !== undefined ? aConsensus.windSpeed : (aActual.windSpeed || 13);
  const windDirDeg = aActual.windDirection !== undefined ? aActual.windDirection : (aConsensus.windDirection || 160);
  const windDir = getCardinalWindDirection(windDirDeg);

  // Inspector Weather Condition
  const aCode = aConsensus.weatherCode !== undefined ? aConsensus.weatherCode : (aActual.weatherCode || 0);
  const aPrecipProb = aConsensus.precipitationProbability !== undefined ? aConsensus.precipitationProbability : (aActual.precipitationProbability || 0);
  const aPrecipAmount = aConsensus.precipitation !== undefined ? aConsensus.precipitation : (aActual.precipitation || 0);
  const aInfo = resolveSmartWeatherInfo(aCode, aPrecipProb, aPrecipAmount);

  // Daily high / low badge
  const dayMax = dailySummary?.maxTemp !== undefined ? Math.round(dailySummary.maxTemp) : Math.round(tRaw + 2);
  const dayMin = dailySummary?.minTemp !== undefined ? Math.round(dailySummary.minTemp) : Math.round(tRaw - 3);

  // Horizontal scrub / scroll listener
  const handleScroll = (e) => {
    if (isAutoScrolling.current) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    const newIdx = Math.min(
      displayHours.length - 1,
      Math.max(0, Math.round(scrollLeft / itemWidth))
    );
    if (newIdx !== selectedHourIndex) {
      setSelectedHourIndex(newIdx);
    }
  };

  const handleSelectHour = (i) => {
    setSelectedHourIndex(i);
    if (scrollContainerRef.current) {
      isAutoScrolling.current = true;
      const targetScroll = Math.max(
        0,
        i * itemWidth - scrollContainerRef.current.clientWidth / 2 + itemWidth / 2
      );
      scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 450);
    }
  };

  const strokeColor =
    activeMetric === 'temperature'
      ? '#fbbf24'
      : activeMetric === 'precipitation'
      ? '#38bdf8'
      : '#c084fc';

  const gradColor =
    activeMetric === 'temperature'
      ? '#f59e0b'
      : activeMetric === 'precipitation'
      ? '#0284c7'
      : '#9333ea';

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Hourly
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
            24h
          </span>
          {activeMetric === 'temperature' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span>Temp</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
              <span className="text-amber-400">Feels</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenDetailedHourly}
          className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
          title="View comprehensive 24h hourly breakdown"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top Inspector Box (Live Updates as user scrolls / taps hours) */}
      <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3.5 mb-3.5 shadow-inner">
        {/* Row 1: Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Condition badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {aInfo.shortLabel || aInfo.label || 'Overcast'}
            </span>

            {/* Wind badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
              <span>💨</span>
              <span>{formatWind(windKmh, unit)} {windDir}</span>
            </span>
          </div>

          {/* High / Low Day Badge */}
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/60 font-mono shrink-0">
            {dayMax}° / {dayMin}°
          </span>
        </div>

        {/* Row 2: Big Temp + Feels Like (Enlarged, same warm amber color as hero card) + Wind Chill */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {tDisp}{tempUnit}
            </span>
            <span className="text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm drop-shadow-md">
              Feels {feelsDisp}{tempUnit}
            </span>
          </div>

          {/* Wind Chill / Heat Index Delta Badge */}
          {chillBadgeText !== 'Matched' && (
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300 shrink-0">
              {chillBadgeText}
            </span>
          )}
        </div>

        {/* Row 3: Condition Subtitle */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
          <WeatherIcon iconName={aInfo.icon} isNight={activeRaw.isDay === false} className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-cyan-300">
            {aInfo.label}
          </span>
          <span className="text-slate-500 text-xs">&bull;</span>
          <span className="text-xs text-slate-400 font-mono">
            {activePoint.isNow ? 'Right Now' : activePoint.hourLabel}
          </span>
        </div>
      </div>

      {/* Horizontal Swipeable Chart Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 pb-2 -mx-2 px-2 scroll-smooth"
      >
        <div style={{ width: `${svgWidth}px` }} className="relative select-none">
          {/* Curve SVG */}
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            <defs>
              <linearGradient id="hourlyMetricGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={gradColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={gradColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled area underneath curve */}
            {fillD && <path d={fillD} fill="url(#hourlyMetricGrad)" />}

            {/* Connecting curve line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Value Labels & Points */}
            {points.map((p, i) => {
              const isSelected = i === selectedHourIndex;
              return (
                <g key={i}>
                  {/* Subtle active vertical column guide line */}
                  {isSelected && (
                    <line
                      x1={p.x}
                      y1={0}
                      x2={p.x}
                      y2={svgHeight}
                      stroke={strokeColor}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      strokeOpacity="0.4"
                    />
                  )}

                  {/* Halo around active selected point */}
                  {isSelected && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="9"
                      fill={strokeColor}
                      fillOpacity="0.25"
                    />
                  )}

                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? '5' : '3'}
                    fill={isSelected ? '#ffffff' : strokeColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                  {activeMetric === 'temperature' ? (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      className="font-mono select-none"
                    >
                      <tspan
                        className={`text-[13px] font-black tracking-tight ${
                          isSelected ? 'fill-white' : 'fill-slate-100'
                        }`}
                        fill={isSelected ? '#ffffff' : '#f1f5f9'}
                      >
                        {p.label}
                      </tspan>
                      <tspan
                        dx="3.5"
                        className="text-[11px] font-extrabold fill-amber-400"
                        fill="#fbbf24"
                      >
                        {p.feelsLabel}
                      </tspan>
                    </text>
                  ) : (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      className={`text-[12px] font-mono font-bold select-none ${
                        isSelected ? 'fill-white' : 'fill-slate-300'
                      }`}
                      fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Clickable transparent column hotspots across the entire SVG */}
            {points.map((p, i) => (
              <rect
                key={`hit-${i}`}
                x={i * itemWidth}
                y={0}
                width={itemWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => handleSelectHour(i)}
              />
            ))}
          </svg>

          {/* Weather Icons Row with Interactive Column Selection */}
          <div className="flex items-center pt-2">
            {points.map((p, i) => {
              const isSelected = i === selectedHourIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectHour(i)}
                  style={{ width: `${itemWidth}px` }}
                  className={`flex flex-col items-center justify-center shrink-0 py-1.5 px-1 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border border-amber-400/40 shadow-lg scale-105'
                      : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <WeatherIcon
                      iconName={p.icon}
                      isNight={!p.isDay}
                      className={`w-5 h-5 transition-colors ${
                        isSelected ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1 truncate ${
                      isSelected
                        ? 'text-amber-300 font-bold'
                        : p.isNow
                        ? 'text-white font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {p.isNow ? 'Now' : p.hourLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Filter Pills (Matching Section 4 of Reference Design) */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveMetric('temperature')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeMetric === 'temperature'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Temperature
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('precipitation')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeMetric === 'precipitation'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Precipitation
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('wind')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeMetric === 'wind'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Wind
        </button>
      </div>
    </div>
  );
}
