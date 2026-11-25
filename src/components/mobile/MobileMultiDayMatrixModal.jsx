import React, { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { WEATHER_PROVIDERS, PROVIDER_KEYS, resolveSmartWeatherInfo } from '../../constants/providers';
import { WeatherIcon } from '../../utils/weatherIcons';
import { formatTime } from '../../utils/units';

const COL_WIDTH = 58;
const CHUNK_COLS = 8;
const OVERSCAN_COLS = 18;

/**
 * Mobile Continuous Multi-Day Hourly Matrix
 * Displays TrueCast Consensus followed by every weather model in Weawow-style
 * horizontally scrollable 1-hour curve cards (Temperature + Feels Like, Precipitation, Wind).
 * Uses a single native compositor scroll container + chunked horizontal windowing for 60/120fps scrolling.
 */
export default function MobileMultiDayMatrixModal({
  hours = [],
  selectedCity,
  unit = 'C',
  timeFormat = '24h',
  onClose,
}) {
  const [activeMetric, setActiveMetric] = useState('temperature'); // 'temperature' | 'precipitation' | 'wind'
  const scrollContainerRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.max(300, window.innerWidth - 20) : 370
  );
  const [scrollChunk, setScrollChunk] = useState(0);

  // Start from current hour onward for continuous multi-day forecast (1-hour intervals)
  const displayHours = useMemo(() => {
    if (!hours || hours.length === 0) return [];
    const currentIdx = hours.findIndex((h) => h.isCurrent);
    const startIdx = currentIdx !== -1 ? currentIdx : 0;
    return hours.slice(startIdx);
  }, [hours]);

  // Track visible scroll container width for sticky card headers and column windowing
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return undefined;
    const updateWidth = () => {
      if (el.clientWidth > 0) setViewportWidth(el.clientWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Group hours by calendar date for the floating/sliding date header (matching Daily Graph)
  const dayGroups = useMemo(() => {
    const groups = [];
    displayHours.forEach((h) => {
      const dateStr = h.date || (h.timeIso ? h.timeIso.split('T')[0] : 'unknown');
      let last = groups[groups.length - 1];
      if (!last || last.dateStr !== dateStr) {
        const d = dateStr !== 'unknown' ? new Date(`${dateStr}T12:00:00`) : new Date();
        const weekday = d.toLocaleDateString('en-IE', { weekday: 'short' });
        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString('en-IE', { month: 'short' });
        last = {
          dateStr,
          count: 0,
          pill: { weekday, rest: `${dayNum}. ${monthShort}.` },
        };
        groups.push(last);
      }
      last.count += 1;
    });
    return groups;
  }, [displayHours]);

  // Only trigger a React state update when horizontal scroll crosses a CHUNK_COLS boundary (~348px)
  const handleContainerScroll = useCallback((e) => {
    const nextChunk = Math.floor(e.currentTarget.scrollLeft / (CHUNK_COLS * COL_WIDTH));
    setScrollChunk((prev) => (prev === nextChunk ? prev : nextChunk));
  }, []);

  const handleJumpToNow = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, []);

  // Visible window of hour columns + generous overscan so scrolling never clips
  const { windowStart, windowEnd } = useMemo(() => {
    const visibleCols = Math.ceil(viewportWidth / COL_WIDTH);
    const start = Math.max(0, scrollChunk * CHUNK_COLS - OVERSCAN_COLS);
    const end = Math.min(
      Math.max(0, displayHours.length - 1),
      (scrollChunk + 1) * CHUNK_COLS + visibleCols + OVERSCAN_COLS
    );
    return { windowStart: start, windowEnd: end };
  }, [scrollChunk, viewportWidth, displayHours.length]);

  // Build ordered list: TrueCast Consensus first, then all configured NWP models
  const providerRows = useMemo(() => {
    const rows = [
      {
        id: 'consensus',
        name: 'TrueCast Consensus',
        badge: 'Weighted Consensus',
        color: '#fbbf24',
        isConsensus: true,
      },
    ];
    PROVIDER_KEYS.forEach((key) => {
      const meta = WEATHER_PROVIDERS[key];
      if (meta) {
        rows.push({
          id: key,
          name: meta.name,
          badge: meta.tag,
          color: meta.color || '#a1a1aa',
          isConsensus: false,
        });
      }
    });
    return rows;
  }, []);

  const colWidth = COL_WIDTH;
  const svgWidth = Math.max(300, displayHours.length * colWidth);
  const svgHeight = 64;
  const topPadding = 22;
  const bottomPadding = 10;
  const usableHeight = svgHeight - topPadding - bottomPadding;

  const windUnit = unit === 'F' ? 'mph' : 'km/h';
  const precipUnit = unit === 'F' ? 'in' : 'mm';

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col overflow-hidden select-none animate-fade-in font-sans">
      {/* Top App Bar */}
      <div className="shrink-0 bg-black/95 border-b border-zinc-800/90 px-4 pt-3 pb-2.5 z-50">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-zinc-800 text-zinc-200 transition cursor-pointer active:scale-95"
              title="Back to overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {selectedCity?.name || 'Cork'}
                </h2>
                <span className="text-[11px] font-semibold text-amber-400">
                  1h &bull; {displayHours.length}h
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Continuous Multi-Day Hourly Matrix
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleJumpToNow}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-100 transition active:scale-95 cursor-pointer"
            title="Scroll all models back to current hour"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Now</span>
          </button>
        </div>

        {/* Metric Filter Pills + Temp/Feels Legend */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveMetric('temperature')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                activeMetric === 'temperature'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#111113] border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              Temp. °{unit}
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('precipitation')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                activeMetric === 'precipitation'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#111113] border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              Precipitation {precipUnit}
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('wind')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                activeMetric === 'wind'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#111113] border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              Wind {windUnit}
            </button>
          </div>

          {activeMetric === 'temperature' && (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-100" />
                <span>Temp</span>
              </span>
              <span className="inline-flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Feels</span>
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Single Unified Native Scroll Container (horizontal + vertical compositor scrolling) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-auto overscroll-contain px-2.5 pb-12"
      >
        <div style={{ width: `${svgWidth}px`, minWidth: '100%' }}>
          {/* Sticky Top Floating / Sliding Date Header */}
          <div className="sticky top-0 z-30 bg-black/95 border-b border-zinc-800/80 py-2 mb-2.5 flex">
            {dayGroups.map((g) => (
              <div
                key={g.dateStr}
                style={{ width: `${g.count * colWidth}px`, overflowX: 'clip' }}
                className="shrink-0 border-l border-zinc-800 first:border-l-0 px-2"
              >
                {g.count >= 2 ? (
                  <div className="sticky left-2 inline-flex items-baseline gap-1.5 whitespace-nowrap text-xs">
                    <span className="font-extrabold text-white">{g.pill.weekday}</span>
                    <span className="font-semibold text-zinc-400">{g.pill.rest}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Stack of Provider Curve Cards */}
          <div className="space-y-2.5">
            {providerRows.map((provider) => (
              <ProviderHourlyRowCard
                key={provider.id}
                provider={provider}
                hours={displayHours}
                activeMetric={activeMetric}
                unit={unit}
                timeFormat={timeFormat}
                colWidth={colWidth}
                svgWidth={svgWidth}
                svgHeight={svgHeight}
                topPadding={topPadding}
                usableHeight={usableHeight}
                headerWidth={viewportWidth}
                windowStart={windowStart}
                windowEnd={windowEnd}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single Provider Card with sticky header + windowed 1-hour horizontal curve + icons
 */
const ProviderHourlyRowCard = memo(function ProviderHourlyRowCard({
  provider,
  hours,
  activeMetric,
  unit,
  timeFormat,
  colWidth,
  svgWidth,
  svgHeight,
  topPadding,
  usableHeight,
  headerWidth,
  windowStart,
  windowEnd,
}) {
  const dataPoints = useMemo(() => {
    return hours.map((h, i) => {
      const source = provider.isConsensus
        ? h.consensus || {}
        : h.providers?.[provider.id] || {};

      // Consensus wind fallback: average across available providers if not precomputed
      let windRaw = source.windSpeed;
      if (windRaw === undefined || windRaw === null) {
        if (provider.isConsensus && h.providers) {
          const wVals = Object.values(h.providers)
            .map((p) => p?.windSpeed)
            .filter((v) => v !== undefined && v !== null);
          windRaw = wVals.length > 0
            ? wVals.reduce((sum, v) => sum + v, 0) / wVals.length
            : (h.actual?.windSpeed || 12);
        } else {
          windRaw = h.actual?.windSpeed || 0;
        }
      }

      const tRaw = source.temperature !== undefined && source.temperature !== null
        ? source.temperature
        : (h.consensus?.temperature ?? 10);
      const fRaw = source.apparentTemperature !== undefined && source.apparentTemperature !== null
        ? source.apparentTemperature
        : tRaw;
      const prob = source.precipitationProbability !== undefined && source.precipitationProbability !== null
        ? source.precipitationProbability
        : 0;
      const rainMm = source.precipitation !== undefined && source.precipitation !== null
        ? source.precipitation
        : 0;
      const code = source.weatherCode !== undefined && source.weatherCode !== null
        ? source.weatherCode
        : (h.consensus?.weatherCode ?? 2);
      const isDay = h.isDay !== undefined ? Boolean(h.isDay) : true;
      const cloudCover = source.cloudCover !== undefined && source.cloudCover !== null
        ? source.cloudCover
        : (provider.isConsensus ? h.actual?.cloudCover ?? null : null);

      const smartInfo = resolveSmartWeatherInfo(
        code,
        rainMm > 0 || prob >= 40 ? prob : 0,
        rainMm,
        isDay,
        cloudCover
      );

      let val = 0;
      let label = '';
      let feelsLabel = '';

      if (activeMetric === 'temperature') {
        val = unit === 'F' ? Math.round((tRaw * 9) / 5 + 32) : Math.round(tRaw);
        label = `${val}°`;
        const fDisp = unit === 'F' ? Math.round((fRaw * 9) / 5 + 32) : Math.round(fRaw);
        feelsLabel = `${fDisp}°`;
      } else if (activeMetric === 'precipitation') {
        val = Math.round(prob);
        if (rainMm >= 0.1) {
          const dispRain = unit === 'F' ? (rainMm * 0.03937).toFixed(2) : rainMm.toFixed(1);
          label = `${dispRain}`;
        } else {
          label = `${val}%`;
        }
      } else {
        val = unit === 'F' ? Math.round(windRaw * 0.621371) : Math.round(windRaw);
        label = `${val}`;
      }

      // Detect midnight / day boundary for subtle day marker
      const hourNum = h.timeIso ? parseInt(h.timeIso.split('T')[1]?.slice(0, 2) || '0', 10) : 0;
      let dayBadge = null;
      if (i === 0) {
        dayBadge = 'Today';
      } else if (hourNum === 0 && h.date) {
        const d = new Date(`${h.date}T12:00:00`);
        dayBadge = d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric' });
      }

      return {
        index: i,
        hourLabel: formatTime(h.hourLabel || h.timeIso, timeFormat, false),
        isNow: i === 0 && h.isCurrent,
        dayBadge,
        val,
        label,
        feelsLabel,
        icon: smartInfo.icon || 'Cloud',
        isDay: h.isDay !== undefined ? Boolean(h.isDay) : true,
        rainMm,
      };
    });
  }, [hours, provider.id, provider.isConsensus, activeMetric, unit, timeFormat]);

  const allPoints = useMemo(() => {
    const vals = dataPoints.map((d) => d.val);
    const minVal = activeMetric === 'precipitation' ? 0 : Math.min(...vals);
    const maxVal = activeMetric === 'precipitation'
      ? Math.max(100, ...vals)
      : Math.max(...vals);
    const span = Math.max(1, maxVal - minVal);

    return dataPoints.map((d, i) => {
      const x = i * colWidth + colWidth / 2;
      const y = topPadding + usableHeight - ((d.val - minVal) / span) * usableHeight;
      return { ...d, x, y };
    });
  }, [dataPoints, activeMetric, colWidth, topPadding, usableHeight]);

  // Slice points and build local SVG path only for the visible window + overscan
  const { visiblePoints, offsetX, visibleSvgWidth, pathD, fillD } = useMemo(() => {
    if (allPoints.length === 0) {
      return { visiblePoints: [], offsetX: 0, visibleSvgWidth: 300, pathD: '', fillD: '' };
    }
    const start = Math.max(0, Math.min(windowStart, allPoints.length - 1));
    const end = Math.max(start, Math.min(windowEnd, allPoints.length - 1));
    const slice = allPoints.slice(start, end + 1);
    const xShift = start * colWidth;
    const width = Math.max(colWidth, slice.length * colWidth);

    let line = '';
    if (slice.length > 0) {
      line = `M ${slice[0].x - xShift} ${slice[0].y}`;
      for (let i = 0; i < slice.length - 1; i++) {
        const curr = slice[i];
        const next = slice[i + 1];
        const cx1 = curr.x - xShift;
        const cx2 = next.x - xShift;
        const cpX = cx1 + (cx2 - cx1) / 2;
        line += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${cx2} ${next.y}`;
      }
    }
    const fill = slice.length > 0
      ? `${line} L ${slice[slice.length - 1].x - xShift} ${svgHeight} L ${slice[0].x - xShift} ${svgHeight} Z`
      : '';

    return {
      visiblePoints: slice,
      offsetX: xShift,
      visibleSvgWidth: width,
      pathD: line,
      fillD: fill,
    };
  }, [allPoints, windowStart, windowEnd, colWidth, svgHeight]);

  const strokeColor = activeMetric === 'temperature'
    ? '#f59e0b'
    : activeMetric === 'precipitation'
    ? '#38bdf8'
    : '#34d399';

  const gradId = `matrix-grad-${provider.id}-${activeMetric}`;

  return (
    <div
      className={`rounded-2xl border ${
        provider.isConsensus
          ? 'bg-[#151518] border-amber-500/45'
          : 'bg-[#111113] border-zinc-800/90'
      }`}
    >
      {/* Sticky Provider Card Header (pinned to left edge of scroll viewport) */}
      <div
        style={{ width: `${headerWidth}px` }}
        className="sticky left-0 z-20 px-3.5 pt-2.5 pb-1.5 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: provider.color }}
          />
          <span className="text-sm font-extrabold text-white truncate">
            {provider.name}
          </span>
          {provider.isConsensus && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
              Primary
            </span>
          )}
        </div>
        {provider.badge && !provider.isConsensus && (
          <span className="text-[10px] font-semibold text-zinc-400 truncate shrink-0">
            {provider.badge}
          </span>
        )}
      </div>

      {/* Windowed 1-Hour Curve + Icons Strip */}
      <div style={{ width: `${svgWidth}px` }} className="relative pb-2">
        <div style={{ marginLeft: `${offsetX}px`, width: `${visibleSvgWidth}px` }}>
          {/* Curve SVG */}
          <svg width={visibleSvgWidth} height={svgHeight} className="overflow-visible block">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {fillD && <path d={fillD} fill={`url(#${gradId})`} />}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {visiblePoints.map((p) => {
              const localX = p.x - offsetX;
              return (
                <g key={p.index}>
                  {/* Midnight Day Separator Line */}
                  {p.dayBadge && p.index > 0 && (
                    <line
                      x1={p.index * colWidth - offsetX}
                      y1={0}
                      x2={p.index * colWidth - offsetX}
                      y2={svgHeight}
                      stroke="#3f3f46"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  <circle
                    cx={localX}
                    cy={p.y}
                    r={p.isNow ? '3.5' : '2.2'}
                    fill={p.isNow ? '#ffffff' : strokeColor}
                    stroke="#000000"
                    strokeWidth="1"
                  />

                  {activeMetric === 'temperature' ? (
                    <text
                      x={localX}
                      y={p.y - 7}
                      textAnchor="middle"
                      className="font-mono select-none"
                    >
                      <tspan className="text-[13px] font-black" fill="#f4f4f5">
                        {p.label}
                      </tspan>
                      <tspan dx="3" className="text-[11px] font-extrabold" fill="#fbbf24">
                        {p.feelsLabel}
                      </tspan>
                    </text>
                  ) : (
                    <text
                      x={localX}
                      y={p.y - 7}
                      textAnchor="middle"
                      className="text-[12px] font-mono font-bold select-none"
                      fill={activeMetric === 'precipitation' && p.rainMm >= 0.1 ? '#38bdf8' : '#e4e4e7'}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Weather Icons + Hour Labels + Day Badges Row */}
          <div className="flex items-start pt-0.5">
            {visiblePoints.map((p) => (
              <div
                key={p.index}
                style={{ width: `${colWidth}px` }}
                className={`shrink-0 flex flex-col items-center ${
                  p.dayBadge && p.index > 0 ? 'border-l border-zinc-800' : ''
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <WeatherIcon
                    iconName={p.icon}
                    isNight={!p.isDay}
                    className="w-8 h-8"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span
                  className={`text-[11px] font-mono font-bold mt-0.5 ${
                    p.isNow ? 'text-amber-400' : 'text-zinc-300'
                  }`}
                >
                  {p.isNow ? 'Now' : p.hourLabel}
                </span>
                {p.dayBadge && (
                  <span className="text-[9px] font-extrabold text-amber-300/90 uppercase tracking-tight leading-tight">
                    {p.dayBadge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
