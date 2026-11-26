import React, { useMemo, useRef, useEffect, useId } from 'react';
import {
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

/**
 * Shared 12-metric scrollable timeline view used by both Hourly Expanded (24h)
 * and Daily Expanded Graph (10-Day), ensuring 100% visual consistency.
 */
export default function MobileHourlyTimelineView({
  hours = [],
  unit = 'C',
  timeFormat = '24h',
  targetDate = null,
  onActiveDateChange,
}) {
  const scrollRef = useRef(null);
  const colWidth = 58;
  const totalWidth = hours.length * colWidth;

  // Group timeline by calendar date for the floating/sliding date header (matching Daily Graph)
  const dayGroups = useMemo(() => {
    const groups = [];
    hours.forEach((h, idx) => {
      const dateStr = h.date || (h.timeIso ? h.timeIso.split('T')[0] : 'unknown');
      let last = groups[groups.length - 1];
      if (!last || last.dateStr !== dateStr) {
        const d = dateStr !== 'unknown' ? new Date(`${dateStr}T12:00:00`) : new Date();
        const weekday = d.toLocaleDateString('en-IE', { weekday: 'short' });
        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString('en-IE', { month: 'short' });
        last = {
          dateStr,
          startIdx: idx,
          count: 0,
          pill: { weekday, rest: `${dayNum}. ${monthShort}.` },
        };
        groups.push(last);
      }
      last.count += 1;
    });
    return groups;
  }, [hours]);

  // Jump horizontally to targetDate when switched from Table -> Graph
  useEffect(() => {
    if (!targetDate || !scrollRef.current || dayGroups.length === 0) return;
    const match = dayGroups.find((g) => g.dateStr === targetDate);
    if (match) {
      scrollRef.current.scrollLeft = match.startIdx * colWidth;
      onActiveDateChange?.(match.dateStr);
    }
  }, [targetDate, dayGroups, colWidth, onActiveDateChange]);

  const handleScroll = (e) => {
    if (!onActiveDateChange || dayGroups.length === 0) return;
    const left = e.currentTarget.scrollLeft;
    const colIdx = Math.max(0, Math.floor((left + colWidth * 1.5) / colWidth));
    const currentGroup = dayGroups.find(
      (g) => colIdx >= g.startIdx && colIdx < g.startIdx + g.count
    );
    if (currentGroup) {
      onActiveDateChange(currentGroup.dateStr);
    }
  };

  // Process data for all 12 metrics
  const processed = useMemo(() => {
    return hours.map((h, i) => {
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

      const tempVal = unit === 'F' ? Math.round((tRaw * 9) / 5 + 32) : Math.round(tRaw);
      const feelsVal = unit === 'F' ? Math.round((fRaw * 9) / 5 + 32) : Math.round(fRaw);
      const precipProbVal = Math.round(prob);
      const precipMmVal = unit === 'F'
        ? Math.round(rainMm * 0.0393701 * 10) / 10
        : Math.round(rainMm * 10) / 10;

      const windKmh = consensus.windSpeed !== undefined && consensus.windSpeed !== null ? consensus.windSpeed : (actual.windSpeed || 10);
      const windVal = unit === 'F' ? Math.round(windKmh * 0.621371) : Math.round(windKmh);
      const gustKmh = actual.windGusts !== undefined ? actual.windGusts : Math.round(windKmh * 1.35);
      const gustVal = unit === 'F' ? Math.round(gustKmh * 0.621371) : Math.round(gustKmh);
      const windDir = actual.windDirection !== undefined ? actual.windDirection : (consensus.windDirection ?? 180);

      const pressureVal = Math.round(actual.surfacePressure ?? consensus.surfacePressure ?? 1013);
      const cloudCoverVal = cloudCover !== null ? Math.round(cloudCover) : 85;
      const humRaw = consensus.humidity !== undefined && consensus.humidity !== null ? consensus.humidity : (actual.humidity || 85);
      const humidityVal = Math.round(humRaw);

      const dewRaw = actual.dewPoint !== undefined && actual.dewPoint !== null
        ? actual.dewPoint
        : Math.round((tRaw - ((100 - humidityVal) / 5)) * 10) / 10;
      const dewVal = unit === 'F' ? Math.round((dewRaw * 9) / 5 + 32) : Math.round(dewRaw);

      const uvVal = actual.uvIndex !== undefined ? Math.round(actual.uvIndex) : 0;
      const visKm = actual.visibility !== undefined ? actual.visibility : 10;
      const visibilityVal = unit === 'F' ? Math.round(visKm * 0.621371) : Math.round(visKm);

      const x = i * colWidth + colWidth / 2;

      return {
        index: i,
        timeIso: h.timeIso,
        hourLabel: getShortHour(h.timeIso, timeFormat),
        icon: smartInfo.icon || 'Cloud',
        isDay,
        x,
        tempVal,
        feelsVal,
        precipProbVal,
        precipMmVal,
        windVal,
        gustVal,
        windDir,
        pressureVal,
        cloudCoverVal,
        humidityVal,
        dewVal,
        uvVal,
        visibilityVal,
      };
    });
  }, [hours, unit, timeFormat, colWidth]);

  if (processed.length === 0) return null;

  const createMetricData = (key, minFloor = null, maxCeil = null) => {
    const pts = processed.map((p) => ({ x: p.x, val: p[key] }));
    const vals = pts.map((p) => p.val);
    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);
    if (minFloor !== null) minVal = Math.min(minVal, minFloor);
    if (maxCeil !== null) maxVal = Math.max(maxVal, maxCeil);
    return { points: pts, minVal, maxVal };
  };

  const tempMetric = createMetricData('tempVal');
  const feelsMetric = createMetricData('feelsVal');
  const precipProbMetric = createMetricData('precipProbVal', 0, 100);
  const precipMmMetric = createMetricData('precipMmVal', 0, unit === 'F' ? 0.2 : 2);
  const windMetric = createMetricData('windVal', 0);
  const gustMetric = createMetricData('gustVal', 0);
  const pressureMetric = createMetricData('pressureVal');
  const cloudCoverMetric = createMetricData('cloudCoverVal', 0, 100);
  const humidityMetric = createMetricData('humidityVal', 0, 100);
  const dewMetric = createMetricData('dewVal');
  const uvMetric = createMetricData('uvVal', 0, 11);
  const visMetric = createMetricData('visibilityVal', 0);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-x-auto overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
    >
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
        <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800/90 pt-1.5 pb-1.5 shadow-lg">
          {/* Floating / Sliding Day Header Row */}
          <div className="flex mb-1">
            {dayGroups.map((g) => (
              <div
                key={g.dateStr}
                style={{ width: `${g.count * colWidth}px`, overflowX: 'clip' }}
                className="shrink-0 border-l border-zinc-700/80 first:border-l-0 px-2"
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

        {/* METRIC ROWS STACK (12 Exact Metrics) */}
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
          />

          {/* 11. UV index */}
          <MetricBarOrLineRow
            title="UV index"
            unit="/ 11"
            icon={<Sun className="w-3.5 h-3.5 text-amber-300" />}
            data={uvMetric}
            svgHeight={50}
            strokeColor="#facc15"
            fillFromColor="rgba(250, 204, 21, 0.35)"
            labelColor="fill-yellow-300"
            totalWidth={totalWidth}
            fixedMin={0}
            fixedMax={11}
          />

          {/* 12. Visibility */}
          <MetricCurveRow
            title="Visibility"
            unit={unit === 'F' ? 'mi' : 'km'}
            icon={<Eye className="w-3.5 h-3.5 text-emerald-400" />}
            data={visMetric}
            svgHeight={52}
            strokeColor="#34d399"
            fillFromColor="rgba(52, 211, 153, 0.25)"
            labelColor="fill-emerald-300"
            totalWidth={totalWidth}
            fixedMin={0}
          />
        </div>
      </div>
    </div>
  );
}

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
  fixedMin,
  fixedMax,
}) {
  const uid = useId();
  const minVal = fixedMin !== undefined ? fixedMin : data.minVal;
  const maxVal = fixedMax !== undefined ? fixedMax : data.maxVal;
  const { pathD, fillD, coords } = buildCurvePaths(data.points, svgHeight, minVal, maxVal, 16, 8);
  const gradId = `grad-${uid}-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative pt-1.5 pb-0.5">
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
  fixedMin,
  fixedMax,
  showBaseline = false,
}) {
  const uid = useId();
  const minVal = fixedMin !== undefined ? fixedMin : data.minVal;
  const maxVal = fixedMax !== undefined ? fixedMax : data.maxVal;
  const { pathD, fillD, coords } = buildCurvePaths(data.points, svgHeight, minVal, maxVal, 16, 6);
  const gradId = `grad-${uid}-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative pt-1.5 pb-0.5">
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
}) {
  const uid = useId();
  const minVal = 0;
  const maxVal = Math.max(10, data.maxVal);
  const { pathD, fillD, coords } = buildCurvePaths(data.points, svgHeight - 20, minVal, maxVal, 16, 6);
  const gradId = `grad-${uid}-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative pt-1.5 pb-0.5">
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
