import React from 'react';
import { getWeatherInfo } from '../constants/providers';

// Vite eager glob imports all SVGs as asset URLs
const iconModules = import.meta.glob('../assets/weather-icons/*.svg', {
  eager: true,
  import: 'default',
});

// Build clean name -> URL map
export const WEATHER_ICON_MAP = {};
for (const path in iconModules) {
  const match = path.match(/\/([^/]+)\.svg$/);
  if (match) {
    WEATHER_ICON_MAP[match[1]] = iconModules[path];
  }
}

// WMO code to SVG icon mapping (with night support)
export const WMO_SVG_MAPPING = {
  0: { day: 'sun', night: 'crescent-moon' },
  1: { day: 'partly-cloudy-day-rays', night: 'partly-cloudy-night' },
  2: { day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  3: { day: 'mostly-cloudy', night: 'cloudy' },
  45: { day: 'fog', night: 'fog' },
  48: { day: 'dense-fog', night: 'dense-fog' },
  51: { day: 'day-drizzle', night: 'night-drizzle' },
  53: { day: 'drizzle', night: 'night-drizzle' },
  55: { day: 'light-rain', night: 'night-drizzle' },
  56: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  57: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  61: { day: 'light-rain', night: 'night-rain-showers' },
  62: { day: 'day-moderate-rain', night: 'night-moderate-rain' },
  63: { day: 'day-heavy-rain', night: 'night-heavy-rain' },
  65: { day: 'day-rain-splashes', night: 'night-rain-splashes' },
  66: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  67: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  71: { day: 'day-snow-crystals', night: 'night-snow-crystals' },
  73: { day: 'snow-crystals', night: 'night-snow-crystals' },
  75: { day: 'snowflake', night: 'snowflake' },
  77: { day: 'snow-crystals', night: 'night-snow-crystals' },
  80: { day: 'day-rain-showers', night: 'night-rain-showers' },
  81: { day: 'day-moderate-rain', night: 'night-moderate-rain' },
  82: { day: 'day-rain-splashes', night: 'night-rain-splashes' },
  85: { day: 'day-snow-crystals', night: 'night-snow-crystals' },
  86: { day: 'snowflake', night: 'snowflake' },
  95: { day: 'day-thunder-rain', night: 'night-thunder-rain' },
  96: { day: 'day-hailstones', night: 'night-hailstones' },
  99: { day: 'day-severe-thunderstorm', night: 'night-severe-thunderstorm' },
};

// Legacy Lucide and granular semantic intensity names -> icon-pack SVG file names (with day/night support)
export const SEMANTIC_SVG_MAPPING = {
  // Granular sky & fog states
  clear: { day: 'sun', night: 'crescent-moon' },
  mainly_clear: { day: 'partly-cloudy-day-rays', night: 'partly-cloudy-night' },
  partly_cloudy: { day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  overcast: { day: 'mostly-cloudy', night: 'cloudy' },
  fog: { day: 'fog', night: 'fog' },
  dense_fog: { day: 'dense-fog', night: 'dense-fog' },

  // Lucide icon names
  Sun: { day: 'sun', night: 'crescent-moon' },
  SunDim: { day: 'partly-cloudy-day-rays', night: 'partly-cloudy-night' },
  CloudSun: { day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  CloudSunRain: { day: 'day-rain-showers', night: 'night-rain-showers' },
  Cloud: { day: 'mostly-cloudy', night: 'cloudy' },
  CloudFog: { day: 'dense-fog', night: 'dense-fog' },
  CloudDrizzle: { day: 'day-drizzle', night: 'night-drizzle' },
  CloudRain: { day: 'day-moderate-rain', night: 'night-moderate-rain' },
  CloudRainWind: { day: 'day-heavy-rain', night: 'night-heavy-rain' },
  CloudLightning: { day: 'day-thunder-rain', night: 'night-thunder-rain' },
  CloudHail: { day: 'day-hailstones', night: 'night-hailstones' },
  CloudSnow: { day: 'day-snow-crystals', night: 'night-snow-crystals' },
  Snowflake: { day: 'snowflake', night: 'snowflake' },
  Wind: { day: 'wind', night: 'wind' },

  // Granular human rain, storm & snow intensity levels
  dry: { day: 'sun', night: 'crescent-moon' },
  drizzle: { day: 'day-drizzle', night: 'night-drizzle' },
  light_rain: { day: 'light-rain', night: 'night-rain-showers' },
  rain_showers: { day: 'day-rain-showers', night: 'night-rain-showers' },
  moderate_rain: { day: 'day-moderate-rain', night: 'night-moderate-rain' },
  heavy_rain: { day: 'day-heavy-rain', night: 'night-heavy-rain' },
  torrential: { day: 'day-rain-splashes', night: 'night-rain-splashes' },
  thunderstorm: { day: 'day-thunder-rain', night: 'night-thunder-rain' },
  severe_thunderstorm: { day: 'day-severe-thunderstorm', night: 'night-severe-thunderstorm' },
  hail: { day: 'day-hailstones', night: 'night-hailstones' },
  snow: { day: 'day-snow-crystals', night: 'night-snow-crystals' },
  heavy_snow: { day: 'snowflake', night: 'snowflake' },
};

/**
 * Resolves an SVG asset URL from code, semantic name, or exact filename
 */
export function getWeatherIconUrl(identifier, isNight = false) {
  if (identifier === undefined || identifier === null) {
    return WEATHER_ICON_MAP[isNight ? 'crescent-moon' : 'sun'] || '';
  }

  // 1. Numeric WMO Code
  if (typeof identifier === 'number' || (!isNaN(identifier) && typeof identifier === 'string' && identifier.trim() !== '')) {
    const numCode = Number(identifier);
    const mapping = WMO_SVG_MAPPING[numCode];
    if (mapping) {
      const iconKey = isNight ? mapping.night : mapping.day;
      if (WEATHER_ICON_MAP[iconKey]) return WEATHER_ICON_MAP[iconKey];
    }
  }

  // 2. Semantic / Lucide mapping (checked before raw filenames so day/night swaps work)
  const mappedEntry = SEMANTIC_SVG_MAPPING[identifier];
  if (mappedEntry) {
    const iconKey = typeof mappedEntry === 'string'
      ? mappedEntry
      : (isNight ? mappedEntry.night : mappedEntry.day);
    if (WEATHER_ICON_MAP[iconKey]) return WEATHER_ICON_MAP[iconKey];
  }

  // 3. Direct exact filename match
  if (WEATHER_ICON_MAP[identifier]) {
    return WEATHER_ICON_MAP[identifier];
  }

  // 4. Try kebab-case or lowercase fallback
  const lower = String(identifier).toLowerCase().replace(/\s+/g, '-');
  if (WEATHER_ICON_MAP[lower]) {
    return WEATHER_ICON_MAP[lower];
  }

  // Fallback to sun or moon
  return WEATHER_ICON_MAP[isNight ? 'crescent-moon' : 'sun'] || Object.values(WEATHER_ICON_MAP)[0] || '';
}

/**
 * Core WeatherIcon component rendering rich vector SVG from icon pack
 */
export function WeatherIcon({
  code,
  iconName,
  isNight = false,
  className = 'w-8 h-8',
  alt,
  ...props
}) {
  let targetIdentifier = iconName;
  if (!targetIdentifier && code !== undefined && code !== null) {
    targetIdentifier = code;
  }
  if (!targetIdentifier) {
    targetIdentifier = 'sun';
  }

  const iconUrl = getWeatherIconUrl(targetIdentifier, isNight);
  const accessibleAlt = alt || (code !== undefined ? getWeatherInfo(code)?.label : String(targetIdentifier));

  return (
    <img
      src={iconUrl}
      alt={accessibleAlt}
      className={`object-contain inline-block shrink-0 drop-shadow-sm select-none scale-[1.14] ${className}`}
      loading="lazy"
      draggable={false}
      {...props}
    />
  );
}

export default WeatherIcon;
