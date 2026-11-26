import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sunrise,
  Sunset,
  Table2,
  LineChart,
} from 'lucide-react';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo } from '../../constants/providers';
import { formatTime } from '../../utils/units';
import MobileHourlyTimelineView from './MobileHourlyTimelineView';

function convertTemp(tempC, unit) {
  if (tempC === null || tempC === undefined) return null;
  return unit === 'F' ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC);
}

function convertWind(kmh, unit) {
  if (kmh === null || kmh === undefined) return 0;
  return unit === 'F' ? Math.round(kmh * 0.621371) : Math.round(kmh);
}

function convertPrecip(mm, unit) {
  if (!mm || mm <= 0) return 0;
  if (unit === 'F') return Math.round(mm * 0.0393701 * 100) / 100;
  return Math.round(mm * 10) / 10;
}

function getHourNumber(h) {
  if (h?.timeIso && h.timeIso.includes('T')) {
    return parseInt(h.timeIso.split('T')[1].split(':')[0], 10);
  }
  if (h?.hourLabel) {
    return parseInt(h.hourLabel.split(':')[0], 10);
  }
  return 0;
}

function getHourMetrics(h, unit) {
  const c = h.consensus || {};
  const a = h.actual || {};

  const tempC = c.temperature !== undefined ? c.temperature : (a.temperature ?? 10);
  const feelsC = c.apparentTemperature !== undefined ? c.apparentTemperature : (a.apparentTemperature ?? tempC);
  const precipProb = c.precipitationProbability !== undefined ? c.precipitationProbability : (a.precipitationProbability ?? 0);
  const precipMm = c.precipitation !== undefined ? c.precipitation : (a.precipitation ?? 0);
  const windKmh = c.windSpeed !== undefined && c.windSpeed !== null ? c.windSpeed : (a.windSpeed ?? 10);
  const gustKmh = a.windGusts !== undefined ? a.windGusts : Math.round(windKmh * 1.35);
  const code = c.weatherCode !== undefined && c.weatherCode !== null ? c.weatherCode : (a.weatherCode ?? 2);
  const pressure = a.surfacePressure ?? c.surfacePressure ?? 1013;
  const windDir = a.windDirection ?? c.windDirection ?? 180;
  const isDay = h.isDay !== undefined ? Boolean(h.isDay) : (getHourNumber(h) >= 7 && getHourNumber(h) < 18);
  const cloudCoverRaw = c.cloudCover ?? a.cloudCover ?? null;
  const cloudCover = cloudCoverRaw !== null ? Math.round(cloudCoverRaw) : 85;
  const humRaw = c.humidity !== undefined && c.humidity !== null ? c.humidity : (a.humidity ?? 85);
  const humidity = Math.round(humRaw);
  const dewRaw = a.dewPoint !== undefined && a.dewPoint !== null
    ? a.dewPoint
    : Math.round((tempC - ((100 - humidity) / 5)) * 10) / 10;
  const uvIndex = a.uvIndex !== undefined ? Math.round(a.uvIndex) : 0;
  const visKm = a.visibility !== undefined ? a.visibility : 10;
  const visibility = unit === 'F' ? Math.round(visKm * 0.621371) : Math.round(visKm);

  // Max precipitation across providers for "Possible precipitation" envelope
  let maxModelPrecipMm = precipMm;
  if (h.providers) {
    Object.values(h.providers).forEach((p) => {
      if (p && typeof p.precipitation === 'number' && p.precipitation > maxModelPrecipMm) {
        maxModelPrecipMm = p.precipitation;
      }
    });
  }

  const smartInfo = resolveSmartWeatherInfo(code, precipMm > 0 || precipProb >= 40 ? precipProb : 0, precipMm, isDay, cloudCoverRaw);

  return {
    temp: convertTemp(tempC, unit),
    tempC,
    feels: convertTemp(feelsC, unit),
    precipProb: Math.round(precipProb),
    precip: convertPrecip(precipMm, unit),
    precipMm,
    possiblePrecip: convertPrecip(maxModelPrecipMm, unit),
    wind: convertWind(windKmh, unit),
    gust: convertWind(gustKmh, unit),
    windDir,
    pressure: Math.round(pressure),
    cloudCover,
    humidity,
    dewPoint: convertTemp(dewRaw, unit),
    uvIndex,
    visibility,
    code,
    icon: smartInfo.icon || 'Cloud',
    isDay,
  };
}

