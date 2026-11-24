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
  1: { day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  2: { day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  3: { day: 'cloudy', night: 'cloudy' },
  45: { day: 'dense-fog', night: 'dense-fog' },
  48: { day: 'foggy-cloud', night: 'foggy-cloud' },
  51: { day: 'drizzle', night: 'night-drizzle' },
  53: { day: 'day-drizzle', night: 'night-drizzle' },
  55: { day: 'drizzle', night: 'night-drizzle' },
  56: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  57: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  61: { day: 'light-rain', night: 'night-drizzle' },
  62: { day: 'moderate-rain', night: 'night-moderate-rain' },
  63: { day: 'heavy-rain', night: 'night-heavy-rain' },
  65: { day: 'rain-splashes', night: 'night-rain-splashes' },
  66: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  67: { day: 'mixed-rain-snow', night: 'mixed-rain-snow' },
  71: { day: 'snow-crystals', night: 'night-snow-crystals' },
  73: { day: 'snow-crystals', night: 'night-snow-crystals' },
  75: { day: 'snowflake', night: 'snowflake' },
  77: { day: 'snowflake', night: 'snowflake' },
  80: { day: 'day-rain-showers', night: 'night-rain-showers' },
  81: { day: 'moderate-rain', night: 'night-moderate-rain' },
  82: { day: 'day-heavy-rain-rays', night: 'night-heavy-rain' },
  85: { day: 'day-snow-crystals', night: 'night-snow-crystals' },
  86: { day: 'snowflake', night: 'snowflake' },
  95: { day: 'day-thunder-rain', night: 'night-thunder-rain' },
  96: { day: 'hailstones', night: 'night-hailstones' },
  99: { day: 'severe-thunderstorm', night: 'night-severe-thunderstorm' },
};

// Legacy Lucide and semantic names to icon-pack SVG file names
export const SEMANTIC_SVG_MAPPING = {
  // Lucide icon names
  Sun: 'sun',
  SunDim: 'partly-cloudy-day',
  CloudSun: 'partly-cloudy-day',
  CloudSunRain: 'day-rain-showers',
  Cloud: 'cloudy',
  CloudFog: 'dense-fog',
  CloudDrizzle: 'drizzle',
  CloudRain: 'moderate-rain',
  CloudRainWind: 'heavy-rain',
  CloudLightning: 'thunder-rain',
  CloudHail: 'hailstones',
  CloudSnow: 'mixed-rain-snow',
  Snowflake: 'snowflake',
  Wind: 'wind',

  // Human rain classification types
  dry: 'sun',
  drizzle: 'drizzle',
  light_rain: 'light-rain',
  moderate_rain: 'moderate-rain',
  heavy_rain: 'heavy-rain',
  torrential: 'rain-splashes',
  thunderstorm: 'thunder-rain',
  hail: 'hailstones',
  snow: 'snow-crystals',
  heavy_snow: 'snowflake',
};

/**
 * Resolves an SVG asset URL from code, semantic name, or exact filename
 */
export function getWeatherIconUrl(identifier, isNight = false) {
  if (identifier === undefined || identifier === null) {
    return WEATHER_ICON_MAP['sun'] || '';
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

  // 2. Direct exact filename match
  if (WEATHER_ICON_MAP[identifier]) {
    return WEATHER_ICON_MAP[identifier];
  }

  // 3. Semantic / Lucide mapping
  const mappedKey = SEMANTIC_SVG_MAPPING[identifier];
  if (mappedKey && WEATHER_ICON_MAP[mappedKey]) {
    return WEATHER_ICON_MAP[mappedKey];
  }

  // 4. Try kebab-case or lowercase fallback
  const lower = String(identifier).toLowerCase().replace(/\s+/g, '-');
  if (WEATHER_ICON_MAP[lower]) {
    return WEATHER_ICON_MAP[lower];
  }

  // Fallback to sun or cloudy
  return WEATHER_ICON_MAP['sun'] || Object.values(WEATHER_ICON_MAP)[0] || '';
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
      className={`object-contain inline-block shrink-0 drop-shadow-sm select-none ${className}`}
      loading="lazy"
      draggable={false}
      {...props}
    />
  );
}

export default WeatherIcon;
