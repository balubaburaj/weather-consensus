import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { WEATHER_PROVIDERS, PROVIDER_KEYS } from '../constants/providers';
import { formatRawTemp, formatTemp, formatPrecip, formatWind } from '../utils/units';
import { Sparkles, SlidersHorizontal, CheckSquare, Square, Thermometer, CloudRain, Droplets, Wind } from 'lucide-react';

export default function HourlyChart({
  hours,
  unit,
  activeProviders,
  onToggleProvider,
  onSelectAllProviders,
  onResetProviders,
}) {
  const [metric, setMetric] = useState('temperature'); // 'temperature' | 'precipitationProbability' | 'precipitation' | 'windSpeed'

  if (!hours || hours.length === 0) return null;

  // Transform hourly items for recharts
  const chartData = hours.map((hour) => {
    const row = {
      hourLabel: hour.hourLabel,
      timeIso: hour.timeIso,
      isPast: hour.isPast,
      isCurrent: hour.isCurrent,
    };

    // Consensus value
    if (hour.consensus) {
      if (metric === 'temperature') {
        row.consensus = formatRawTemp(hour.consensus.temperature, unit);
        row.minTemp = formatRawTemp(hour.consensus.minTemp, unit);
        row.maxTemp = formatRawTemp(hour.consensus.maxTemp, unit);
      } else if (metric === 'precipitationProbability') {
        row.consensus = hour.consensus.precipitationProbability;
      } else if (metric === 'precipitation') {
        row.consensus = hour.consensus.precipitation;
      } else if (metric === 'windSpeed') {
        row.consensus = hour.consensus.windSpeed || 0;
      }
    }

    // Provider values
    for (const key of PROVIDER_KEYS) {
      const pData = hour.providers[key];
      if (pData) {
        if (metric === 'temperature') {
          row[key] = formatRawTemp(pData.temperature, unit);
        } else if (metric === 'precipitationProbability') {
          row[key] = pData.precipitationProbability;
        } else if (metric === 'precipitation') {
          row[key] = pData.precipitation;
        } else if (metric === 'windSpeed') {
          row[key] = pData.windSpeed;
        }
      }
    }

    return row;
  });

  const getMetricLabel = () => {
    switch (metric) {
      case 'temperature': return `Temperature (${unit === 'C' ? '°C' : '°F'})`;
      case 'precipitationProbability': return 'Rain Probability (%)';
      case 'precipitation': return `Precipitation (${unit === 'C' ? 'mm' : 'in'})`;
      case 'windSpeed': return `Wind Speed (${unit === 'C' ? 'km/h' : 'mph'})`;
      default: return '';
    }
  };

  const getMetricYAxisDomain = () => {
    if (metric === 'precipitationProbability') return [0, 100];
    if (metric === 'precipitation') return [0, 'dataMax + 1'];
    return ['auto', 'auto'];
  };

  // Custom rich tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const hourItem = hours.find((h) => h.hourLabel === label);
    const consensus = hourItem?.consensus;

    return (
      <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[220px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <span className="font-mono text-cyan-400">{label}</span>
            <span>Forecast</span>
          </div>
          {consensus && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
              consensus.isDivergent ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {consensus.isDivergent ? '⚠️ Divergent' : `${consensus.agreementScore}% Agreement`}
            </span>
          )}
        </div>

        {/* Consensus Highlight */}
        {consensus && (
          <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TrueCast Consensus</span>
            </div>
            <span className="font-bold text-white font-mono">
              {metric === 'temperature' && formatTemp(consensus.temperature, unit)}
              {metric === 'precipitationProbability' && `${consensus.precipitationProbability}%`}
              {metric === 'precipitation' && formatPrecip(consensus.precipitation, unit)}
              {metric === 'windSpeed' && formatWind(consensus.windSpeed, unit)}
            </span>
          </div>
        )}

        {/* Individual Providers */}
        <div className="space-y-1">
          {payload
            .filter((p) => p.dataKey !== 'consensus' && p.dataKey !== 'minTemp' && p.dataKey !== 'maxTemp')
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .map((entry) => {
              const prov = WEATHER_PROVIDERS[entry.dataKey];
              if (!prov) return null;

              return (
                <div key={entry.dataKey} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: prov.color }} />
                    <span className="text-slate-300">{prov.shortName}</span>
                  </div>
                  <span className="font-mono font-medium text-slate-100">
                    {metric === 'temperature' && `${entry.value}°`}
                    {metric === 'precipitationProbability' && `${entry.value}%`}
                    {metric === 'precipitation' && `${entry.value} mm`}
                    {metric === 'windSpeed' && `${entry.value} km/h`}
                  </span>
                </div>
              );
            })}
        </div>

        {consensus?.divergenceReason && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-amber-300 leading-tight">
            ⚠️ {consensus.divergenceReason}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-5 backdrop-blur-sm mb-8">
      
      {/* Metric Selector Tabs & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Synchronized Multi-Model Chart</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">
              {getMetricLabel()}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hover to cross-examine all provider curves at any exact hour. Toggle models below.
          </p>
        </div>

        {/* Metric buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMetric('temperature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'temperature'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setMetric('precipitationProbability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'precipitationProbability'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rain Chance %</span>
          </button>

          <button
            onClick={() => setMetric('precipitation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'precipitation'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Precip Volume</span>
          </button>

          <button
            onClick={() => setMetric('windSpeed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'windSpeed'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </button>
        </div>
      </div>

      {/* Model Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" />
          Filter:
        </span>

        {/* Quick presets */}
        <button
          onClick={onSelectAllProviders}
          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          All
        </button>
        <button
          onClick={onResetProviders}
          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors mr-2"
        >
          Reset
        </button>

        {/* Model Toggles */}
        {PROVIDER_KEYS.map((key) => {
          const prov = WEATHER_PROVIDERS[key];
          const isEnabled = activeProviders[key] !== false;

          return (
            <button
              key={key}
              onClick={() => onToggleProvider(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                isEnabled
                  ? 'bg-slate-800/90 text-slate-200 border-slate-700 shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 border-slate-850 opacity-50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full transition-opacity"
                style={{ backgroundColor: isEnabled ? prov.color : '#475569' }}
              />
              <span>{prov.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* The Recharts Line Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="hourLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={getMetricYAxisDomain()}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Individual Provider Curves */}
            {PROVIDER_KEYS.map((key) => {
              if (activeProviders[key] === false) return null;
              const prov = WEATHER_PROVIDERS[key];

              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={prov.shortName}
                  stroke={prov.color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: prov.color, strokeWidth: 2, fill: '#0f172a' }}
                  opacity={0.85}
                />
              );
            })}

            {/* TrueCast Consensus (Bold Highlight Line) */}
            <Line
              type="monotone"
              dataKey="consensus"
              name="TrueCast Consensus"
              stroke="#ffffff"
              strokeWidth={3}
              dot={{ r: 2, fill: '#38bdf8' }}
              activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 3, fill: '#ffffff' }}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend explanation */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-white rounded-full shadow" />
            <span className="font-semibold text-slate-200">White Solid: TrueCast AI Consensus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-500 rounded-full" />
            <span>Colored Curves: Individual Provider Forecasts</span>
          </div>
        </div>
        <div>
          Data synchronized across 7 meteorological NWP pipelines
        </div>
      </div>

    </div>
  );
}