function formatDayCardTitle(dateStr, idx) {
  const d = new Date(dateStr + 'T12:00:00');
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString('en-US', { month: 'long' });
  if (idx === 0) return `Today ${dayNum} ${monthName}`;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday} ${dayNum} ${monthName}`;
}

function formatGraphDayPill(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return { weekday, rest: `${dayNum}. ${month}.` };
}

function formatGraphHourTick(h, timeFormat) {
  const hour = getHourNumber(h);
  if (timeFormat === '12h') {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return { main: h12 < 10 ? `0${h12}` : `${h12}`, sub: period };
  }
  return { main: hour < 10 ? `0${hour}` : `${hour}`, sub: ':00' };
}

export default function MobileDetailedDailyModal({
  dates = [],
  hoursByDate = {},
  hours = [],
  dailySunByDate = {},
  selectedCity,
  unit = 'C',
  timeFormat = '24h',
  initialSelectedDate = null,
  onClose,
}) {
  const [viewTab, setViewTab] = useState('table'); // 'table' | 'graph'
  const [expandedDates, setExpandedDates] = useState(() =>
    initialSelectedDate ? { [initialSelectedDate]: true } : {}
  );
  const [graphTargetDate, setGraphTargetDate] = useState(initialSelectedDate);
  const tableScrollRef = useRef(null);
  const activeDateRef = useRef(initialSelectedDate);
  const pendingTableScrollDateRef = useRef(null);

  useEffect(() => {
    if (!initialSelectedDate) return;
    activeDateRef.current = initialSelectedDate;
    setViewTab('table');
    setExpandedDates((prev) => ({ ...prev, [initialSelectedDate]: true }));
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-daily-date="${initialSelectedDate}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(timer);
  }, [initialSelectedDate]);

  // Scroll back to the exact day card when returning from Graph -> Table
  useEffect(() => {
    if (viewTab !== 'table' || !pendingTableScrollDateRef.current) return;
    const target = pendingTableScrollDateRef.current;
    pendingTableScrollDateRef.current = null;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-daily-date="${target}"]`);
      el?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 30);
    return () => clearTimeout(timer);
  }, [viewTab]);

  // Build up to 10 days starting from today
  const tenDaysData = useMemo(() => {
    if (!dates || dates.length === 0) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    const startIdx = dates.indexOf(todayStr) !== -1 ? dates.indexOf(todayStr) : 0;
    const selectedDates = dates.slice(startIdx, startIdx + 10);

    const nowHour = new Date().getHours();

    return selectedDates.map((dateStr, dayIdx) => {
      const rawDayHours = hoursByDate[dateStr] || [];
      const isToday = dayIdx === 0;

      // Filter Today to start from current hour (or past-1 if midnight edge), future days show all 24h
      const visibleHours = isToday
        ? rawDayHours.filter((h) => !h.isPast || h.isCurrent)
        : rawDayHours;
      const effectiveHours = visibleHours.length > 0 ? visibleHours : rawDayHours;

      // Build 4 Yr-style 6-hour periods: 00-06, 06-12, 12-18, 18-24
      const periodDefs = [
        { label: '00–06', start: 0, end: 6 },
        { label: '06–12', start: 6, end: 12 },
        { label: '12–18', start: 12, end: 18 },
        { label: '18–24', start: 18, end: 24 },
      ];

      const periods = periodDefs
        .map((p) => {
          // For Today, skip 6h periods that have already ended before current hour
          if (isToday && p.end <= nowHour && rawDayHours.some((h) => getHourNumber(h) >= nowHour)) {
            return null;
          }
          const slotHours = effectiveHours.filter((h) => {
            const hr = getHourNumber(h);
            return hr >= p.start && hr < p.end;
          });
          if (slotHours.length === 0) return null;

          const metricsList = slotHours.map((h) => getHourMetrics(h, unit));
          const maxTemp = Math.max(...metricsList.map((m) => m.temp ?? 0));
          const maxFeels = Math.max(...metricsList.map((m) => m.feels ?? m.temp ?? 0));
          const totalPrecip = Math.round(metricsList.reduce((sum, m) => sum + (m.precip || 0), 0) * 10) / 10;
          const maxHourlyPrecipMm = Math.max(...metricsList.map((m) => m.precipMm || 0));
          const maxProb = Math.max(...metricsList.map((m) => m.precipProb || 0));
          const maxWind = Math.max(...metricsList.map((m) => m.wind || 0));

          // Period is night if the majority of hours in this 6h slot are dark
          const nightHoursCount = metricsList.filter((m) => !m.isDay).length;
          const periodIsNight = nightHoursCount > metricsList.length / 2;

          // Pick representative weather icon matching actual precip intensity & sky state
          let repIcon = metricsList[Math.floor(metricsList.length / 2)].icon;
          const specialSevere = metricsList.find((m) => [71, 73, 75, 77, 85, 86, 95, 96, 99].includes(m.code));
          if (specialSevere) {
            repIcon = specialSevere.icon;
          } else if (maxHourlyPrecipMm >= 6.0) {
            repIcon = 'torrential';
          } else if (totalPrecip >= 4.0 || maxHourlyPrecipMm >= 2.5) {
            repIcon = 'heavy_rain';
          } else if (totalPrecip >= 1.0 || maxHourlyPrecipMm >= 0.7 || maxProb >= 65) {
            repIcon = 'moderate_rain';
          } else if (totalPrecip >= 0.3 || maxHourlyPrecipMm >= 0.25 || maxProb >= 55) {
            repIcon = 'light_rain';
          } else if (totalPrecip >= 0.05 || maxProb >= 40) {
            repIcon = 'drizzle';
          }

          return {
            label: p.label,
            icon: repIcon,
            isNight: periodIsNight,
            temp: maxTemp,
            feels: maxFeels,
            prob: maxProb,
            precip: totalPrecip,
            wind: maxWind,
          };
        })
        .filter(Boolean);

      // Build 1-hour split for expanded details
      const hourlySplit = effectiveHours.map((h) => ({
        timeStr: formatTime(h.hourLabel || h.timeIso, timeFormat, true),
        ...getHourMetrics(h, unit),
      }));

      const sun = dailySunByDate[dateStr] || {};

      return {
        dateStr,
        title: formatDayCardTitle(dateStr, dayIdx),
        isToday,
        periods,
        hourlySplit,
        sunrise: sun.sunriseTime ? formatTime(sun.sunriseTime, timeFormat, true) : null,
        sunset: sun.sunsetTime ? formatTime(sun.sunsetTime, timeFormat, true) : null,
      };
    });
  }, [dates, hoursByDate, dailySunByDate, unit, timeFormat]);

  const toggleDayExpand = (dateStr) => {
    setExpandedDates((prev) => {
      const nextOpen = !prev[dateStr];
      if (nextOpen) {
        activeDateRef.current = dateStr;
      }
      return {
        ...prev,
        [dateStr]: nextOpen,
      };
    });
  };

  // Switch Table -> Graph: jump to the expanded day (or topmost visible day card)
  const handleSwitchToGraph = () => {
    let target = tenDaysData.find((d) => expandedDates[d.dateStr])?.dateStr || null;
    if (!target && tableScrollRef.current) {
      const containerTop = tableScrollRef.current.getBoundingClientRect().top;
      const cards = tableScrollRef.current.querySelectorAll('[data-daily-date]');
      for (const card of cards) {
        if (card.getBoundingClientRect().bottom > containerTop + 40) {
          target = card.getAttribute('data-daily-date');
          break;
        }
      }
    }
    target = target || activeDateRef.current || tenDaysData[0]?.dateStr || null;
    activeDateRef.current = target;
    setGraphTargetDate(target);
    setViewTab('graph');
  };

  // Switch Graph -> Table: return to the day card the user was viewing on the graph
  const handleSwitchToTable = () => {
    if (activeDateRef.current) {
      pendingTableScrollDateRef.current = activeDateRef.current;
    }
    setViewTab('table');
  };

  const handleGraphActiveDateChange = useCallback((dateStr) => {
    if (dateStr) activeDateRef.current = dateStr;
  }, []);

  const windUnitLabel = unit === 'F' ? 'mph' : 'km/h';
  const precipUnitLabel = unit === 'F' ? 'in' : 'mm';

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col overflow-hidden select-none animate-fade-in font-sans">
      {/* Top App Bar */}
      <div className="shrink-0 bg-black/95 border-b border-zinc-800/90 px-4 pt-3 pb-2.5 z-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-zinc-800 text-zinc-200 transition cursor-pointer active:scale-95"
              title="Back to overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {selectedCity?.name || 'Cork'}
              </h2>
              <span className="text-[11px] font-semibold text-amber-400">
                {tenDaysData.length}-Day Forecast
              </span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            °{unit} &bull; {windUnitLabel}
          </span>
        </div>

        {/* Table / Graph Switcher Pills */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-[#111113] border border-zinc-800">
          <button
            type="button"
            onClick={handleSwitchToTable}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewTab === 'table'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={handleSwitchToGraph}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewTab === 'graph'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Graph</span>
          </button>
        </div>
      </div>

      {/* BODY: Table View OR Graph View */}
      {viewTab === 'table' ? (
        <div ref={tableScrollRef} className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2.5 pb-10">
          {tenDaysData.map((day) => {
            const isExpanded = Boolean(expandedDates[day.dateStr]);
            const showColumnHeaders = isExpanded || day.isToday;

            return (
              <div
                key={day.dateStr}
                data-daily-date={day.dateStr}
                className="rounded-2xl bg-[#111113] border border-zinc-800/90 overflow-hidden shadow-lg"
              >
                {/* Day Header */}
                <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-zinc-100">
                    {day.title}
                  </h3>
                  {!isExpanded && (
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {day.periods.length === 1 ? 'Tonight' : '6h blocks'}
                    </span>
                  )}
                </div>

                {/* Column Header Row (visible when expanded or for Today) */}
                {showColumnHeaders && (
                  <div className="grid grid-cols-[72px_54px_1fr_1fr_1fr] items-center px-3.5 pb-1.5 text-[11px] font-bold text-zinc-400 border-b border-zinc-800/80">
                    <span>Time</span>
                    <span />
                    <span className="text-center">Temp / Feels</span>
                    <span className="text-center">Precip / %</span>
                    <span className="text-right">Wind {windUnitLabel}</span>
                  </div>
                )}

                {/* Rows: 1-Hour Split (Expanded) OR 6-Hour Period Summaries (Collapsed) */}
                <div className="divide-y divide-zinc-800/60">
                  {isExpanded
                    ? day.hourlySplit.map((hr, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[72px_54px_1fr_1fr_1fr] items-center px-3.5 py-1.5 text-sm hover:bg-zinc-800/35 transition-colors"
                        >
                          <span className="font-mono text-zinc-200 font-semibold text-[13px]">
                            {hr.timeStr}
                          </span>
                          <div className="flex items-center justify-center">
                            <WeatherIcon iconName={hr.icon} isNight={!hr.isDay} className="w-10 h-10" />
                          </div>
                          <div className="flex flex-col items-center leading-tight">
                            <span
                              className={`font-black font-mono text-[15px] ${
                                hr.temp <= (unit === 'F' ? 32 : 0)
                                  ? 'text-sky-300'
                                  : 'text-amber-400'
                              }`}
                            >
                              {hr.temp}°
                            </span>
                            <span className="text-[10px] font-mono text-amber-300/75">
                              Feels {hr.feels}°
                            </span>
                          </div>
                          <div className="flex flex-col items-center leading-tight">
                            <span className="font-mono font-bold text-sm text-sky-400">
                              {hr.precip > 0 ? hr.precip.toFixed(1) : '0'} {precipUnitLabel}
                            </span>
                            <span className={`text-[10px] font-mono ${hr.precipProb >= 50 ? 'text-cyan-300' : 'text-zinc-400'}`}>
                              {hr.precipProb}%
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 text-zinc-100 font-mono font-bold text-sm">
                            <span>{hr.wind}</span>
                            <svg
                              className="w-3.5 h-3.5 text-zinc-300 shrink-0"
                              style={{ transform: `rotate(${hr.windDir}deg)` }}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="12" y1="4" x2="12" y2="20" />
                              <polyline points="7 15 12 20 17 15" />
                            </svg>
                          </div>
                        </div>
                      ))
                    : day.periods.map((p, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[72px_54px_1fr_1fr_1fr] items-center px-3.5 py-1.5 text-sm"
                        >
                          <span className="font-mono text-zinc-200 font-semibold text-[13px]">
                            {p.label}
                          </span>
                          <div className="flex items-center justify-center">
                            <WeatherIcon iconName={p.icon} isNight={p.isNight} className="w-10 h-10" />
                          </div>
                          <div className="flex flex-col items-center leading-tight">
                            <span
                              className={`font-black font-mono text-[15px] ${
                                p.temp <= (unit === 'F' ? 32 : 0)
                                  ? 'text-sky-300'
                                  : 'text-amber-400'
                              }`}
                            >
                              {p.temp}°
                            </span>
                            <span className="text-[10px] font-mono text-amber-300/75">
                              Feels {p.feels}°
                            </span>
                          </div>
                          <div className="flex flex-col items-center leading-tight">
                            <span className="font-mono font-bold text-sm text-sky-400">
                              {p.precip >= 0.1 ? p.precip.toFixed(1) : '0'} {precipUnitLabel}
                            </span>
                            <span className={`text-[10px] font-mono ${p.prob >= 50 ? 'text-cyan-300' : 'text-zinc-400'}`}>
                              {p.prob}%
                            </span>
                          </div>
                          <span className="text-right font-mono font-bold text-sm text-zinc-100">
                            {p.wind}
                          </span>
                        </div>
                      ))}
                </div>

                {/* Sunrise & Sunset Strip (when expanded) */}
                {isExpanded && (day.sunrise || day.sunset) && (
                  <div className="grid grid-cols-2 gap-2 px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800/80 text-sm">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Sunrise className="w-5 h-5 text-amber-400" />
                      <span className="font-mono font-extrabold text-zinc-100">{day.sunrise || '--'}</span>
                      <span className="text-xs text-zinc-400">Sunrise</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Sunset className="w-5 h-5 text-orange-400" />
                      <span className="font-mono font-extrabold text-zinc-100">{day.sunset || '--'}</span>
                      <span className="text-xs text-zinc-400">Sunset</span>
                    </div>
                  </div>
                )}

                {/* Details Expand/Collapse Footer Button */}
                <button
                  type="button"
                  onClick={() => toggleDayExpand(day.dateStr)}
                  className="w-full py-2 px-4 border-t border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900 flex items-center justify-center gap-1.5 text-sm font-bold text-zinc-200 hover:text-white transition cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide details' : 'Details'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <DailyGraphView
          hours={hours}
          unit={unit}
          timeFormat={timeFormat}
          targetDate={graphTargetDate}
          onActiveDateChange={handleGraphActiveDateChange}
        />
      )}
    </div>
  );
}

/**
 * 10-Day Interactive Graph View using the exact same MobileHourlyTimelineView
 * look & feel as Hourly Expanded for 100% visual consistency.
 */
function DailyGraphView({
  hours = [],
  unit = 'C',
  timeFormat = '24h',
  targetDate = null,
  onActiveDateChange,
}) {
  const timelineHours = useMemo(() => {
    if (!hours || hours.length === 0) return [];
    const currentIdx = hours.findIndex((h) => h.isCurrent);
    const startIdx = currentIdx !== -1 ? currentIdx : 0;
    return hours.slice(startIdx, startIdx + 240);
  }, [hours]);

  if (timelineHours.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
        No multi-day hourly data available for graph view.
      </div>
    );
  }

  return (
    <MobileHourlyTimelineView
      hours={timelineHours}
      unit={unit}
      timeFormat={timeFormat}
      targetDate={targetDate}
      onActiveDateChange={onActiveDateChange}
    />
  );
}

/**
 * Reusable Yr-Style Curve Panel with Sticky Left Y-Axis and Gridlines
 */
function YrGridChartPanel({
  items,
  valueKey,
  yAxisWidth,
  colWidth,
  chartWidth,
  height,
  minVal,
  maxVal,
  tickCount = 5,
  tickSuffix = '',
  strokeColor,
  fillFrom,
  showWindArrows = false,
  legendContent,
}) {
  const padTop = 8;
  const padBot = 8;
  const usableH = height - padTop - padBot;
  const range = maxVal - minVal || 1;

  // Build horizontal Y-axis grid ticks
  const yTicks = [];
  for (let t = 0; t <= tickCount; t++) {
    const val = minVal + (range * t) / tickCount;
    const y = padTop + usableH - (usableH * t) / tickCount;
    yTicks.push({ val: Math.round(val), y });
  }

  // Build curve coordinates
  const coords = items.map((item, i) => {
    const val = item[valueKey];
    const norm = Math.min(1, Math.max(0, (val - minVal) / range));
    const y = padTop + (1 - norm) * usableH;
    const x = i * colWidth + colWidth / 2;
    return { x, y, windDir: item.windDir, hourNum: item.hourNum };
  });

  let pathD = '';
  let fillD = '';
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpX2 = cpX1;
      pathD += ` C ${cpX1} ${curr.y}, ${cpX2} ${next.y}, ${next.x} ${next.y}`;
    }
    fillD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;
  }

  const gradId = `yr-grad-${valueKey}`;

  return (
    <div>
      <div className="flex items-start">
        {/* Sticky Left Y-Axis */}
        <div
          style={{ width: `${yAxisWidth}px`, height: `${height}px` }}
          className="sticky left-0 z-20 shrink-0 bg-black/95 border-r border-zinc-800 relative"
        >
          {yTicks.map((t, i) => (
            <span
              key={i}
              style={{ top: `${t.y}px` }}
              className="absolute right-1.5 -translate-y-1/2 text-[11px] font-mono font-semibold text-zinc-300"
            >
              {t.val}
              {tickSuffix}
            </span>
          ))}
        </div>

        {/* SVG Chart Area */}
        <svg width={chartWidth} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fillFrom} />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {yTicks.map((t, i) => (
            <line
              key={`hg-${i}`}
              x1={0}
              y1={t.y}
              x2={chartWidth}
              y2={t.y}
              stroke="#27272a"
              strokeWidth="1"
            />
          ))}

          {/* Vertical 2-hour grid lines */}
          {coords.map((c, i) =>
            c.hourNum % 2 === 0 ? (
              <line
                key={`vg-${i}`}
                x1={i * colWidth}
                y1={0}
                x2={i * colWidth}
                y2={height}
                stroke={c.hourNum === 0 ? '#52525b' : '#27272a'}
                strokeWidth={c.hourNum === 0 ? '1.2' : '0.8'}
              />
            ) : null
          )}

          {fillD && <path d={fillD} fill={`url(#${gradId})`} />}
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
        </svg>
      </div>

      {/* Optional Wind Direction Arrows Row */}
      {showWindArrows && (
        <div className="flex items-center mt-1.5">
          <div style={{ width: `${yAxisWidth}px` }} className="sticky left-0 z-20 shrink-0 bg-black" />
          <div className="flex">
            {items.map((item, i) => (
              <div
                key={`wa-${i}`}
                style={{ width: `${colWidth}px` }}
                className="shrink-0 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-zinc-100"
                  style={{ transform: `rotate(${item.windDir}deg)` }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <polyline points="7 15 12 20 17 15" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Legend Caption */}
      <div className="mt-1.5 flex items-center">
        <div style={{ left: `${yAxisWidth + 8}px` }} className="sticky inline-block">
          {legendContent}
        </div>
      </div>
    </div>
  );
}

/**
 * Yr-Style Precipitation Bar Panel (Expected + Possible precipitation)
 */
function YrPrecipBarPanel({
  items,
  yAxisWidth,
  colWidth,
  chartWidth,
  height,
  maxVal,
  precipUnitLabel,
}) {
  const padTop = 8;
  const padBot = 6;
  const usableH = height - padTop - padBot;

  const yTicks = [0, 1, 2, 3, 4].map((step) => {
    const val = Math.round(((maxVal * step) / 4) * 10) / 10;
    const y = padTop + usableH - (usableH * step) / 4;
    return { val, y };
  });

  return (
    <div>
      <div className="flex items-start">
        <div
          style={{ width: `${yAxisWidth}px`, height: `${height}px` }}
          className="sticky left-0 z-20 shrink-0 bg-black/95 border-r border-zinc-800 relative"
        >
          {yTicks.map((t, i) => (
            <span
              key={i}
              style={{ top: `${t.y}px` }}
              className="absolute right-1.5 -translate-y-1/2 text-[11px] font-mono font-semibold text-zinc-300"
            >
              {t.val}
            </span>
          ))}
        </div>

        <svg width={chartWidth} height={height} className="block overflow-visible">
          {/* Grid */}
          {yTicks.map((t, i) => (
            <line
              key={`phg-${i}`}
              x1={0}
              y1={t.y}
              x2={chartWidth}
              y2={t.y}
              stroke="#27272a"
              strokeWidth="1"
            />
          ))}

          {items.map((item, i) =>
            item.hourNum % 2 === 0 ? (
              <line
                key={`pvg-${i}`}
                x1={i * colWidth}
                y1={0}
                x2={i * colWidth}
                y2={height}
                stroke={item.hourNum === 0 ? '#52525b' : '#27272a'}
                strokeWidth={item.hourNum === 0 ? '1.2' : '0.8'}
              />
            ) : null
          )}

          {/* Bars */}
          {items.map((item, i) => {
            const x = i * colWidth + 6;
            const barW = colWidth - 12;
            const expH = Math.min(usableH, (item.precip / maxVal) * usableH);
            const possH = Math.min(usableH, (item.possiblePrecip / maxVal) * usableH);
            const baseY = padTop + usableH;

            return (
              <g key={`bar-${i}`}>
                {possH > 1 && (
                  <rect
                    x={x}
                    y={baseY - possH}
                    width={barW}
                    height={possH}
                    rx="2"
                    fill="rgba(56, 189, 248, 0.35)"
                  />
                )}
                {expH > 1 && (
                  <rect
                    x={x}
                    y={baseY - expH}
                    width={barW}
                    height={expH}
                    rx="2"
                    fill="#60a5fa"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-1.5 flex items-center">
        <div style={{ left: `${yAxisWidth + 8}px` }} className="sticky inline-flex items-center gap-3 text-[13px] text-slate-100 font-bold whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
            <span>Expected precipitation, {precipUnitLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400/40 border border-sky-400/50 inline-block" />
            <span>Possible precipitation, {precipUnitLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
