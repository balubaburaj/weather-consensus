import React from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Droplets, Wind, Thermometer, CloudRain } from 'lucide-react';
import { WEATHER_PROVIDERS, PROVIDER_KEYS } from '../constants/providers';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp, formatPrecip, formatWind } from '../utils/units';

export default function HourDetailModal({ hour, unit, onClose }) {
  if (!hour) return null;

  const c = hour.consensus;
  const isPast = hour.isPast;

  // Sorted provider comparison
  const providerEntries = Object.entries(hour.providers || {})
    .filter(([_, data]) => data && data.temperature !== null)
    .sort((a, b) => (b[1].precipitationProbability || 0) - (a[1].precipitationProbability || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <WeatherIcon code={c?.weatherCode} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Hourly Model Showdown
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300">
                  {hour.hourLabel} • {hour.date}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed multi-provider breakdown at this exact hour
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
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-850 to-blue-950/40 border border-cyan-500/30">
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

              <div className="mt-3 flex items-baseline gap-4">
                <div className="text-3xl font-extrabold text-white">
                  {formatTemp(c.temperature, unit)}
                </div>
                <div className="text-xs text-slate-300">
                  <span>Rain Probability: </span>
                  <span className="font-bold text-cyan-300">{c.precipitationProbability}%</span>
                  {c.precipitation > 0 && <span> ({formatPrecip(c.precipitation, unit)})</span>}
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

          {/* Actual Observation if past */}
          {isPast && hour.actual?.temperature !== null && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Actual Recorded Ground Truth:</span>
              </div>
              <div className="font-mono font-bold text-emerald-200">
                {formatTemp(hour.actual.temperature, unit)} • {hour.actual.precipitation > 0 ? `${hour.actual.precipitation}mm` : 'Dry'}
              </div>
            </div>
          )}

          {/* Side-by-Side Model Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Individual Provider Predictions
            </h4>

            <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40 text-xs">
              {providerEntries.map(([key, data]) => {
                const prov = WEATHER_PROVIDERS[key];
                if (!prov) return null;

                const tempDiff = c ? Math.round((data.temperature - c.temperature) * 10) / 10 : null;

                return (
                  <div key={key} className="p-3 flex items-center justify-between hover:bg-slate-850/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prov.color }} />
                      <div>
                        <div className="font-bold text-slate-200">{prov.name}</div>
                        <div className="text-[10px] text-slate-400">{prov.organization}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-right font-mono">
                      {/* Temp & Diff */}
                      <div>
                        <div className="font-bold text-slate-100">{formatTemp(data.temperature, unit)}</div>
                        {tempDiff !== null && (
                          <div className={`text-[10px] ${tempDiff > 0 ? 'text-amber-400' : tempDiff < 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {tempDiff > 0 ? `+${tempDiff}°` : `${tempDiff}°`}
                          </div>
                        )}
                      </div>

                      {/* Rain Probability */}
                      <div className="min-w-[60px]">
                        <div className={`font-bold ${data.precipitationProbability >= 50 ? 'text-blue-400' : 'text-slate-300'}`}>
                          {data.precipitationProbability}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {data.precipitation > 0 ? `${data.precipitation}mm` : 'Dry'}
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
          <span>Comparing 7 major operational meteorology models</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
