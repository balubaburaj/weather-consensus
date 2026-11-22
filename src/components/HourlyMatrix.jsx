import React, { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { WEATHER_PROVIDERS, PROVIDER_KEYS, resolveSmartWeatherInfo } from '../constants/providers';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp } from '../utils/units';
import {
  Sparkles,
  CheckCircle,
  Clock,
  Calendar,
  Sun,
  Sunrise,
  Sunset,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';

// ============================================================================
// SUBCOMPONENT 1: TOP CONTROLS & TOUCH-SEEK TIMELINE CONTROL CENTER
// (Rerenders when seekIndex changes, without re-rendering the 1,700-cell table)
// ============================================================================
const MatrixScrubberBar = memo(function MatrixScrubberBar({
  hourlyData,
  seekIndex,
  onSeekChange,
  activeViewingDate,
  activeViewingHour,
  onJumpToNow,
  onPresetSeek,
  onNudge,
  todayDateStr,
  unit,
  getHumanDayTitle,
}) {
  const seekHour = hourlyData[seekIndex] || hourlyData[0];

  return (
    <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 space-y-3.5">
      {/* Title, Viewing Status & Navigation Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Continuous Multi-Day Hourly Matrix</span>
            </h3>
            <span className="text-[10px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Endless Horizontal Seek
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Swipe across all 9 days continuously. Auto-lands on current time. Click any column for the showdown modal.
          </p>
        </div>

        {/* Real-time Viewing Indicator Badge & Jump to Now */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Center-View Date & Time Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Viewing:</span>
            <span className="font-bold text-white">
              {getHumanDayTitle(activeViewingDate)} ({activeViewingDate})
            </span>
            <span className="font-mono font-bold text-cyan-300">
              • {activeViewingHour?.hourLabel || seekHour?.hourLabel}{' '}
              {activeViewingHour?.isCurrent && '(NOW)'}
            </span>
          </div>

          {/* Jump to Now Button */}
          <button
            onClick={onJumpToNow}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer"
            title="Jump directly to Current Time (NOW)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Jump to Now</span>
          </button>

          {/* Nudge Arrows (Quick ±6h skip) */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onNudge(-6)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="Back 6 hours"
            >
              -6h
            </button>
            <button
              onClick={() => onNudge(6)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="Forward 6 hours"
            >
              +6h
            </button>
          </div>
        </div>
      </div>

      {/* 🖐️ TOUCH & SEEK INTERACTIVE SCRUBBER BAR */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <span className="text-base">👆</span>
            <span>Touch &amp; Seek Timeline Scrubber:</span>
          </div>

          {/* Live Hover/Scrub Info Chip */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold">
              <WeatherIcon iconName={seekHour?.consensus?.weatherIcon || 'Sun'} className="w-4 h-4" />
              <span>
                {getHumanDayTitle(seekHour?.date)} • {seekHour?.hourLabel}{' '}
                {seekHour?.isCurrent && '(NOW)'}
              </span>
            </div>
            <span className="text-white font-bold font-mono">
              {seekHour?.consensus?.temperature !== undefined && formatTemp(seekHour.consensus.temperature, unit)}
            </span>
            <span className="text-[10px] text-slate-400">
              (Feels {seekHour?.consensus?.apparentTemperature !== undefined && formatTemp(seekHour.consensus.apparentTemperature, unit)})
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              seekHour?.consensus?.rainTypeInfo?.badgeBg || 'bg-slate-800 text-slate-300'
            }`}>
              {seekHour?.consensus?.precipitationProbability}% {seekHour?.consensus?.precipitation > 0 && `(${seekHour.consensus.precipitation}mm)`}
            </span>
          </div>
        </div>

        {/* The Range Slider */}
        <div className="relative py-1">
          <input
            type="range"
            min={0}
            max={hourlyData.length - 1}
            value={seekIndex}
            onChange={(e) => onSeekChange(Number(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
          />
        </div>

        {/* Quick-Seek Touch Preset Pills (Instant Jump Targets) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs touch-pan-x scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            Quick Seek:
          </span>

          {/* Current NOW Preset */}
          <button
            onClick={onJumpToNow}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Clock className="w-3 h-3" />
            <span>Current Time (NOW)</span>
          </button>

          {/* Yesterday Midday */}
          <button
            onClick={() => {
              const today = todayDateStr || new Date().toISOString().split('T')[0];
              const d = new Date(today + 'T12:00:00');
              d.setDate(d.getDate() - 1);
              const yestStr = d.toISOString().split('T')[0];
              onPresetSeek((h) => h.date === yestStr && h.hourLabel.startsWith('12'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Yesterday Midday</span>
          </button>

          {/* Today Morning */}
          <button
            onClick={() => {
              const today = todayDateStr || new Date().toISOString().split('T')[0];
              onPresetSeek((h) => h.date === today && h.hourLabel.startsWith('08'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Sunrise className="w-3 h-3 text-amber-400" />
            <span>Today 08:00</span>
          </button>

          {/* Today Afternoon */}
          <button
            onClick={() => {
              const today = todayDateStr || new Date().toISOString().split('T')[0];
              onPresetSeek((h) => h.date === today && h.hourLabel.startsWith('14'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Today 14:00</span>
          </button>

          {/* Today Evening */}
          <button
            onClick={() => {
              const today = todayDateStr || new Date().toISOString().split('T')[0];
              onPresetSeek((h) => h.date === today && h.hourLabel.startsWith('20'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Sunset className="w-3 h-3 text-purple-400" />
            <span>Today 20:00</span>
          </button>

          {/* Tomorrow Morning */}
          <button
            onClick={() => {
              const today = todayDateStr || new Date().toISOString().split('T')[0];
              const d = new Date(today + 'T12:00:00');
              d.setDate(d.getDate() + 1);
              const tomStr = d.toISOString().split('T')[0];
              onPresetSeek((h) => h.date === tomStr && h.hourLabel.startsWith('09'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white shrink-0 transition-all active:scale-95 border border-cyan-500/20 cursor-pointer"
          >
            <ArrowRight className="w-3 h-3" />
            <span>Tomorrow 09:00</span>
          </button>

          {/* Day +2 */}
          <button
            onClick={() => {
              const today = todayDateStr || new Date().toISOString().split('T')[0];
              const d = new Date(today + 'T12:00:00');
              d.setDate(d.getDate() + 2);
              const plus2Str = d.toISOString().split('T')[0];
              onPresetSeek((h) => h.date === plus2Str && h.hourLabel.startsWith('12'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>+2 Days Midday</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// SUBCOMPONENT 2: MEMOIZED TABLE DATA GRID
// (Prevents re-rendering 1,728 DOM cells during scrubber dragging or scroll ticks)
// ============================================================================
const MemoizedMatrixTable = memo(function MemoizedMatrixTable({
  hourlyData,
  unit,
  onSelectHour,
  selectedHour,
  activeProviders,
  visibleProviderKeys,
  hourColRefs,
  dateColRefs,
  getHumanDayTitle,
}) {
  return (
    <table className="w-full text-left border-collapse min-w-[1200px]">
      <thead>
        {/* Header Row: Sticky Provider Label + Continuous Hourly Columns */}
        <tr className="border-b border-slate-800 bg-slate-950/95 text-xs">
          {/* Sticky Provider Name Column */}
          <th className="sticky left-0 z-30 bg-slate-950/95 p-3.5 font-black uppercase tracking-wider text-slate-400 border-r border-slate-800 min-w-[210px] backdrop-blur-md shadow-md align-bottom">
            <div className="flex flex-col justify-end h-full">
              <div className="text-[10px] text-cyan-400/80 font-mono font-normal mb-1">
                Timeline &amp; 8 NWP Models
              </div>
              <div className="text-xs font-black text-slate-200">Model / Provider</div>
            </div>
          </th>

          {/* Endless Hourly Columns with IN-FLOW, NEVER-CLIPPED Date Badges */}
          {hourlyData.map((hour, idx) => {
            const isNewDay = idx === 0 || hour.date !== hourlyData[idx - 1].date;
            const c = hour.consensus;
            const isSelected = selectedHour?.timeIso === hour.timeIso;
            const isCurrent = hour.isCurrent;

            // Human day label
            const dayLabel = getHumanDayTitle(hour.date);
            const dObj = new Date(hour.date + 'T12:00:00');
            const formattedDate = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <th
                key={hour.timeIso}
                ref={(el) => {
                  hourColRefs.current[hour.timeIso] = el;
                  if (isNewDay) dateColRefs.current[hour.date] = el;
                }}
                onClick={() => onSelectHour(hour)}
                className={`p-2.5 text-center min-w-[115px] max-w-[125px] cursor-pointer transition-colors relative group ${
                  isNewDay
                    ? 'border-l-4 border-l-cyan-400 bg-slate-900/80 shadow-md'
                    : 'border-r border-slate-800/40'
                } ${
                  isCurrent
                    ? 'bg-blue-600/20 ring-2 ring-cyan-400 rounded-t-xl z-10'
                    : isSelected
                    ? 'bg-cyan-500/20'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                {/* IN-FLOW DATE HEADER - 100% UNCLIPPED & PROMINENT */}
                <div className="w-full pb-2 mb-2 border-b border-slate-800/70 flex items-center justify-center min-h-[30px]">
                  {isNewDay ? (
                    <div className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow whitespace-nowrap border border-cyan-300/40">
                      📅 {dayLabel}
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {formattedDate}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isCurrent ? 'text-cyan-300 font-black scale-105' : 'text-slate-200'
                      }`}
                    >
                      {hour.hourLabel}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow animate-pulse">
                        NOW
                      </span>
                    )}
                  </div>

                  {/* Agreement Pill */}
                  {c && (
                    <div
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 ${
                        c.isDivergent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : c.agreementScore >= 80
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {c.isDivergent ? '⚠️ Split' : `${c.agreementScore}% Match`}
                    </div>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-800/60 text-xs">
        {/* ROW 1: TrueCast AI Consensus (Highlighted Ensembled Ensemble) */}
        <tr className="bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/60 border-b-2 border-cyan-500/40 font-medium">
          <td className="sticky left-0 z-20 bg-slate-900/95 p-3.5 border-r border-slate-800 backdrop-blur-md shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-cyan-300 text-xs flex items-center gap-1">
                  TrueCast Consensus
                </div>
                <div className="text-[10px] text-slate-400">Blended Smart Ensemble</div>
              </div>
            </div>
          </td>

          {hourlyData.map((hour, idx) => {
            const isNewDay = idx === 0 || hour.date !== hourlyData[idx - 1].date;
            const c = hour.consensus;
            if (!c) {
              return (
                <td
                  key={hour.timeIso}
                  className={`p-2 text-center text-slate-400 ${
                    isNewDay ? 'border-l-4 border-l-cyan-400 bg-cyan-950/20' : 'border-r border-slate-800/40'
                  }`}
                >
                  --
                </td>
              );
            }

            return (
              <td
                key={hour.timeIso}
                onClick={() => onSelectHour(hour)}
                className={`p-2 text-center cursor-pointer hover:bg-cyan-500/20 transition-colors ${
                  isNewDay ? 'border-l-4 border-l-cyan-400 bg-cyan-950/20' : 'border-r border-slate-800/40'
                } ${hour.isCurrent ? 'bg-blue-600/15 ring-1 ring-cyan-400' : ''}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <WeatherIcon iconName={c.weatherIcon} className="w-5 h-5" />

                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold truncate max-w-[95px] ${
                      c.rainTypeInfo?.badgeBg || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {c.shortLabel || 'Partly Cloudy'}
                  </span>

                  <div className="font-black text-white text-xs font-mono">
                    {formatTemp(c.temperature, unit)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Feels {formatTemp(c.apparentTemperature, unit)}
                  </div>

                  <div
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      c.precipitationProbability >= 60
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-500/30'
                        : c.precipitationProbability >= 30
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {c.precipitationProbability}% {c.precipitation > 0 && `(${c.precipitation}mm)`}
                  </div>
                </div>
              </td>
            );
          })}
        </tr>

        {/* INDIVIDUAL WEATHER PROVIDER ROWS (UK Met, Yr.no, ECMWF, etc.) */}
        {visibleProviderKeys.map((key) => {
          const provider = WEATHER_PROVIDERS[key];

          return (
            <tr key={key} className="hover:bg-slate-850/50 transition-colors">
              {/* Provider sticky label cell */}
              <td className="sticky left-0 z-20 bg-slate-900/95 p-3.5 border-r border-slate-800 backdrop-blur-md shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: provider.color }}
                    />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">
                        {provider.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {provider.origin}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    {provider.resolution}
                  </span>
                </div>
              </td>

              {/* Hourly cells across all days */}
              {hourlyData.map((hour, idx) => {
                const isNewDay = idx === 0 || hour.date !== hourlyData[idx - 1].date;
                const data = hour.providers[key];
                if (!data || data.temperature === null) {
                  return (
                    <td
                      key={hour.timeIso}
                      className={`p-2 text-center text-slate-400 ${
                        isNewDay ? 'border-l-4 border-l-cyan-400/60 bg-cyan-950/10' : 'border-r border-slate-800/40'
                      }`}
                    >
                      --
                    </td>
                  );
                }

                const prob = data.precipitationProbability;
                const precip = data.precipitation;
                const smartInfo = resolveSmartWeatherInfo(data.weatherCode, prob, precip);

                return (
                  <td
                    key={hour.timeIso}
                    onClick={() => onSelectHour(hour)}
                    className={`p-2 text-center cursor-pointer hover:bg-slate-800/60 transition-colors ${
                      isNewDay ? 'border-l-4 border-l-cyan-400/60 bg-cyan-950/10' : 'border-r border-slate-800/40'
                    } ${hour.isCurrent ? 'bg-blue-600/5' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <WeatherIcon iconName={smartInfo.icon} className="w-4 h-4 opacity-90" />

                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-semibold truncate max-w-[90px] ${
                          smartInfo.rainInfo?.badgeBg || 'bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        {smartInfo.shortLabel}
                      </span>

                      <div className="font-bold text-slate-200 text-xs font-mono">
                        {formatTemp(data.temperature, unit)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Feels {formatTemp(data.apparentTemperature, unit)}
                      </div>

                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          prob >= 70
                            ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30'
                            : prob >= 40
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
                            : prob >= 20
                            ? 'bg-amber-500/15 text-amber-300/90'
                            : 'bg-slate-800/50 text-slate-400'
                        }`}
                        title={`${smartInfo.label} • ${prob}% chance (${precip} mm)`}
                      >
                        {prob}% {precip > 0 && `(${precip}mm)`}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}

        {/* GROUND TRUTH ACTUAL OBSERVED ROW */}
        <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/30">
          <td className="sticky left-0 z-20 bg-slate-900/95 p-3.5 border-r border-slate-800 backdrop-blur-md shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-emerald-300 text-xs">
                  Ground Truth (Actuals)
                </div>
                <div className="text-[10px] text-slate-400">Recorded weather readings</div>
              </div>
            </div>
          </td>

          {hourlyData.map((hour, idx) => {
            const isNewDay = idx === 0 || hour.date !== hourlyData[idx - 1].date;
            const act = hour.actual;
            if (!hour.isPast || act?.temperature === null) {
              return (
                <td
                  key={hour.timeIso}
                  className={`p-2 text-center text-slate-400 text-[10px] ${
                    isNewDay ? 'border-l-4 border-l-cyan-400/60 bg-emerald-950/10' : 'border-r border-slate-800/40'
                  }`}
                >
                  Future
                </td>
              );
            }

            const smartActual = resolveSmartWeatherInfo(
              act.weatherCode,
              act.precipitation > 0 ? 95 : 0,
              act.precipitation
            );

            return (
              <td
                key={hour.timeIso}
                onClick={() => onSelectHour(hour)}
                className={`p-2 text-center cursor-pointer hover:bg-emerald-500/15 transition-colors ${
                  isNewDay ? 'border-l-4 border-l-cyan-400/60 bg-emerald-950/10' : 'border-r border-slate-800/40'
                } ${hour.isCurrent ? 'bg-emerald-500/15' : ''}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <WeatherIcon iconName={smartActual.icon} className="w-4 h-4" />

                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-[90px]">
                    {smartActual.shortLabel}
                  </span>

                  <div className="font-bold text-emerald-300 text-xs font-mono">
                    {formatTemp(act.temperature, unit)}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-mono">
                    Feels {formatTemp(act.apparentTemperature, unit)}
                  </div>

                  <div className="text-[10px] text-emerald-300 font-mono font-bold">
                    {act.precipitation > 0 ? `${act.precipitation} mm` : '0 mm'}
                  </div>
                </div>
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
});

// ============================================================================
// MAIN COMPONENT: HourlyMatrix
// ============================================================================
export default function HourlyMatrix({
  allHours = [],
  hours = [],
  unit,
  onSelectHour,
  selectedHour,
  activeProviders = {},
  selectedDate,
  todayDateStr,
  onDateChange,
  jumpNowTrigger = 0,
}) {
  const hourlyData = useMemo(() => {
    return allHours && allHours.length > 0 ? allHours : hours || [];
  }, [allHours, hours]);

  const scrollRef = useRef(null);
  const hourColRefs = useRef({});
  const dateColRefs = useRef({});
  const columnOffsetsRef = useRef([]);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasAutoScrolled = useRef(false);
  
  // Guard against feedback loops during programmatic smooth scrolling
  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef(null);
  const debounceScrollEndRef = useRef(null);
  const rafId = useRef(null);

  const [seekIndex, setSeekIndex] = useState(0);
  const [activeViewingDate, setActiveViewingDate] = useState(selectedDate || todayDateStr);
  const [activeViewingHour, setActiveViewingHour] = useState(null);

  // Helper for human day title
  const getHumanDayTitle = useCallback((dateStr) => {
    const today = todayDateStr || new Date().toISOString().split('T')[0];
    const d = new Date(dateStr + 'T12:00:00');
    const t = new Date(today + 'T12:00:00');
    const diff = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === 2) return d.toLocaleDateString('en-US', { weekday: 'long' });
    if (diff === -1) return 'Yesterday';
    if (diff === -2) return '2 Days Ago';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [todayDateStr]);

  // Find current hour index in the continuous timeline
  const currentHourIndex = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return -1;
    const idx = hourlyData.findIndex((h) => h.isCurrent);
    if (idx >= 0) return idx;

    // Fallback: match by today's date and approximate hour
    const nowHour = new Date().getHours();
    const fallbackDate = todayDateStr || new Date().toISOString().split('T')[0];
    const matchIdx = hourlyData.findIndex(
      (h) => h.date === fallbackDate && parseInt(h.hourLabel.split(':')[0], 10) === nowHour
    );
    if (matchIdx >= 0) return matchIdx;

    return hourlyData.findIndex((h) => h.date === fallbackDate);
  }, [hourlyData, todayDateStr]);

  // Pre-measure column offsets in memory to eliminate DOM layout thrashing during scroll
  const measureColumnOffsets = useCallback(() => {
    if (!hourlyData || hourlyData.length === 0) return;
    const offsets = [];
    for (let i = 0; i < hourlyData.length; i++) {
      const h = hourlyData[i];
      const el = hourColRefs.current[h.timeIso];
      offsets.push(el ? el.offsetLeft : i * 120);
    }
    columnOffsetsRef.current = offsets;
  }, [hourlyData]);

  // Measure offsets after mount and layout calculation
  useEffect(() => {
    const timer = setTimeout(measureColumnOffsets, 150);
    window.addEventListener('resize', measureColumnOffsets);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureColumnOffsets);
    };
  }, [measureColumnOffsets]);

  // Smoothly center a specific hour column in the scroll container
  const scrollToHourIndex = useCallback(
    (index, behavior = 'smooth') => {
      if (index < 0 || index >= hourlyData.length) return;
      const hour = hourlyData[index];
      if (!hour) return;

      const el = hourColRefs.current[hour.timeIso];
      if (el && scrollRef.current) {
        const container = scrollRef.current;
        const elOffset = el.offsetLeft;
        const elWidth = el.offsetWidth;
        const containerWidth = container.offsetWidth;

        isProgrammaticScroll.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 750);

        const targetScroll = elOffset - containerWidth / 2 + elWidth / 2;
        container.scrollTo({ left: Math.max(0, targetScroll), behavior });
      }
    },
    [hourlyData]
  );

  // Jump to Current Hour (NOW)
  const jumpToNow = useCallback(() => {
    const targetIdx = currentHourIndex >= 0 ? currentHourIndex : 0;
    setSeekIndex(targetIdx);
    scrollToHourIndex(targetIdx, 'smooth');

    const targetHour = hourlyData[targetIdx];
    if (targetHour) {
      setActiveViewingDate(targetHour.date);
      setActiveViewingHour(targetHour);
    }
  }, [currentHourIndex, hourlyData, scrollToHourIndex]);

  // AUTO-SCROLL ON INITIAL LOAD OR PAGE REFRESH -> Always land on CURRENT DATE & TIME (NOW)!
  useEffect(() => {
    if (!hasAutoScrolled.current && hourlyData.length > 0 && currentHourIndex >= 0) {
      const timer = setTimeout(() => {
        scrollToHourIndex(currentHourIndex, 'instant');
        hasAutoScrolled.current = true;
        setSeekIndex(currentHourIndex);
        setActiveViewingHour(hourlyData[currentHourIndex]);
        setActiveViewingDate(hourlyData[currentHourIndex]?.date);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hourlyData, currentHourIndex, scrollToHourIndex]);

  // React to jumpNowTrigger (e.g. user clicked "Today NOW" pill in DaySelector)
  useEffect(() => {
    if (jumpNowTrigger > 0 && currentHourIndex >= 0) {
      jumpToNow();
    }
  }, [jumpNowTrigger, currentHourIndex, jumpToNow]);

  // When selectedDate changes externally (e.g. user clicked Tomorrow, Monday, etc. in DaySelector)
  useEffect(() => {
    if (!hasAutoScrolled.current || !selectedDate) return;

    if (selectedDate === todayDateStr && currentHourIndex >= 0) {
      scrollToHourIndex(currentHourIndex, 'smooth');
      setSeekIndex(currentHourIndex);
      setActiveViewingDate(todayDateStr);
      setActiveViewingHour(hourlyData[currentHourIndex]);
    } else {
      const morningHour = hourlyData.find((h) => h.date === selectedDate && h.hourLabel.startsWith('08'));
      const targetHour = morningHour || hourlyData.find((h) => h.date === selectedDate);
      if (targetHour) {
        const idx = hourlyData.indexOf(targetHour);
        if (idx >= 0) {
          setSeekIndex(idx);
          setActiveViewingDate(selectedDate);
          setActiveViewingHour(targetHour);
          scrollToHourIndex(idx, 'smooth');
        }
      }
    }
  }, [selectedDate, todayDateStr, currentHourIndex, hourlyData, scrollToHourIndex]);

  // Handle Seek Scrubber slider change
  const handleSeekChange = useCallback((newIndex) => {
    setSeekIndex(newIndex);
    scrollToHourIndex(newIndex, 'smooth');
    const hour = hourlyData[newIndex];
    if (hour) {
      setActiveViewingDate(hour.date);
      setActiveViewingHour(hour);
    }
  }, [hourlyData, scrollToHourIndex]);

  // Quick preset seek button click handler
  const handlePresetSeek = useCallback((matcher) => {
    const idx = hourlyData.findIndex(matcher);
    if (idx >= 0) {
      handleSeekChange(idx);
    }
  }, [hourlyData, handleSeekChange]);

  // Nudge left or right by hours
  const handleNudge = useCallback((hoursDelta) => {
    const targetIdx = Math.max(0, Math.min(hourlyData.length - 1, seekIndex + hoursDelta));
    handleSeekChange(targetIdx);
  }, [hourlyData.length, seekIndex, handleSeekChange]);

  // Mouse Drag-to-Scroll handlers (Trackpad & Desktop Touch Ergonomics)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.6;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Ultra-efficient scroll handler: uses precalculated offsets and requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || hourlyData.length === 0) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const scrollPos = scrollRef.current.scrollLeft + scrollRef.current.offsetWidth / 2;

      // Fast binary or sampled search using in-memory offset array (zero DOM layout queries)
      const offsets = columnOffsetsRef.current;
      let closestIdx = 0;
      let minDiff = Infinity;

      if (offsets.length > 0) {
        for (let i = 0; i < offsets.length; i += 2) {
          const diff = Math.abs(scrollPos - offsets[i] - 60);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
      } else {
        closestIdx = Math.max(0, Math.min(hourlyData.length - 1, Math.round(scrollPos / 120)));
      }

      const closestHour = hourlyData[closestIdx];
      if (closestHour) {
        setActiveViewingHour(closestHour);
        setActiveViewingDate(closestHour.date);
        setSeekIndex(closestIdx);
      }

      // Do NOT trigger onDateChange if smooth programmatic scroll is in flight
      if (isProgrammaticScroll.current) return;

      // Debounced date change callback to parent
      if (debounceScrollEndRef.current) clearTimeout(debounceScrollEndRef.current);
      debounceScrollEndRef.current = setTimeout(() => {
        if (!isProgrammaticScroll.current && closestHour && closestHour.date !== selectedDate && onDateChange) {
          onDateChange(closestHour.date);
        }
      }, 450);
    });
  }, [hourlyData, selectedDate, onDateChange]);

  const visibleProviderKeys = useMemo(() => {
    return PROVIDER_KEYS.filter((k) => activeProviders[k] !== false);
  }, [activeProviders]);

  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        No hourly data available.
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md mb-8">
      {/* 1. Scrubber & Top Control Bar (isolated memoized subcomponent) */}
      <MatrixScrubberBar
        hourlyData={hourlyData}
        seekIndex={seekIndex}
        onSeekChange={handleSeekChange}
        activeViewingDate={activeViewingDate}
        activeViewingHour={activeViewingHour}
        onJumpToNow={jumpToNow}
        onPresetSeek={handlePresetSeek}
        onNudge={handleNudge}
        todayDateStr={todayDateStr}
        unit={unit}
        getHumanDayTitle={getHumanDayTitle}
      />

      {/* 2. Main Endless Horizontally Scrollable Table Container */}
      <div
        className="relative overflow-x-auto touch-pan-x cursor-grab active:cursor-grabbing select-none"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <MemoizedMatrixTable
          hourlyData={hourlyData}
          unit={unit}
          onSelectHour={onSelectHour}
          selectedHour={selectedHour}
          activeProviders={activeProviders}
          visibleProviderKeys={visibleProviderKeys}
          hourColRefs={hourColRefs}
          dateColRefs={dateColRefs}
          getHumanDayTitle={getHumanDayTitle}
        />
      </div>

      {/* 3. Footer & Legend */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600/50 border border-blue-500/40" />
            <span>Heavy Lashing Rain (≥2.5mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/25 border border-blue-500/30" />
            <span>Moderate Showers (0.7-2.4mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-500/20" />
            <span>Light Rain (0.25-0.6mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-500/20 border border-teal-500/20" />
            <span>Misting / "Soft Day"</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-800" />
            <span>Dry &amp; Settled</span>
          </div>
        </div>

        <div className="text-[11px] text-cyan-300/80 flex items-center gap-1.5 font-medium">
          <span>💡 Endless scrolling: swipe right past 23:00 to glide seamlessly into the next day</span>
        </div>
      </div>
    </div>
  );
}
