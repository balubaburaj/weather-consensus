import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp, formatWind, formatPrecip } from '../utils/units';
import { WEATHER_PROVIDERS } from '../constants/providers';

export default function CurrentOverview({
  weatherData,
  selectedCity,
  dailySummary,
  accuracyReport,
  unit,
  onOpenExplainer,
}) {
  if (!weatherData) return null;

  const { current } = weatherData;
  const topPerformer = accuracyReport?.topPerformer;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
      
      {/* Current Conditions Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-400 font-bold mb-1">
              Live Ground Observation
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {selectedCity?.name || 'Selected Location'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedCity?.country} • {weatherData.timezone}
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-inner">
            <WeatherIcon code={current.weatherCode} className="w-10 h-10" />
          </div>
        </div>

        <div className="mt-6 flex items-baseline gap-4">
          <div className="text-5xl font-extrabold text-white tracking-tighter">
            {formatTemp(current.temperature, unit)}
          </div>
          <div className="text-xs text-slate-400">
            <div>Feels like <span className="font-semibold text-slate-200">{formatTemp(current.apparentTemperature, unit)}</span></div>
            {dailySummary && (
              <div className="text-slate-400 mt-0.5">
                H: <span className="text-slate-300 font-medium">{formatTemp(dailySummary.maxTemp, unit)}</span> L: <span className="text-slate-300 font-medium">{formatTemp(dailySummary.minTemp, unit)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Observation Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Humidity</div>
              <div className="font-semibold">{current.relativeHumidity || '--'}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Wind className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Wind</div>
              <div className="font-semibold">{formatWind(current.windSpeed, unit)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Precip Rate</div>
              <div className="font-semibold">{formatPrecip(current.precipitation, unit)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TrueCast Smart Consensus Card (Our Aggregated Weather Model!) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-blue-950/40 border border-cyan-500/30 p-6 shadow-xl backdrop-blur-md lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                TrueCast Consensus Engine
              </span>
              <span className="text-xs text-slate-400">Blended Multi-Provider Forecast</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Aggregated Ensemble Outlook
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {dailySummary?.description || 'Aggregating predictions from 7 world-class numerical weather models.'}
            </p>
          </div>

          {/* Model Agreement Gauge */}
          {dailySummary && (
            <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm ${
                  dailySummary.avgAgreement >= 80
                    ? 'border-emerald-500/80 text-emerald-400 bg-emerald-500/10'
                    : dailySummary.avgAgreement >= 60
                    ? 'border-amber-500/80 text-amber-400 bg-amber-500/10'
                    : 'border-rose-500/80 text-rose-400 bg-rose-500/10'
                }`}>
                  {dailySummary.avgAgreement}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Model Agreement</div>
                <div className={`text-xs font-semibold ${
                  dailySummary.avgAgreement >= 80 ? 'text-emerald-300' : dailySummary.avgAgreement >= 60 ? 'text-amber-300' : 'text-rose-300'
                }`}>
                  {dailySummary.avgAgreement >= 80 ? 'High Confidence' : dailySummary.avgAgreement >= 60 ? 'Moderate Variance' : 'High Divergence'}
                </div>
                <div className="text-[10px] text-slate-400">7 Models Compared</div>
              </div>
            </div>
          )}
        </div>

        {/* Divergence Warning or Rain Window Banner */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {dailySummary?.divergentCount > 0 ? (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold">Model Divergence Alert:</span> {dailySummary.divergentCount} hours show conflicting forecasts between providers today. Check the comparison chart below.
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold">High Model Consensus:</span> All 7 numerical weather models are closely aligned for this location today.
              </div>
            </div>
          )}

          {/* Top Predictor for this Location */}
          {topPerformer && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 text-xs">
              <Award className="w-4 h-4 shrink-0 text-cyan-400" />
              <div className="truncate">
                <span className="font-semibold text-white">#1 Rated Predictor:</span>{' '}
                <span className="text-cyan-300 font-bold">{topPerformer.provider.name}</span>{' '}
                <span className="text-slate-400 font-mono text-[11px]">({topPerformer.overallScore}% reliability, ±{topPerformer.mae}°C error)</span>
              </div>
            </div>
          )}
        </div>

        {/* Contributing Providers Mini Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Ensemble Members:</span>
            {Object.values(WEATHER_PROVIDERS).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-850/80 border border-slate-700/60 text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.shortName}
              </span>
            ))}
          </div>

          <button
            onClick={onOpenExplainer}
            className="text-cyan-400 hover:text-cyan-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            How we aggregate data
          </button>
        </div>

      </div>

    </div>
  );
}
