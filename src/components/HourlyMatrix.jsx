import React, { useRef } from 'react';
import { WEATHER_PROVIDERS, PROVIDER_KEYS, resolveSmartWeatherInfo } from '../constants/providers';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp, formatPrecip } from '../utils/units';
import { Sparkles, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function HourlyMatrix({
  hours,
  unit,
  onSelectHour,
  selectedHour,
  activeProviders,
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!hours || hours.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        No hourly data available for this date.
      </div>
    );
  }

  // Filter keys based on active providers
  const visibleProviderKeys = PROVIDER_KEYS.filter((k) => activeProviders[k] !== false);

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm mb-8">
      
      {/* Header controls */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Side-by-Side Hourly Matrix
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-semibold">
              Temp • Feels Like • Specific Weather • Rain
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare all models at a glance. Icons and badges tell the story: from fine misting drizzle to heavy lashing rain. Click any column for the deep showdown.
          </p>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matrix Table with fixed row headers and horizontally scrolling hours */}
      <div className="relative overflow-x-auto" ref={scrollRef}>
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/85">
              
              {/* Sticky provider label column */}
              <th className="sticky left-0 z-20 bg-slate-950/95 p-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-r border-slate-800 min-w-[210px] backdrop-blur-md">
                Model / Provider
              </th>

              {/* Hourly Columns */}
              {hours.map((hour) => {
                const c = hour.consensus;
                const isSelected = selectedHour?.timeIso === hour.timeIso;
                const isCurrent = hour.isCurrent;

                return (
                  <th
                    key={hour.timeIso}
                    onClick={() => onSelectHour(hour)}
                    className={`p-2.5 text-center min-w-[115px] max-w-[125px] cursor-pointer transition-colors border-r border-slate-800/40 group ${
                      isSelected
                        ? 'bg-cyan-500/20 ring-1 ring-cyan-500'
                        : isCurrent
                        ? 'bg-blue-500/15'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-mono font-bold ${isCurrent ? 'text-cyan-400' : 'text-slate-200'}`}>
                          {hour.hourLabel}
                        </span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>

                      {/* Agreement Pill */}
                      {c && (
                        <div
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 ${
                            c.isDivergent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : c.agreementScore >= 80
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {c.isDivergent ? '⚠️ Split' : `${c.agreementScore}%`}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            
            {/* ROW 1: TrueCast AI Consensus (Highlighted) */}
            <tr className="bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/60 border-b-2 border-cyan-500/30 font-medium">
              <td className="sticky left-0 z-10 bg-slate-900/95 p-3.5 border-r border-slate-800 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
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

              {hours.map((hour) => {
                const c = hour.consensus;
                if (!c) return <td key={hour.timeIso} className="p-2 text-center text-slate-400">--</td>;

                return (
                  <td
                    key={hour.timeIso}
                    onClick={() => onSelectHour(hour)}
                    className="p-2 text-center cursor-pointer hover:bg-cyan-500/15 transition-colors border-r border-slate-800/40"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {/* Specific Weather Icon */}
                      <WeatherIcon iconName={c.weatherIcon} className="w-5 h-5" />
                      
                      {/* Weather label badge so it's clear at a single glance */}
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold truncate max-w-[100px] ${
                        c.rainTypeInfo?.badgeBg || 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.shortLabel || 'Partly Cloudy'}
                      </span>

                      {/* Temp & Feels Like */}
                      <div className="font-black text-white text-xs font-mono">
                        {formatTemp(c.temperature, unit)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Feels {formatTemp(c.apparentTemperature, unit)}
                      </div>

                      {/* Rain Probability & Volume */}
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        c.precipitationProbability >= 60
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-500/30'
                          : c.precipitationProbability >= 30
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}>
                        {c.precipitationProbability}% {c.precipitation > 0 && `(${c.precipitation}mm)`}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Individual Weather Providers Rows */}
            {visibleProviderKeys.map((key) => {
              const provider = WEATHER_PROVIDERS[key];

              return (
                <tr key={key} className="hover:bg-slate-850/50 transition-colors">
                  
                  {/* Provider label cell */}
                  <td className="sticky left-0 z-10 bg-slate-900/95 p-3.5 border-r border-slate-800 backdrop-blur-md">
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

                  {/* Hourly Cells for this provider */}
                  {hours.map((hour) => {
                    const data = hour.providers[key];
                    if (!data || data.temperature === null) {
                      return (
                        <td key={hour.timeIso} className="p-2 text-center text-slate-400 border-r border-slate-800/40">
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
                        className="p-2 text-center cursor-pointer hover:bg-slate-800/60 transition-colors border-r border-slate-800/40"
                      >
                        <div className="flex flex-col items-center gap-1">
                          {/* Specific Weather Icon */}
                          <WeatherIcon iconName={smartInfo.icon} className="w-4 h-4 opacity-90" />
                          
                          {/* Specific Condition text badge */}
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold truncate max-w-[95px] ${
                            smartInfo.rainInfo?.badgeBg || 'bg-slate-800/60 text-slate-300'
                          }`}>
                            {smartInfo.shortLabel}
                          </span>

                          {/* Temp & Feels Like */}
                          <div className="font-bold text-slate-200 text-xs font-mono">
                            {formatTemp(data.temperature, unit)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Feels {formatTemp(data.apparentTemperature, unit)}
                          </div>

                          {/* Rain Probability Badge */}
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

            {/* Ground Truth Actual Observed row (for past or current hours) */}
            {hours.some((h) => h.isPast && h.actual?.temperature !== null) && (
              <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/30">
                <td className="sticky left-0 z-10 bg-slate-900/95 p-3.5 border-r border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-emerald-300 text-xs">
                        Ground Truth (Actuals)
                      </div>
                      <div className="text-[10px] text-slate-400">Observed weather readings</div>
                    </div>
                  </div>
                </td>

                {hours.map((hour) => {
                  const act = hour.actual;
                  if (!hour.isPast || act?.temperature === null) {
                    return (
                      <td key={hour.timeIso} className="p-2 text-center text-slate-400 text-[10px] border-r border-slate-800/40">
                        Future
                      </td>
                    );
                  }

                  const smartActual = resolveSmartWeatherInfo(act.weatherCode, act.precipitation > 0 ? 95 : 0, act.precipitation);

                  return (
                    <td
                      key={hour.timeIso}
                      onClick={() => onSelectHour(hour)}
                      className="p-2 text-center cursor-pointer hover:bg-emerald-500/15 transition-colors border-r border-slate-800/40"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <WeatherIcon iconName={smartActual.icon} className="w-4 h-4" />
                        
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-[95px]">
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
            )}

          </tbody>
        </table>
      </div>

      {/* Footer Info & Legend */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
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
            <span>Misting Drizzle / "Soft Day"</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-800" />
            <span>Dry &amp; Settled</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          💡 Click any hour column to view the deep Model Showdown &amp; Rain Breakdown
        </div>
      </div>

    </div>
  );
}
