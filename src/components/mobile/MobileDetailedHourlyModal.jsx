import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Thermometer,
  User,
  Umbrella,
  CloudRain,
  Wind,
  Compass,
  Gauge,
  Cloud,
  Droplets,
  Droplet,
  Sun,
  Eye,
} from 'lucide-react';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo } from '../../constants/providers';

function getShortHour(timeIso, timeFormat = '24h') {
  if (!timeIso) return '';
  const d = new Date(timeIso);
  const hour = d.getHours();
  if (timeFormat === '12h') {
    const period = hour >= 12 ? 'p' : 'a';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}${period}`;
  }
  return `${hour < 10 ? '0' : ''}${hour}:00`;
}

function getDayHeader(timeIso, isFirst) {
  if (!timeIso) return '';
  if (isFirst) return 'Today';
  const d = new Date(timeIso);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = d.getDate();
  return `${weekday} ${dayNum}`;
}

/**
 * Builds smooth bezier curve and SVG area fill path from point values
 */
function buildCurvePaths(points, svgHeight, minVal, maxVal, topPad = 16, botPad = 10) {
  const usableHeight = Math.max(1, svgHeight - topPad - botPad);
  const range = maxVal - minVal || 1;

  const coords = points.map((p) => {
    const normalized = (p.val - minVal) / range;
    const y = topPad + (1 - normalized) * usableHeight;
    return { ...p, y };
  });

  if (coords.length === 0) return { pathD: '', fillD: '', coords: [] };

  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }
  const fillD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

  return { pathD, fillD, coords };
}

export default function MobileDetailedHourlyModal({
  hours = [],
  selectedCity,
  unit = 'C',
  timeFormat = '24h',
  onClose,
}) {
  if (!hours || hours.length === 0) return null;

  // Take the next 24 hours starting from current (or first upcoming)
  const currentIdx = hours.findIndex((h) => h.isCurrent);
  const startIdx = currentIdx !== -1 ? currentIdx : 0;
  const displayHours = hours.slice(startIdx, startIdx + 24);

  const colWidth = 58;
  const totalWidth = displayHours.length * colWidth;

  // Process data for all 12 metrics
  const processed = useMemo(() => {
    return displayHours.map((h, i) => {
      const consensus = h.consensus || {};
      const actual = h.actual || {};

      const code = consensus.weatherCode !== undefined && consensus.weatherCode !== null ? consensus.weatherCode : (actual.weatherCode ?? 2);
      const prob = consensus.precipitationProbability !== undefined ? consensus.precipitationProbability : (actual.precipitationProbability || 0);
      const rainMm = consensus.precipitation !== undefined ? consensus.precipitation : (actual.precipitation || 0);
      const isDay = h.isDay !== undefined ? Boolean(h.isDay) : true;
      const cloudCover = consensus.cloudCover ?? actual.cloudCover ?? null;
      const smartInfo = resolveSmartWeatherInfo(code, prob, rainMm, isDay, cloudCover);

      const tRaw = consensus.temperature !== undefined ? consensus.temperature : (actual.temperature || 10);
      const fRaw = consensus.apparentTemperature !== undefined ? consensus.apparentTemperature : (actual.apparentTemperature || tRaw);

      // Temperature & Feels
      const tempVal = unit === 'F' ? Math.round((tRaw * 9) / 5 + 32) : Math.round(tRaw);
      const feelsVal = unit === 'F' ? Math.round((fRaw * 9) / 5 + 32) : Math.round(fRaw);

      // Precip Prob
      const precipProbVal = Math.round(prob);

      // Precip Mm / in
      const precipMmVal = unit === 'F'
        ? Math.round(rainMm * 0.0393701 * 10) / 10
        : Math.round(rainMm * 10) / 10;

      // Wind & Wind Gust
      const windKmh = consensus.windSpeed !== undefined && consensus.windSpeed !== null ? consensus.windSpeed : (actual.windSpeed || 10);
      const windVal = unit === 'F' ? Math.round(windKmh * 0.621371) : Math.round(windKmh);
      const gustKmh = actual.windGusts !== undefined ? actual.windGusts : Math.round(windKmh * 1.35);
      const gustVal = unit === 'F' ? Math.round(gustKmh * 0.621371) : Math.round(gustKmh);
      const windDir = actual.windDirection !== undefined ? actual.windDirection : 180;

      // Surface Pressure
      const pressureVal = actual.surfacePressure || 1013;

      // Cloud Cover
      const cloudCoverVal = cloudCover !== null ? Math.round(cloudCover) : 85;

      // Humidity
      const humRaw = consensus.humidity !== undefined && consensus.humidity !== null ? consensus.humidity : (actual.humidity || 85);
      const humidityVal = Math.round(humRaw);

      // Dew Point
      const dewRaw = actual.dewPoint !== undefined && actual.dewPoint !== null
        ? actual.dewPoint
        : Math.round((tRaw - ((100 - humidityVal) / 5)) * 10) / 10;
      const dewVal = unit === 'F' ? Math.round((dewRaw * 9) / 5 + 32) : Math.round(dewRaw);

      // UV Index
      const uvVal = actual.uvIndex !== undefined ? Math.round(actual.uvIndex) : 0;

      // Visibility
      const visKm = actual.visibility !== undefined ? actual.visibility : 10;
      const visibilityVal = unit === 'F' ? Math.round(visKm * 0.621371) : Math.round(visKm);

      const x = i * colWidth + colWidth / 2;

      // Day divider detection
      const prev = displayHours[i - 1];
      const isNewDay = i === 0 || (prev && prev.date !== h.date);
      const dayLabel = isNewDay ? getDayHeader(h.timeIso, i === 0) : '';

      return {
        index: i,
        timeIso: h.timeIso,
        hourLabel: getShortHour(h.timeIso, timeFormat),
        dayLabel,
        isNewDay,
        icon: smartInfo.icon || 'Cloud',
        isDay: h.isDay !== undefined ? Boolean(h.isDay) : true,
        x,
        tempVal,
        feelsVal,
        precipProbVal,
        precipMmVal,
        windVal,
        windDir,
        gustVal,
        pressureVal,
        cloudCoverVal,
        humidityVal,
        dewVal,
        uvVal,
        visibilityVal,
      };
    });
  }, [displayHours, unit, timeFormat]);

  // Helper to extract min, max, points array
  const createMetricData = (key, customMin, customMax) => {
    const vals = processed.map((p) => p[key]);
    const minVal = customMin !== undefined ? customMin : Math.min(...vals);
    const maxVal = customMax !== undefined ? customMax : Math.max(...vals);
    const points = processed.map((p) => ({
      x: p.x,
      val: p[key],
      label: String(p[key]),
    }));
    return { vals, minVal, maxVal, points };
  };

  const tempMetric = createMetricData('tempVal');
  const feelsMetric = createMetricData('feelsVal');
  const precipProbMetric = createMetricData('precipProbVal', 0, 100);
  const precipMmMetric = createMetricData('precipMmVal', 0, Math.max(1, ...processed.map((p) => p.precipMmVal)));
  const windMetric = createMetricData('windVal', 0);
  const gustMetric = createMetricData('gustVal', 0);
  const pressureMetric = createMetricData('pressureVal');
  const cloudCoverMetric = createMetricData('cloudCoverVal', 0, 100);
  const humidityMetric = createMetricData('humidityVal', 0, 100);
  const dewMetric = createMetricData('dewVal');
  const uvMetric = createMetricData('uvVal', 0, 11);
  const visMetric = createMetricData('visibilityVal', 0);

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col overflow-hidden select-none animate-fade-in font-sans">
      {/* 1. Top App Bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/95 border-b border-zinc-800/90 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-full hover:bg-zinc-800 text-zinc-200 transition cursor-pointer active:scale-95"
            title="Back to Mobile Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">
            Hourly
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <span>{selectedCity?.name || 'Cork'}</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-amber-400 font-mono">24h</span>
        </div>
      </div>

      {/* 2. 2D Scrollable Area: Horizontal 24h & Vertical 12 Metrics */}
      <div className="flex-1 overflow-x-auto overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div style={{ width: `${totalWidth}px` }} className="relative min-h-full pb-14">
          
          {/* Vertical Column Grid Guide Background */}
          <div className="absolute inset-0 pointer-events-none flex">
            {processed.map((p, i) => (
              <div
                key={i}
                style={{ width: `${colWidth}px` }}
                className={`h-full shrink-0 border-r border-zinc-900/90 ${
                  i % 2 === 0 ? 'bg-white/[0.018]' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* STICKY TIME & CLOUD ROW (Pins to top when scrolling vertically; scrolls horizontally with metrics) */}
          <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800/90 pt-1 pb-1.5 shadow-lg">
            {/* Day Header Row */}
            <div className="relative h-4 mb-0.5">
              {processed.map((p, i) =>
                p.dayLabel ? (
                  <div
                    key={`day-${i}`}
                    style={{ left: `${i * colWidth + 4}px` }}
                    className="absolute top-0 text-xs font-extrabold text-zinc-100 tracking-tight"
                  >
                    {p.dayLabel}
                  </div>
                ) : null
              )}
            </div>

            {/* Weather Icons Row */}
            <div className="flex items-center">
              {processed.map((p, i) => (
                <div
                  key={`icon-${i}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 flex items-center justify-center h-10"
                >
                  <WeatherIcon
                    iconName={p.icon}
                    isNight={!p.isDay}
                    className="w-10 h-10 drop-shadow-sm"
                  />
                </div>
              ))}
            </div>

            {/* Hour Labels Row */}
            <div className="flex items-center mt-0.5">
              {processed.map((p, i) => (
                <div
                  key={`time-${i}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 text-center text-xs font-bold text-zinc-300 font-mono"
                >
                  {p.hourLabel}
                </div>
              ))}
            </div>
          </div>

          {/* METRIC ROWS STACK (12 Exact Metrics Matching Weawow) */}
          <div className="relative z-10 divide-y divide-zinc-900">
            
            {/* 1. Temperature */}
            <MetricCurveRow
              title="Temperature"
              unit={`°${unit}`}
              icon={<Thermometer className="w-3.5 h-3.5 text-amber-400" />}
              data={tempMetric}
              svgHeight={62}
              strokeColor="#f59e0b"
              fillFromColor="rgba(245, 158, 11, 0.35)"
              labelColor="fill-white"
              valueSuffix="°"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

            {/* 2. Feels like */}
            <MetricCurveRow
              title="Feels like"
              unit={`°${unit}`}
              icon={<User className="w-3.5 h-3.5 text-amber-500" />}
              data={feelsMetric}
              svgHeight={62}
              strokeColor="#fbbf24"
              fillFromColor="rgba(251, 191, 36, 0.28)"
              labelColor="fill-amber-400"
              valueSuffix="°"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

            {/* 3. Precip Probability */}
            <MetricBarOrLineRow
              title="Precip Probability"
              unit="%"
              icon={<Umbrella className="w-3.5 h-3.5 text-cyan-400" />}
              data={precipProbMetric}
              svgHeight={52}
              strokeColor="#06b6d4"
              fillFromColor="rgba(6, 182, 212, 0.35)"
              labelColor="fill-cyan-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
              fixedMin={0}
              fixedMax={100}
            />

            {/* 4. Precipitation */}
            <MetricBarOrLineRow
              title="Precipitation"
              unit={unit === 'F' ? 'in' : 'mm'}
              icon={<CloudRain className="w-3.5 h-3.5 text-blue-400" />}
              data={precipMmMetric}
              svgHeight={50}
              strokeColor="#3b82f6"
              fillFromColor="rgba(59, 130, 246, 0.4)"
              labelColor="fill-blue-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
              showBaseline={true}
            />

            {/* 5. Wind + Direction Arrows */}
            <MetricWindRow
              title="Wind"
              unit={unit === 'F' ? 'mph' : 'km/h'}
              icon={<Wind className="w-3.5 h-3.5 text-slate-300" />}
              data={windMetric}
              processed={processed}
              svgHeight={66}
              strokeColor="#94a3b8"
              fillFromColor="rgba(148, 163, 184, 0.22)"
              labelColor="fill-slate-200"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

            {/* 6. Wind gust */}
            <MetricCurveRow
              title="Wind gust"
              unit={unit === 'F' ? 'mph' : 'km/h'}
              icon={<Compass className="w-3.5 h-3.5 text-slate-400" />}
              data={gustMetric}
              svgHeight={52}
              strokeColor="#cbd5e1"
              fillFromColor="rgba(203, 213, 225, 0.2)"
              labelColor="fill-slate-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

            {/* 7. Pressure */}
            <MetricCurveRow
              title="Pressure"
              unit="hPa"
              icon={<Gauge className="w-3.5 h-3.5 text-teal-400" />}
              data={pressureMetric}
              svgHeight={54}
              strokeColor="#2dd4bf"
              fillFromColor="rgba(45, 212, 191, 0.25)"
              labelColor="fill-teal-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

            {/* 8. Cloud cover */}
            <MetricBarOrLineRow
              title="Cloud cover"
              unit="%"
              icon={<Cloud className="w-3.5 h-3.5 text-slate-300" />}
              data={cloudCoverMetric}
              svgHeight={54}
              strokeColor="#94a3b8"
              fillFromColor="rgba(148, 163, 184, 0.35)"
              labelColor="fill-slate-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
              fixedMin={0}
              fixedMax={100}
            />

            {/* 9. Humidity */}
            <MetricCurveRow
              title="Humidity"
              unit="%"
              icon={<Droplets className="w-3.5 h-3.5 text-sky-400" />}
              data={humidityMetric}
              svgHeight={54}
              strokeColor="#38bdf8"
              fillFromColor="rgba(56, 189, 248, 0.35)"
              labelColor="fill-sky-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
              fixedMin={0}
              fixedMax={100}
            />

            {/* 10. Dew point */}
            <MetricCurveRow
              title="Dew point"
              unit={`°${unit}`}
              icon={<Droplet className="w-3.5 h-3.5 text-indigo-400" />}
              data={dewMetric}
              svgHeight={52}
              strokeColor="#818cf8"
              fillFromColor="rgba(129, 140, 248, 0.28)"
              labelColor="fill-indigo-300"
              valueSuffix="°"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

            {/* 11. UV index */}
            <MetricBarOrLineRow
              title="UV index"
              unit="/ 11"
              icon={<Sun className="w-3.5 h-3.5 text-amber-300" />}
              data={uvMetric}
              svgHeight={50}
              strokeColor="#fcd34d"
              fillFromColor="rgba(252, 211, 77, 0.3)"
              labelColor="fill-amber-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
              fixedMin={0}
              fixedMax={11}
            />

            {/* 12. Visibility */}
            <MetricCurveRow
              title="Visibility"
              unit={unit === 'F' ? 'mi' : 'km'}
              icon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
              data={visMetric}
              svgHeight={52}
              strokeColor="#64748b"
              fillFromColor="rgba(100, 116, 139, 0.25)"
              labelColor="fill-slate-300"
              totalWidth={totalWidth}
              colWidth={colWidth}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard smooth curve metric row
 */
function MetricCurveRow({
  title,
  unit,
  icon,
  data,
  svgHeight = 56,
  strokeColor = '#94a3b8',
  fillFromColor = 'rgba(148, 163, 184, 0.25)',
  labelColor = 'fill-white',
  valueSuffix = '',
  totalWidth,
  colWidth,
  fixedMin,
  fixedMax,
}) {
  const minVal = fixedMin !== undefined ? fixedMin : data.minVal;
  const maxVal = fixedMax !== undefined ? fixedMax : data.maxVal;
  const { pathD, fillD, coords } = buildCurvePaths(data.points, svgHeight, minVal, maxVal, 16, 8);
  const gradId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative pt-1.5 pb-0.5">
      {/* Pinned Metric Title on the Left */}
      <div className="sticky left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#111113]/90 backdrop-blur-md border border-zinc-800 mb-0.5">
        {icon}
        <span className="text-xs font-extrabold text-zinc-100">{title}</span>
        <span className="text-[11px] font-semibold text-zinc-400">{unit}</span>
      </div>

      {/* SVG Curve Canvas */}
      <svg width={totalWidth} height={svgHeight} className="overflow-visible block">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillFromColor} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {fillD && <path d={fillD} fill={`url(#${gradId})`} />}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r="2.5"
              fill={strokeColor}
              stroke="#000000"
              strokeWidth="1"
            />
            <text
              x={c.x}
              y={c.y - 6}
              textAnchor="middle"
              className={`text-xs font-mono font-extrabold select-none ${labelColor}`}
            >
              {c.val}
              {valueSuffix}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Metric row for bar or area fill (Precip, Probability, Cloud cover, UV)
 */
function MetricBarOrLineRow({
  title,
  unit,
  icon,
  data,
  svgHeight = 52,
  strokeColor = '#3b82f6',
  fillFromColor = 'rgba(59, 130, 246, 0.35)',
  labelColor = 'fill-white',
  totalWidth,
  colWidth,
  fixedMin,
  fixedMax,
  showBaseline = false,
}) {
  const minVal = fixedMin !== undefined ? fixedMin : data.minVal;
  const maxVal = fixedMax !== undefined ? fixedMax : data.maxVal;
  const { pathD, fillD, coords } = buildCurvePaths(data.points, svgHeight, minVal, maxVal, 16, 6);
  const gradId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative pt-1.5 pb-0.5">
      {/* Pinned Metric Title on the Left */}
      <div className="sticky left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#111113]/90 backdrop-blur-md border border-zinc-800 mb-0.5">
        {icon}
        <span className="text-xs font-extrabold text-zinc-100">{title}</span>
        <span className="text-[11px] font-semibold text-zinc-400">{unit}</span>
      </div>

      <svg width={totalWidth} height={svgHeight} className="overflow-visible block">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillFromColor} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baseline indicator */}
        {showBaseline && (
          <line
            x1={0}
            y1={svgHeight - 6}
            x2={totalWidth}
            y2={svgHeight - 6}
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
        )}

        {fillD && <path d={fillD} fill={`url(#${gradId})`} />}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r="2.5"
              fill={strokeColor}
              stroke="#000000"
              strokeWidth="1"
            />
            <text
              x={c.x}
              y={c.y - 5}
              textAnchor="middle"
              className={`text-xs font-mono font-extrabold select-none ${labelColor}`}
            >
              {c.val}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Wind metric row with directional arrows right below curve points
 */
function MetricWindRow({
  title,
  unit,
  icon,
  data,
  processed,
  svgHeight = 66,
  strokeColor = '#94a3b8',
  fillFromColor = 'rgba(148, 163, 184, 0.22)',
  labelColor = 'fill-slate-200',
  totalWidth,
  colWidth,
}) {
  const minVal = 0;
  const maxVal = Math.max(10, data.maxVal);
  // Reserve bottom 20px for wind direction arrows
  const { pathD, fillD, coords } = buildCurvePaths(data.points, svgHeight - 20, minVal, maxVal, 16, 6);
  const gradId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative pt-1.5 pb-0.5">
      {/* Pinned Metric Title on the Left */}
      <div className="sticky left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#111113]/90 backdrop-blur-md border border-zinc-800 mb-0.5">
        {icon}
        <span className="text-xs font-extrabold text-zinc-100">{title}</span>
        <span className="text-[11px] font-semibold text-zinc-400">{unit}</span>
      </div>

      <svg width={totalWidth} height={svgHeight} className="overflow-visible block">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillFromColor} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {fillD && <path d={fillD} fill={`url(#${gradId})`} />}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((c, i) => {
          const windDir = processed[i]?.windDir || 180;
          return (
            <g key={i}>
              <circle
                cx={c.x}
                cy={c.y}
                r="2.5"
                fill={strokeColor}
                stroke="#000000"
                strokeWidth="1"
              />
              <text
                x={c.x}
                y={c.y - 5}
                textAnchor="middle"
                className={`text-xs font-mono font-extrabold select-none ${labelColor}`}
              >
                {c.val}
              </text>

              {/* Directional Wind Arrow */}
              <g transform={`translate(${c.x}, ${svgHeight - 10}) rotate(${windDir})`}>
                <line
                  x1="0"
                  y1="-6"
                  x2="0"
                  y2="6"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <polyline
                  points="-3,3 0,6 3,3"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
