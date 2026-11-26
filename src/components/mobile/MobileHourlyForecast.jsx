import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatTime, formatWind, getCardinalWindDirection } from '../../utils/units';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo } from '../../constants/providers';
import downArrowIcon from '../../../user_references/down-arrows.png';

function MobileHourlyForecast({
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

  const displayHours = useMemo(() => {
    if (!hours || hours.length === 0) return [];
    const currentIdx = hours.findIndex((h) => h.isCurrent);
    const startIdx = currentIdx !== -1 ? currentIdx : 0;
    return hours.slice(startIdx, startIdx + 24);
  }, [hours]);

  const itemWidth = 64;
  const svgWidth = displayHours.length * itemWidth;
  const svgHeight = 104;
  const topPadding = activeMetric === 'precipitation' ? 46 : 38;
  const bottomPadding = 16;
  const usableHeight = svgHeight - topPadding - bottomPadding;

  // Memoize 24h point data & SVG bezier paths so horizontal scroll selection ticks do zero geometry recompute
  const { points, pathD, fillD, maxPrecipDisplay } = useMemo(() => {
    if (displayHours.length === 0) {
      return { points: [], pathD: '', fillD: '', maxPrecipDisplay: '' };
    }

    const dataPoints = displayHours.map((h, i) => {
      const consensus = h.consensus || {};
      const actual = h.actual || {};
      const timeLabel = formatTime(h.hourLabel || h.timeIso, timeFormat, false);

      let val = 0;
      let label = '';
      let feelsVal = null;
      let feelsLabel = '';
      let probLabel = '';

      const code = consensus.weatherCode !== undefined && consensus.weatherCode !== null ? consensus.weatherCode : (actual.weatherCode ?? 2);
      const prob = consensus.precipitationProbability !== undefined ? consensus.precipitationProbability : (actual.precipitationProbability || 0);
      const rainMm = consensus.precipitation !== undefined ? consensus.precipitation : (actual.precipitation || 0);
      const isDay = h.isDay !== undefined ? Boolean(h.isDay) : true;
      const cloudCover = consensus.cloudCover ?? actual.cloudCover ?? null;
      const smartInfo = resolveSmartWeatherInfo(code, rainMm > 0 || prob >= 40 ? prob : 0, rainMm, isDay, cloudCover);
      let icon = smartInfo.icon || 'Cloud';

      const tRaw = consensus.temperature !== undefined ? consensus.temperature : (actual.temperature || 10);
      const fRaw = consensus.apparentTemperature !== undefined ? consensus.apparentTemperature : (actual.apparentTemperature !== undefined ? actual.apparentTemperature : tRaw);
      const windDirDeg = actual.windDirection !== undefined ? actual.windDirection : (consensus.windDirection ?? 160);
      const prevHour = i > 0 ? displayHours[i - 1] : null;
      const isMidnightBoundary =
        i > 0 &&
        ((h.date && prevHour?.date && h.date !== prevHour.date) ||
          (h.timeIso && h.timeIso.includes('T00:')));
      const nextDayLabel =
        isMidnightBoundary && h.date
          ? new Date(`${h.date}T12:00:00`).toLocaleDateString('en-IE', { weekday: 'short' }).toUpperCase()
          : isMidnightBoundary
          ? 'NEXT'
          : null;

      if (activeMetric === 'temperature') {
        val = unit === 'F' ? Math.round((tRaw * 9) / 5 + 32) : Math.round(tRaw);
        label = `${val}°`;
        feelsVal = unit === 'F' ? Math.round((fRaw * 9) / 5 + 32) : Math.round(fRaw);
        feelsLabel = `${feelsVal}°`;
      } else if (activeMetric === 'precipitation') {
        const probPct = Math.round(prob);
        probLabel = `${probPct}%`;
        if (unit === 'F') {
          const rainIn = rainMm * 0.03937;
          val = rainIn;
          label = rainIn >= 0.01 ? `${rainIn.toFixed(2)}in` : '0in';
        } else {
          val = rainMm;
          label = rainMm >= 0.05 ? `${rainMm.toFixed(1)}mm` : '0mm';
        }
        if (smartInfo.category === 'rain' || smartInfo.category === 'storm' || smartInfo.category === 'snow') {
          icon = smartInfo.icon;
        } else {
          icon = probPct > 60 ? 'moderate_rain' : (probPct > 40 ? 'drizzle' : (smartInfo.icon || 'Cloud'));
        }
      } else if (activeMetric === 'wind') {
        const w = consensus.windSpeed !== undefined && consensus.windSpeed !== null ? consensus.windSpeed : (actual.windSpeed || 15);
        val = unit === 'F' ? Math.round(w * 0.621371) : Math.round(w);
        label = `${val}`;
        icon = 'Wind';
      } else {
        const pRaw = actual.surfacePressure !== undefined && actual.surfacePressure !== null
          ? actual.surfacePressure
          : (consensus.surfacePressure ?? 1013);
        val = Math.round(pRaw);
        label = `${val}`;
      }

      return {
        index: i,
        hourLabel: timeLabel,
        val,
        label,
        feelsVal,
        feelsLabel,
        probLabel,
        windDirDeg,
        isMidnightBoundary,
        nextDayLabel,
        icon,
        isDay,
        isNow: i === 0 && h.isCurrent,
        rawHour: h,
      };
    });

    const values = dataPoints.map((d) => d.val);
    const minVal = activeMetric === 'precipitation' ? 0 : Math.min(...values);
    const maxVal = activeMetric === 'precipitation'
      ? Math.max(unit === 'F' ? 0.05 : 1, ...values)
      : Math.max(...values);
    const range = maxVal - minVal || 1;
    const maxDisp = activeMetric === 'precipitation'
      ? (unit === 'F' ? `${maxVal.toFixed(2)} in` : `${maxVal.toFixed(1)} mm`)
      : '';

    const pts = dataPoints.map((d, i) => {
      const x = i * itemWidth + itemWidth / 2;
      const normalized = (d.val - minVal) / range;
      const y = topPadding + (1 - normalized) * usableHeight;
      return { x, y, ...d };
    });

    let line = '';
    let fill = '';
    if (pts.length > 0) {
      line = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const curr = pts[i];
        const next = pts[i + 1];
        const cpX = curr.x + (next.x - curr.x) / 2;
        line += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
      }
      fill = `${line} L ${pts[pts.length - 1].x} ${svgHeight} L ${pts[0].x} ${svgHeight} Z`;
    }

    return { points: pts, pathD: line, fillD: fill, maxPrecipDisplay: maxDisp };
  }, [displayHours, activeMetric, unit, timeFormat, itemWidth, svgHeight, topPadding, usableHeight]);

  if (points.length === 0) return null;

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
  const windKmh = aConsensus.windSpeed !== undefined && aConsensus.windSpeed !== null ? aConsensus.windSpeed : (aActual.windSpeed || 13);
  const windDirDeg = aActual.windDirection !== undefined ? aActual.windDirection : (aConsensus.windDirection || 160);
  const windDir = getCardinalWindDirection(windDirDeg);

  // Inspector Weather Condition
  const aCode = aConsensus.weatherCode !== undefined && aConsensus.weatherCode !== null ? aConsensus.weatherCode : (aActual.weatherCode ?? 2);
  const aPrecipProb = aConsensus.precipitationProbability !== undefined ? aConsensus.precipitationProbability : (aActual.precipitationProbability || 0);
  const aPrecipAmount = aConsensus.precipitation !== undefined ? aConsensus.precipitation : (aActual.precipitation || 0);
  const aPrecipPct = Math.round(aPrecipProb);
  const aPrecipAmountLabel = unit === 'F'
    ? `${aPrecipAmount >= 0.1 ? (aPrecipAmount * 0.03937).toFixed(2) : '0'} in`
    : `${aPrecipAmount >= 0.05 ? aPrecipAmount.toFixed(1) : '0'} mm`;
  const aIsDay = activeRaw.isDay !== undefined ? Boolean(activeRaw.isDay) : true;
  const aCloud = aConsensus.cloudCover ?? aActual.cloudCover ?? null;
  const aInfo = resolveSmartWeatherInfo(aCode, aPrecipProb, aPrecipAmount, aIsDay, aCloud);

  // Horizontal scrub / scroll listener: glides selection from hour 0 (left) to last hour (right)
  const handleScroll = (e) => {
    if (isAutoScrolling.current) return;
    const el = e.currentTarget;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollLeft / maxScroll)) : 0;
    const newIdx = Math.min(
      displayHours.length - 1,
      Math.max(0, Math.round(progress * (displayHours.length - 1)))
    );
    if (newIdx !== selectedHourIndex) {
      setSelectedHourIndex(newIdx);
    }
  };

  const handleSelectHour = (i) => {
    setSelectedHourIndex(i);
    if (scrollContainerRef.current && displayHours.length > 1) {
      isAutoScrolling.current = true;
      const el = scrollContainerRef.current;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const targetScroll = (i / (displayHours.length - 1)) * maxScroll;
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 450);
    }
  };

  const METRIC_COLORS = {
    temperature: { stroke: '#fbbf24', grad: '#f59e0b' },
    precipitation: { stroke: '#38bdf8', grad: '#0284c7' },
    wind: { stroke: '#c084fc', grad: '#9333ea' },
    pressure: { stroke: '#10b981', grad: '#059669' },
  };
  const { stroke: strokeColor, grad: gradColor } = METRIC_COLORS[activeMetric] || METRIC_COLORS.temperature;

  return (
    <div className="rounded-3xl border border-zinc-800/90 bg-[#111113] p-3.5 sm:p-4 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <h3 className="text-base font-extrabold text-white tracking-wide">
            Hourly
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-300">
            24h
          </span>
          {activeMetric === 'temperature' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 ml-1">
              <span className="w-2 h-2 rounded-full bg-zinc-100" />
              <span>Temp</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
              <span className="text-amber-400">Feels</span>
            </span>
          )}
          {activeMetric === 'precipitation' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 ml-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{unit === 'F' ? 'in' : 'mm'}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-sky-300">% chance</span>
            </span>
          )}
          {activeMetric === 'wind' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 ml-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{unit === 'F' ? 'mph' : 'km/h'}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-purple-300">direction</span>
            </span>
          )}
          {activeMetric === 'pressure' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300">hPa</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenDetailedHourly}
          className="p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
          title="View comprehensive 24h hourly breakdown"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top Inspector Box (Fixed single-row lines so horizontal scrolling never jumps) */}
      <div className="rounded-2xl bg-black/75 border border-zinc-800/80 p-3 mb-2.5 shadow-inner">
        {/* Row 1: Badges (strict single line, never wraps) */}
        <div className="flex items-center justify-between gap-1.5 mb-2 flex-nowrap">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Condition badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-zinc-800 text-zinc-100 border border-zinc-700/80 truncate">
              {aInfo.shortLabel || aInfo.label || 'Overcast'}
            </span>

            {/* Precipitation Chance & Amount Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                aPrecipPct >= 50 || aPrecipAmount >= 0.2
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
              title="Precipitation chance and amount"
            >
              <span>💧</span>
              <span>{aPrecipPct}%</span>
              <span className="text-zinc-500">&bull;</span>
              <span>{aPrecipAmountLabel}</span>
            </span>
          </div>

          {/* Wind badge */}
          <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-zinc-900 text-zinc-200 border border-zinc-800 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
            <span>💨</span>
            <span>{formatWind(windKmh, unit)} {windDir}</span>
          </span>
        </div>

        {/* Row 2: Big Temp + Feels Like + Wind Chill (strict single row, fixed height) */}
        <div className="flex items-center justify-between gap-1.5 flex-nowrap min-h-[38px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight leading-none shrink-0">
              {tDisp}{tempUnit}
            </span>
            <span className="text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm whitespace-nowrap shrink-0">
              Feels {feelsDisp}{tempUnit}
            </span>
          </div>

          {/* Wind Chill / Heat Index Delta Badge */}
          {chillBadgeText !== 'Matched' && (
            <span className="px-2 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-[10px] sm:text-[11px] font-semibold text-zinc-300 whitespace-nowrap shrink-0">
              {chillBadgeText}
            </span>
          )}
        </div>

        {/* Row 3: Condition Subtitle (full width, single line) */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/80 min-w-0">
          <WeatherIcon iconName={aInfo.icon} isNight={activeRaw.isDay === false} className="w-8 h-8 shrink-0" />
          <span className="text-sm font-bold text-zinc-100 truncate">
            {aInfo.label}
          </span>
          <span className="text-zinc-500 text-xs shrink-0">&bull;</span>
          <span className="text-xs text-zinc-300 font-mono font-semibold whitespace-nowrap shrink-0">
            {activePoint.isNow ? 'Now' : activePoint.hourLabel}
          </span>
        </div>
      </div>

      {/* Horizontal Swipeable Chart Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-2 -mx-2 px-2 scroll-smooth"
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
                  {/* Midnight / Next-Day Divider centered on 12 AM mark */}
                  {p.isMidnightBoundary && (
                    <g>
                      <line
                        x1={p.x}
                        y1={13}
                        x2={p.x}
                        y2={svgHeight}
                        stroke="#22d3ee"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        strokeOpacity="0.45"
                      />
                      <text
                        x={p.x}
                        y={9}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-extrabold select-none"
                        fill="#67e8f9"
                      >
                        {p.nextDayLabel}
                      </text>
                    </g>
                  )}

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
                    stroke="#000000"
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
                        className={`text-[15px] font-black tracking-tight ${
                          isSelected ? 'fill-white' : 'fill-zinc-100'
                        }`}
                        fill={isSelected ? '#ffffff' : '#f4f4f5'}
                      >
                        {p.label}
                      </tspan>
                      <tspan
                        dx="4"
                        className="text-[13px] font-extrabold fill-amber-400"
                        fill="#fbbf24"
                      >
                        {p.feelsLabel}
                      </tspan>
                    </text>
                  ) : activeMetric === 'precipitation' ? (
                    <text
                      x={p.x}
                      y={p.y - 7}
                      textAnchor="middle"
                      className="font-mono select-none"
                    >
                      <tspan
                        x={p.x}
                        dy="-11"
                        className={`text-[12px] font-black tracking-tight ${
                          isSelected ? 'fill-white' : 'fill-zinc-100'
                        }`}
                        fill={isSelected ? '#ffffff' : '#f4f4f5'}
                      >
                        {p.label}
                      </tspan>
                      <tspan
                        x={p.x}
                        dy="11"
                        className="text-[10px] font-bold"
                        fill={isSelected ? '#7dd3fc' : '#38bdf8'}
                      >
                        {p.probLabel}
                      </tspan>
                    </text>
                  ) : (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      className={`text-[13px] font-mono font-bold select-none ${
                        isSelected ? 'fill-white' : 'fill-zinc-300'
                      }`}
                      fill={isSelected ? '#ffffff' : '#d4d4d8'}
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
                      ? 'bg-zinc-800/90 border border-amber-400/50 shadow-lg scale-105'
                      : p.isMidnightBoundary
                      ? 'bg-cyan-950/30 hover:bg-cyan-900/35 border border-cyan-500/35'
                      : 'hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {activeMetric === 'wind' ? (
                      <img
                        src={downArrowIcon}
                        alt={`${getCardinalWindDirection(p.windDirDeg)} wind`}
                        className={`w-6 h-6 object-contain brightness-0 invert transition-transform ${
                          isSelected ? 'opacity-100' : 'opacity-85'
                        }`}
                        style={{ transform: `rotate(${p.windDirDeg}deg)` }}
                      />
                    ) : (
                      <WeatherIcon
                        iconName={p.icon}
                        isNight={!p.isDay}
                        className="w-10 h-10 transition-colors"
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold mt-1 truncate ${
                      p.isMidnightBoundary
                        ? 'px-1.5 rounded bg-cyan-500/20 text-cyan-300'
                        : isSelected
                        ? 'text-amber-300'
                        : p.isNow
                        ? 'text-white'
                        : 'text-zinc-300'
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

      {/* Metric Filter Pills */}
      <div className="flex items-center justify-between gap-1.5 pt-3 mt-1 border-t border-zinc-800/80 overflow-x-auto scrollbar-none">
        {[
          { id: 'temperature', label: 'Temperature' },
          { id: 'precipitation', label: 'Precipitation' },
          { id: 'wind', label: 'Wind' },
          { id: 'pressure', label: 'Pressure' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMetric(tab.id)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeMetric === tab.id
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(MobileHourlyForecast);
