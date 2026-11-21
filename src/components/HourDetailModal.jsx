import React from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Droplets, Wind, Thermometer, CloudRain } from 'lucide-react';
import { WEATHER_PROVIDERS, PROVIDER_KEYS, resolveSmartWeatherInfo } from '../constants/providers';
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

  // Sorted provider comparison by rain probability descending
  const providerEntries = Object.entries(hour.providers || {})
    .filter(([_, data]) => data && data.temperature !== null)
    .sort((a, b) => (b[1].precipitationProbability || 0) - (a[1].precipitationProbability || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <WeatherIcon iconName={c?.weatherIcon} className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Hourly Model Showdown
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {timeFormatted} ({hour.hourLabel})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {dateFormatted} • Side-by-side verification of all 8 models
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
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* TrueCast Consensus Spotlight */}
          {c && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-850 to-blue-950/50 border border-cyan-500/40 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    TrueCast Aggregated Verdict
                  </span>
                </div>
                <div className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  c.agreementScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {c.agreementScore}% Model Agreement
                </div>
              </div>

              {/* Explicit Condition Banner */}
              <div className="mt-3 flex items-center gap-2 text-white font-bold text-base">
                <span>{c.weatherEmoji || '🌤️'}</span>
                <span>{c.weatherLabel || 'Partly Cloudy'}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/60">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Predicted Temperature</div>
                  <div className="text-3xl font-black text-white font-mono mt-0.5">
                    {formatTemp(c.temperature, unit)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Model Spread: {c.minTemp}° to {c.maxTemp}° (±{(c.tempSpread / 2).toFixed(1)}°)
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Precipitation & Rain Chance</div>
                  <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">
                    {c.precipitationProbability}% Chance
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Volume: <span className="font-bold text-white">{formatPrecip(c.precipitation, unit)}</span>
                  </div>
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
                  <div className="text-[11px] text-emerald-400/80 font-normal">What really happened at {hour.hourLabel}</div>
                </div>
              </div>
              <div className="font-mono text-right">
                <div className="text-base font-black text-emerald-200">
                  {formatTemp(hour.actual.temperature, unit)}
                </div>
                <div className="text-[11px] text-emerald-300 font-semibold">
                  {hour.actual.precipitation > 0 ? `🌧️ ${hour.actual.precipitation} mm rain recorded` : 'Dry (0 mm)'}
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Model Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Individual Model Predictions for this Hour:
              </h4>
              <span className="text-[10px] text-slate-400">Sorted by Rain Probability</span>
            </div>

            <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50 text-xs">
              {providerEntries.map(([key, data]) => {
                const prov = WEATHER_PROVIDERS[key];
                if (!prov) return null;

                const smartInfo = resolveSmartWeatherInfo(data.weatherCode, data.precipitationProbability, data.precipitation);
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
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{smartInfo.emoji}</span>
                          <span>{smartInfo.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right font-mono">
                      {/* Temp & Diff */}
                      <div>
                        <div className="font-bold text-white text-xs">{formatTemp(data.temperature, unit)}</div>
                        {tempDiff !== null && (
                          <div className={`text-[10px] font-semibold ${tempDiff > 0 ? 'text-amber-400' : tempDiff < 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {tempDiff > 0 ? `+${tempDiff}°` : tempDiff < 0 ? `${tempDiff}°` : '±0.0°'}
                          </div>
                        )}
                      </div>

                      {/* Rain Probability & Volume */}
                      <div className="min-w-[70px]">
                        <div className={`font-black text-xs ${data.precipitationProbability >= 50 ? 'text-blue-400' : 'text-slate-300'}`}>
                          {data.precipitationProbability}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {data.precipitation > 0 ? `${data.precipitation} mm` : '0 mm'}
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
          <span>Benchmarking 8 national NWP models</span>
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
