import React, { memo } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Cloud,
  Compass,
  Gauge,
  Eye,
  Sun,
} from 'lucide-react';
import { formatWind, formatPrecip, formatTemp } from '../../utils/units';

function MobileWeatherGrid({
  currentWeather,
  unit = 'C',
}) {
  if (!currentWeather) return null;

  const temp = currentWeather.temperature !== null ? currentWeather.temperature : 10;
  const feels = currentWeather.apparentTemperature !== null && currentWeather.apparentTemperature !== undefined
    ? currentWeather.apparentTemperature
    : temp;

  const metrics = [
    {
      id: 'feels_like',
      label: 'Feels Like',
      value: formatTemp(feels, unit),
      icon: Thermometer,
      color: 'text-amber-400',
    },
    {
      id: 'humidity',
      label: 'Humidity',
      value: `${currentWeather.relativeHumidity || 85}%`,
      icon: Droplets,
      color: 'text-cyan-400',
    },
    {
      id: 'wind',
      label: 'Wind',
      value: formatWind(currentWeather.windSpeed || 18, unit),
      icon: Wind,
      color: 'text-sky-400',
    },
    {
      id: 'precip',
      label: 'Precipitation',
      value: formatPrecip(currentWeather.precipitation || 0, unit),
      icon: CloudRain,
      color: 'text-blue-400',
    },
    {
      id: 'cloud_cover',
      label: 'Cloud Cover',
      value: `${currentWeather.cloudCover || 90}%`,
      icon: Cloud,
      color: 'text-slate-300',
    },
    {
      id: 'dew_point',
      label: 'Dew Point',
      value: formatTemp(currentWeather.dewPoint !== undefined ? currentWeather.dewPoint : temp - 2, unit),
      icon: Compass,
      color: 'text-emerald-400',
    },
    {
      id: 'pressure',
      label: 'Pressure',
      value: `${currentWeather.surfacePressure || 1012} hPa`,
      icon: Gauge,
      color: 'text-indigo-400',
    },
    {
      id: 'visibility',
      label: 'Visibility',
      value: `${currentWeather.visibility || 10} km`,
      icon: Eye,
      color: 'text-emerald-400',
    },
    {
      id: 'uv_index',
      label: 'UV Index',
      value: `${currentWeather.uvIndex || 1} (Low)`,
      icon: Sun,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="rounded-3xl border border-zinc-800/90 bg-[#111113] p-4 sm:p-5 shadow-xl">
      {/* Header */}
      <h3 className="text-sm font-bold text-white tracking-wide mb-3">
        Current Weather
      </h3>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {metrics.map((m) => {
          const IconComponent = m.icon;
          return (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-black/75 border border-zinc-800/80 flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                <IconComponent className={`w-3.5 h-3.5 ${m.color}`} />
                <span className="text-[10px] font-semibold tracking-tight truncate">
                  {m.label}
                </span>
              </div>
              <div className="text-sm font-extrabold text-white font-mono truncate">
                {m.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(MobileWeatherGrid);
