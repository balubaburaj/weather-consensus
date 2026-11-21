import React from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Droplets, Wind, Thermometer, CloudRain, Umbrella, Car, Compass } from 'lucide-react';
import { WEATHER_PROVIDERS, PROVIDER_KEYS, resolveSmartWeatherInfo, getRainHumanType } from '../constants/providers';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp, formatPrecip, formatWind } from '../utils/units';

export default function HourDetailModal({ hour, unit, onClose }) {
  if (!hour) return null;

  const c = hour.consensus;
  const isPast = hour.isPast;

  // Format human-friendly time and date (e.g. 10:00 PM • Saturday, Nov 21)
  const d = new Date(hour.date + 'T' + hour.hourLabel + ':00');
  const timeFormatted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateFormatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Rain classification for this hour
  const rainInfo = c?.rainTypeInfo || getRainHumanType(c?.precipitation || 0, c?.precipitationProbability || 0, c?.weatherCode || 0);

  // Sorted provider comparison by rain probability descending
  const providerEntries = Object.entries(hour.providers || {})
    .filter(([_, data]) => data && data.temperature !== null)
    .sort((a, b) => (b[1].precipitationProbability || 0) - (a[1].precipitationProbability || 0));

  // Rain scale stages
  const rainStages = [
    { label: 'Dry', range: '0 mm' },
    { label: 'Misting ("Soft Day")', range: '< 0.25 mm' },
    { label: 'Light Rain', range: '0.25 - 0.7 mm' },
    { label: 'Moderate Showers', range: '0.8 - 2.4 mm' },
    { label: 'Lashing Downpours', range: '2.5 - 6.0 mm' },
    { label: 'Deluge / Storm', range: '> 6.0 mm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <WeatherIcon iconName={c?.weatherIcon} className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">
                  Hourly Forecast &amp; Rain Breakdown
                </h3>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {timeFormatted} ({hour.hourLabel})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {dateFormatted} • Cross-examining 8 numerical weather models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-xs">
          
          {/* Spotlight Hero Box */}
          {c && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-850 to-blue-950/50 border border-cyan-500/40 shadow-lg">
              
              {/* Top Banner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{rainInfo.emoji}</span>
                  <span className="text-base font-black text-white">
                    {rainInfo.label}
                  </span>
                </div>
                <div className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  c.agreementScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {c.agreementScore}% Model Agreement
                </div>
              </div>

              {/* Plain English Explanation */}
              <p className="text-slate-300 mt-2 text-xs leading-relaxed">
                {rainInfo.description}
              </p>

              {/* Temp / Feels Like / Rain stats */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-700/60">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Temperature</div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {formatTemp(c.temperature, unit)}
                  </div>
                  <div className="text-[10px] text-slate-400">Spread: {c.minTemp}° to {c.maxTemp}°</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Feels Like (Wind Chill)</div>
                  <div className="text-2xl font-black text-sky-300 font-mono mt-0.5">
                    {formatTemp(c.apparentTemperature, unit)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.round(c.temperature - c.apparentTemperature) > 0
                      ? `${Math.round(c.temperature - c.apparentTemperature)}° cooler in wind`
                      : 'Mild wind'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Rain Probability &amp; Volume</div>
                  <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">
                    {c.precipitationProbability}%
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium">
                    Expected: <span className="font-bold text-white">{formatPrecip(c.precipitation, unit)}</span>
                  </div>
                </div>
              </div>

              {/* Visual 6-Stage Rain Intensity Scale */}
              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Rain Intensity Scale:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-center">
                  {rainStages.map((stg, sIdx) => {
                    const isActive = rainInfo.scaleIndex === sIdx;
                    return (
                      <div
                        key={stg.label}
                        className={`p-2 rounded-xl border text-[10px] transition-all ${
                          isActive
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-black shadow-md ring-1 ring-cyan-400/50 scale-[1.03]'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="truncate font-semibold">{stg.label}</div>
                        <div className="text-[9px] opacity-70 mt-0.5">{stg.range}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What You Need / Practical Advice */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <Umbrella className="w-4 h-4 text-cyan-400" />
                  <span>
                    <strong>Umbrella:</strong> {rainInfo.umbrellaNeeded ? 'Needed' : 'Not required'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-sky-400" />
                  <span>
                    <strong>Roads:</strong> {c.precipitation >= 1.0 ? 'Wet with spray & puddles' : c.precipitation > 0 ? 'Damp surfaces' : 'Dry pavement'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong>Clothing:</strong> {c.apparentTemperature < 10 ? 'Warm waterproof coat' : 'Light jacket'}
                  </span>
                </div>
              </div>

              {c.divergenceReason && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{c.divergenceReason}</span>
                </div>
              )}
            </div>
          )}

          {/* Actual Observation if past or current */}
          {hour.actual?.temperature !== null && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-300 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div>Recorded Ground Truth (Actual Observation)</div>
                  <div className="text-[11px] text-emerald-400/80 font-normal">What actually occurred at {hour.hourLabel}</div>
                </div>
              </div>
              <div className="font-mono text-right">
                <div className="text-base font-black text-emerald-200">
                  {formatTemp(hour.actual.temperature, unit)} (Feels {formatTemp(hour.actual.apparentTemperature, unit)})
                </div>
                <div className="text-[11px] text-emerald-300 font-semibold">
                  {hour.actual.precipitation > 0 ? `🌧️ ${hour.actual.precipitation} mm recorded` : 'Dry (0 mm)'}
                </div>
              </div>
            </div>
          )}

          {/* Model by Model Showdown Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Individual Model Predictions for this Hour:
              </h4>
              <span className="text-[10px] text-slate-400">Sorted by Rain Probability</span>
            </div>

            <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 text-xs">
              {providerEntries.map(([key, data]) => {
                const prov = WEATHER_PROVIDERS[key];
                if (!prov) return null;

                const smartInfo = resolveSmartWeatherInfo(data.weatherCode, data.precipitationProbability, data.precipitation);
                const modelRain = getRainHumanType(data.precipitation, data.precipitationProbability, data.weatherCode);
                const tempDiff = c ? Math.round((data.temperature - c.temperature) * 10) / 10 : null;

                return (
                  <div key={key} className="p-3.5 flex items-center justify-between hover:bg-slate-850/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow" style={{ backgroundColor: prov.color }} />
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{prov.name}</span>
                          <span className="text-[10px] font-normal text-slate-400">({prov.origin})</span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <WeatherIcon iconName={smartInfo.icon} className="w-3.5 h-3.5 inline" />
                          <span className="font-semibold">{smartInfo.shortLabel}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400">{modelRain.shortLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right font-mono">
                      {/* Temp & Feels */}
                      <div>
                        <div className="font-bold text-white text-xs">{formatTemp(data.temperature, unit)}</div>
                        <div className="text-[10px] text-slate-400">Feels {formatTemp(data.apparentTemperature, unit)}</div>
                        {tempDiff !== null && (
                          <div className={`text-[9px] font-semibold ${tempDiff > 0 ? 'text-amber-400' : tempDiff < 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {tempDiff > 0 ? `+${tempDiff}°` : tempDiff < 0 ? `${tempDiff}°` : '±0.0°'}
                          </div>
                        )}
                      </div>

                      {/* Rain Probability & Volume */}
                      <div className="min-w-[75px]">
                        <div className={`font-black text-xs ${data.precipitationProbability >= 50 ? 'text-blue-400' : 'text-slate-300'}`}>
                          {data.precipitationProbability}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {data.precipitation > 0 ? `${data.precipitation} mm` : '0 mm'}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {modelRain.intensity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Comparing 8 operational NWP models side-by-side</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close Showdown
          </button>
        </div>

      </div>
    </div>
  );
}
