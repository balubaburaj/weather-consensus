import React, { useState, useMemo } from 'react';
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
  const precipProb = c.precipitationProbability !== undefined ? c.precipitationProbability : (a.precipitationProbability ?? 0);
  const precipMm = c.precipitation !== undefined ? c.precipitation : (a.precipitation ?? 0);
  const windKmh = c.windSpeed !== undefined ? c.windSpeed : (a.windSpeed ?? 10);
  const code = c.weatherCode !== undefined ? c.weatherCode : (a.weatherCode ?? 0);
  const pressure = a.surfacePressure ?? 1013;
  const windDir = a.windDirection ?? 180;

  // Max precipitation across providers for "Possible precipitation" envelope
  let maxModelPrecipMm = precipMm;
  if (h.providers) {
    Object.values(h.providers).forEach((p) => {
      if (p && typeof p.precipitation === 'number' && p.precipitation > maxModelPrecipMm) {
        maxModelPrecipMm = p.precipitation;
      }
    });
  }

  const smartInfo = resolveSmartWeatherInfo(code, precipMm > 0 || precipProb >= 40 ? precipProb : 0, precipMm);

  return {
    temp: convertTemp(tempC, unit),
    tempC,
    precipProb: Math.round(precipProb),
    precip: convertPrecip(precipMm, unit),
    precipMm,
    possiblePrecip: convertPrecip(maxModelPrecipMm, unit),
    wind: convertWind(windKmh, unit),
    windDir,
    pressure: Math.round(pressure),
    code,
    icon: smartInfo.icon || 'Cloud',
    isDay: h.isDay !== undefined ? Boolean(h.isDay) : (getHourNumber(h) >= 7 && getHourNumber(h) < 18),
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
  onClose,
}) {
  const [viewTab, setViewTab] = useState('table'); // 'table' | 'graph'
  const [expandedDates, setExpandedDates] = useState({});

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
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const windUnitLabel = unit === 'F' ? 'mph' : 'km/h';
  const precipUnitLabel = unit === 'F' ? 'in' : 'mm';

  return (
    <div className="fixed inset-0 z-50 bg-[#081221] text-slate-100 flex flex-col overflow-hidden select-none animate-fade-in font-sans">
      {/* Top App Bar */}
      <div className="shrink-0 bg-[#0b172a] border-b border-slate-800/80 px-4 pt-3 pb-2.5 z-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-800 text-slate-200 transition cursor-pointer active:scale-95"
              title="Back to overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {selectedCity?.name || 'Cork'}
              </h2>
              <span className="text-[11px] font-semibold text-cyan-400">
                {tenDaysData.length}-Day Forecast
              </span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            °{unit} &bull; {windUnitLabel}
          </span>
        </div>

        {/* Table / Graph Switcher Pills (Matching Yr Design) */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-slate-900/90 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewTab('table')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewTab === 'table'
                ? 'bg-sky-200 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('graph')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewTab === 'graph'
                ? 'bg-sky-200 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Graph</span>
          </button>
        </div>
      </div>

      {/* BODY: Table View OR Graph View */}
      {viewTab === 'table' ? (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-12">
          {tenDaysData.map((day) => {
            const isExpanded = Boolean(expandedDates[day.dateStr]);
            const showColumnHeaders = isExpanded || day.isToday;

            return (
              <div
                key={day.dateStr}
                className="rounded-2xl bg-[#0e1b30] border border-slate-800/80 overflow-hidden shadow-lg"
              >
                {/* Day Header */}
                <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">
                    {day.title}
                  </h3>
                  {!isExpanded && (
                    <span className="text-[10px] font-medium text-slate-400">
                      {day.periods.length === 1 ? 'Tonight' : '6h blocks'}
                    </span>
                  )}
                </div>

                {/* Column Header Row (visible when expanded or for Today) */}
                {showColumnHeaders && (
                  <div className="grid grid-cols-[64px_40px_1fr_1fr_1fr] items-center px-4 pb-1.5 text-[10px] font-semibold text-slate-400 border-b border-slate-800/60">
                    <span>Time</span>
                    <span />
                    <span className="text-center">Temp. °{unit}</span>
                    <span className="text-center">Precip. {precipUnitLabel}</span>
                    <span className="text-right">Wind {windUnitLabel}</span>
                  </div>
                )}

                {/* Rows: 1-Hour Split (Expanded) OR 6-Hour Period Summaries (Collapsed) */}
                <div className="divide-y divide-slate-800/50">
                  {isExpanded
                    ? day.hourlySplit.map((hr, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[64px_40px_1fr_1fr_1fr] items-center px-4 py-2 text-xs hover:bg-slate-800/30 transition-colors"
                        >
                          <span className="font-mono text-slate-300 font-medium">
                            {hr.timeStr}
                          </span>
                          <div className="flex items-center justify-center">
                            <WeatherIcon iconName={hr.icon} isNight={!hr.isDay} className="w-5 h-5 text-slate-100" />
                          </div>
                          <span
                            className={`text-center font-bold font-mono ${
                              hr.temp <= (unit === 'F' ? 32 : 0)
                                ? 'text-sky-300'
                                : 'text-amber-400'
                            }`}
                          >
                            {hr.temp}°
                          </span>
                          <span className="text-center font-mono font-semibold text-sky-400">
                            {hr.precip > 0 ? hr.precip.toFixed(1) : ''}
                          </span>
                          <div className="flex items-center justify-end gap-1.5 text-slate-200 font-mono">
                            <span>{hr.wind}</span>
                            <svg
                              className="w-3 h-3 text-slate-400 shrink-0"
                              style={{ transform: `rotate(${hr.windDir}deg)` }}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
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
                          className="grid grid-cols-[64px_40px_1fr_1fr_1fr] items-center px-4 py-2.5 text-xs"
                        >
                          <span className="font-mono text-slate-300 font-medium">
                            {p.label}
                          </span>
                          <div className="flex items-center justify-center">
                            <WeatherIcon iconName={p.icon} isNight={p.isNight} className="w-5 h-5 text-slate-100" />
                          </div>
                          <span
                            className={`text-center font-bold font-mono ${
                              p.temp <= (unit === 'F' ? 32 : 0)
                                ? 'text-sky-300'
                                : 'text-amber-400'
                            }`}
                          >
                            {p.temp}°
                          </span>
                          <span className="text-center font-mono font-semibold text-sky-400">
                            {p.precip >= 0.1 ? p.precip.toFixed(1) : ''}
                          </span>
                          <span className="text-right font-mono text-slate-200">
                            {p.wind}
                          </span>
                        </div>
                      ))}
                </div>

                {/* Sunrise & Sunset Strip (when expanded) */}
                {isExpanded && (day.sunrise || day.sunset) && (
                  <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-slate-900/50 border-t border-slate-800/60 text-xs">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Sunrise className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-slate-200">{day.sunrise || '--'}</span>
                      <span className="text-[10px] text-slate-400">Sunrise</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Sunset className="w-4 h-4 text-orange-400" />
                      <span className="font-mono font-bold text-slate-200">{day.sunset || '--'}</span>
                      <span className="text-[10px] text-slate-400">Sunset</span>
                    </div>
                  </div>
                )}

                {/* Details Expand/Collapse Footer Button */}
                <button
                  type="button"
                  onClick={() => toggleDayExpand(day.dateStr)}
                  className="w-full py-2.5 px-4 border-t border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/40 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide details' : 'Details'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
          windUnitLabel={windUnitLabel}
          precipUnitLabel={precipUnitLabel}
        />
      )}
    </div>
  );
}

/**
 * 10-Day Interactive Graph View (Yr Reference Style)
 * - Sticky top header with moving Day Pill + Time ticks + Weather Icons
 * - Sticky left Y-axis scales on all 4 charts
 */
function DailyGraphView({
  hours = [],
  unit = 'C',
  timeFormat = '24h',
  windUnitLabel = 'km/h',
  precipUnitLabel = 'mm',
}) {
  // Upcoming hourly sequence across the 10-day window
  const timelineHours = useMemo(() => {
    if (!hours || hours.length === 0) return [];
    const currentIdx = hours.findIndex((h) => h.isCurrent);
    const startIdx = currentIdx !== -1 ? currentIdx : 0;
    return hours.slice(startIdx, startIdx + 240);
  }, [hours]);

  const colWidth = 34; // Compact width matching Yr so ~10-12 hours fit cleanly on phone width
  const yAxisWidth = 44;
  const chartWidth = timelineHours.length * colWidth;

  // Compute day groups for the moving sticky date bar
  const dayGroups = useMemo(() => {
    const groups = [];
    timelineHours.forEach((h, idx) => {
      const m = getHourMetrics(h, unit);
      const tick = formatGraphHourTick(h, timeFormat);
      const hourNum = getHourNumber(h);

      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateStr !== h.date) {
        groups.push({
          dateStr: h.date,
          pill: formatGraphDayPill(h.date),
          startIdx: idx,
          items: [{ idx, hourNum, tick, ...m }],
        });
      } else {
        lastGroup.items.push({ idx, hourNum, tick, ...m });
      }
    });
    return groups;
  }, [timelineHours, unit, timeFormat]);

  const flatItems = useMemo(() => dayGroups.flatMap((g) => g.items), [dayGroups]);

  if (flatItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
        No multi-day hourly data available for graph view.
      </div>
    );
  }

  // Scales for the 4 charts
  const temps = flatItems.map((d) => d.temp);
  const rawTempMin = Math.min(...temps);
  const rawTempMax = Math.max(...temps);
  const tempMin = Math.floor((rawTempMin - 2) / 2) * 2;
  const tempMax = Math.ceil((rawTempMax + 2) / 2) * 2;

  const precips = flatItems.map((d) => Math.max(d.precip, d.possiblePrecip));
  const rawPrecipMax = Math.max(4, ...precips);
  const precipMax = unit === 'F' ? Math.ceil(rawPrecipMax * 4) / 4 : Math.ceil(rawPrecipMax);

  const winds = flatItems.map((d) => d.wind);
  const rawWindMax = Math.max(12, ...winds);
  const windMax = Math.ceil(rawWindMax / 10) * 10;

  const pressures = flatItems.map((d) => d.pressure);
  const rawPresMin = Math.min(1003, ...pressures);
  const rawPresMax = Math.max(1031, ...pressures);
  const presMin = Math.floor(rawPresMin / 7) * 7;
  const presMax = Math.ceil(rawPresMax / 7) * 7;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div style={{ width: `${yAxisWidth + chartWidth}px` }} className="relative min-h-full pb-12">
        
        {/* STICKY TOP BAR: Moving Date Header + Time Ticks + Cloud/Weather Icons */}
        <div className="sticky top-0 z-30 bg-[#0b172a]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
          {/* Row 1: Moving / Sticky Date Header Row */}
          <div className="flex items-center pt-2 pb-1">
            {/* Y-axis corner spacer */}
            <div style={{ width: `${yAxisWidth}px` }} className="sticky left-0 z-40 shrink-0 bg-[#0b172a]" />

            {/* Day segments with overflow-x: clip so sticky date labels glide smoothly & push previous day off */}
            <div className="flex">
              {dayGroups.map((g) => (
                <div
                  key={g.dateStr}
                  style={{ width: `${g.items.length * colWidth}px`, overflowX: 'clip' }}
                  className="shrink-0 border-l border-slate-700/60 first:border-l-0 px-1.5"
                >
                  {g.items.length >= 3 ? (
                    <div
                      style={{ left: `${yAxisWidth + 6}px` }}
                      className="sticky inline-flex items-baseline gap-1 whitespace-nowrap text-xs"
                    >
                      <span className="font-bold text-white">{g.pill.weekday}</span>
                      <span className="text-slate-400 font-medium">{g.pill.rest}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Hour Labels (every 2 hours for readability) */}
          <div className="flex items-center py-0.5">
            <div style={{ width: `${yAxisWidth}px` }} className="sticky left-0 z-40 shrink-0 bg-[#0b172a]" />
            <div className="flex">
              {flatItems.map((item) => {
                const showTick = item.hourNum % 2 === 1 || item.idx === 0;
                return (
                  <div
                    key={`t-${item.idx}`}
                    style={{ width: `${colWidth}px` }}
                    className="shrink-0 flex flex-col items-center leading-tight text-[10px] font-mono text-slate-300"
                  >
                    {showTick ? (
                      <>
                        <span className="font-semibold">{item.tick.main}</span>
                        <span className="text-[9px] text-slate-400">{item.tick.sub}</span>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 3: Weather Icons */}
          <div className="flex items-center pb-2 pt-0.5">
            <div style={{ width: `${yAxisWidth}px` }} className="sticky left-0 z-40 shrink-0 bg-[#0b172a]" />
            <div className="flex">
              {flatItems.map((item) => (
                <div
                  key={`ic-${item.idx}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 flex items-center justify-center h-6"
                >
                  <WeatherIcon iconName={item.icon} isNight={!item.isDay} className="w-5 h-5 text-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 GRAPH PANELS */}
        <div className="space-y-4 pt-3">
          
          {/* 1. Temperature Graph */}
          <YrGridChartPanel
            items={flatItems}
            valueKey="temp"
            yAxisWidth={yAxisWidth}
            colWidth={colWidth}
            chartWidth={chartWidth}
            height={110}
            minVal={tempMin}
            maxVal={tempMax}
            tickCount={5}
            tickSuffix="°"
            strokeColor="#fb7185"
            fillFrom="rgba(249, 115, 22, 0.35)"
            legendContent={
              <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                <span className="w-3 h-1 rounded-full bg-orange-500 inline-block" />
                <span>Temperature, °{unit}</span>
              </div>
            }
          />

          {/* 2. Precipitation Graph (Expected + Possible Bars) */}
          <YrPrecipBarPanel
            items={flatItems}
            yAxisWidth={yAxisWidth}
            colWidth={colWidth}
            chartWidth={chartWidth}
            height={86}
            maxVal={precipMax}
            precipUnitLabel={precipUnitLabel}
          />

          {/* 3. Wind Graph + Wind Direction Arrows */}
          <YrGridChartPanel
            items={flatItems}
            valueKey="wind"
            yAxisWidth={yAxisWidth}
            colWidth={colWidth}
            chartWidth={chartWidth}
            height={104}
            minVal={0}
            maxVal={windMax}
            tickCount={5}
            strokeColor="#c084fc"
            fillFrom="rgba(168, 85, 247, 0.32)"
            showWindArrows={true}
            legendContent={
              <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                <span className="w-3 h-1 rounded-full bg-purple-400 inline-block" />
                <span>Wind, {windUnitLabel}</span>
              </div>
            }
          />

          {/* 4. Air Pressure Graph */}
          <YrGridChartPanel
            items={flatItems}
            valueKey="pressure"
            yAxisWidth={yAxisWidth}
            colWidth={colWidth}
            chartWidth={chartWidth}
            height={104}
            minVal={presMin}
            maxVal={presMax}
            tickCount={5}
            strokeColor="#4ade80"
            fillFrom="rgba(34, 197, 94, 0.30)"
            legendContent={
              <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                <span className="w-3 h-1 rounded-full bg-emerald-400 inline-block" />
                <span>Air pressure, hPa</span>
              </div>
            }
          />

        </div>
      </div>
    </div>
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
          className="sticky left-0 z-20 shrink-0 bg-[#081221]/95 border-r border-slate-700/60 relative"
        >
          {yTicks.map((t, i) => (
            <span
              key={i}
              style={{ top: `${t.y}px` }}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] font-mono text-slate-400"
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
              stroke="#1e293b"
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
                stroke={c.hourNum === 0 ? '#475569' : '#1e293b'}
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
          <div style={{ width: `${yAxisWidth}px` }} className="sticky left-0 z-20 shrink-0 bg-[#081221]" />
          <div className="flex">
            {items.map((item, i) => (
              <div
                key={`wa-${i}`}
                style={{ width: `${colWidth}px` }}
                className="shrink-0 flex items-center justify-center"
              >
                <svg
                  className="w-3.5 h-3.5 text-slate-200"
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
          className="sticky left-0 z-20 shrink-0 bg-[#081221]/95 border-r border-slate-700/60 relative"
        >
          {yTicks.map((t, i) => (
            <span
              key={i}
              style={{ top: `${t.y}px` }}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] font-mono text-slate-400"
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
              stroke="#1e293b"
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
                stroke={item.hourNum === 0 ? '#475569' : '#1e293b'}
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
        <div style={{ left: `${yAxisWidth + 8}px` }} className="sticky inline-flex items-center gap-3 text-xs text-slate-200 font-medium whitespace-nowrap">
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
