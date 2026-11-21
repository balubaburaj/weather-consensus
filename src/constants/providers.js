// Weather providers & NWP model definitions with metadata, colors, and capabilities

export const WEATHER_PROVIDERS = {
  ecmwf_ifs025: {
    id: 'ecmwf_ifs025',
    name: 'ECMWF IFS',
    shortName: 'ECMWF',
    organization: 'European Centre for Medium-Range Weather Forecasts',
    origin: 'Europe / UK 🇪🇺',
    color: '#3b82f6', // Blue
    bgLight: 'rgba(59, 130, 246, 0.15)',
    border: 'border-blue-500',
    description: 'Regarded as the world benchmark global numerical weather prediction model with 0.25° (~25km) resolution.',
    resolution: '~25 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.35,
    tag: 'Global Benchmark',
  },
  gfs_seamless: {
    id: 'gfs_seamless',
    name: 'NOAA GFS',
    shortName: 'GFS',
    organization: 'National Oceanic & Atmospheric Administration',
    origin: 'United States 🇺🇸',
    color: '#10b981', // Emerald
    bgLight: 'rgba(16, 185, 129, 0.15)',
    border: 'border-emerald-500',
    description: 'The primary US National Weather Service operational global forecast system (~13-22km resolution).',
    resolution: '~13 km (seamless)',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.15,
    tag: 'US Standard',
  },
  icon_seamless: {
    id: 'icon_seamless',
    name: 'DWD ICON',
    shortName: 'ICON',
    organization: 'Deutscher Wetterdienst (Germany)',
    origin: 'Germany 🇩🇪',
    color: '#f59e0b', // Amber
    bgLight: 'rgba(245, 158, 11, 0.15)',
    border: 'border-amber-500',
    description: 'German Weather Service model utilizing an icosahedral grid. Highly rated for localized convective rainfall.',
    resolution: '~13 km (7km EU)',
    updateFrequency: 'Every 3-6 hours',
    baseWeight: 1.25,
    tag: 'Precision Convection',
  },
  meteofrance_seamless: {
    id: 'meteofrance_seamless',
    name: 'Météo-France ARPEGE',
    shortName: 'Météo-FR',
    organization: 'Météo-France',
    origin: 'France 🇫🇷',
    color: '#8b5cf6', // Violet
    bgLight: 'rgba(139, 92, 246, 0.15)',
    border: 'border-violet-500',
    description: 'French meteorological agency operational model, excellent for European fronts and precipitation systems.',
    resolution: '~10-25 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.1,
    tag: 'Atlantic Fronts',
  },
  ukmo_seamless: {
    id: 'ukmo_seamless',
    name: 'UK Met Office',
    shortName: 'UK Met',
    organization: 'Met Office (United Kingdom)',
    origin: 'United Kingdom 🇬🇧',
    color: '#06b6d4', // Cyan
    bgLight: 'rgba(6, 182, 212, 0.15)',
    border: 'border-cyan-500',
    description: 'One of the most accurate global and regional maritime & radar weather prediction services.',
    resolution: '~10-17 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.2,
    tag: 'Maritime Precision',
  },
  gem_seamless: {
    id: 'gem_seamless',
    name: 'GEM / CMC',
    shortName: 'GEM',
    organization: 'Canadian Meteorological Centre',
    origin: 'Canada 🇨🇦',
    color: '#ec4899', // Pink
    bgLight: 'rgba(236, 72, 153, 0.15)',
    border: 'border-pink-500',
    description: 'Global Environmental Multiscale model by Environment Canada, specialized in polar & northern hemispheric dynamics.',
    resolution: '~15 km',
    updateFrequency: 'Every 12 hours',
    baseWeight: 1.05,
    tag: 'Cold Front Specialist',
  },
  jma_seamless: {
    id: 'jma_seamless',
    name: 'JMA GSM',
    shortName: 'JMA',
    organization: 'Japan Meteorological Agency',
    origin: 'Japan 🇯🇵',
    color: '#f97316', // Orange
    bgLight: 'rgba(249, 115, 22, 0.15)',
    border: 'border-orange-500',
    description: 'Global Spectral Model by Japan Meteorological Agency, renowned for Pacific basin and cyclone path accuracy.',
    resolution: '~20 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.05,
    tag: 'Pacific Dynamics',
  },
};

export const PROVIDER_KEYS = Object.keys(WEATHER_PROVIDERS);

// Weather condition codes (WMO code mapping)
export const WMO_WEATHER_CODES = {
  0: { label: 'Clear sky', icon: 'Sun', category: 'clear', isRain: false },
  1: { label: 'Mainly clear', icon: 'SunDim', category: 'clear', isRain: false },
  2: { label: 'Partly cloudy', icon: 'CloudSun', category: 'cloudy', isRain: false },
  3: { label: 'Overcast', icon: 'Cloud', category: 'cloudy', isRain: false },
  45: { label: 'Fog', icon: 'CloudFog', category: 'fog', isRain: false },
  48: { label: 'Depositing rime fog', icon: 'CloudFog', category: 'fog', isRain: false },
  51: { label: 'Light drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true },
  53: { label: 'Moderate drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true },
  55: { label: 'Dense drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true },
  56: { label: 'Light freezing drizzle', icon: 'CloudSnow', category: 'snow', isRain: true },
  57: { label: 'Dense freezing drizzle', icon: 'CloudSnow', category: 'snow', isRain: true },
  61: { label: 'Slight rain', icon: 'CloudRain', category: 'rain', isRain: true },
  62: { label: 'Moderate rain', icon: 'CloudRain', category: 'rain', isRain: true },
  63: { label: 'Heavy rain', icon: 'CloudRain', category: 'rain', isRain: true },
  65: { label: 'Violent rain', icon: 'CloudRain', category: 'rain', isRain: true },
  66: { label: 'Light freezing rain', icon: 'CloudSnow', category: 'snow', isRain: true },
  67: { label: 'Heavy freezing rain', icon: 'CloudSnow', category: 'snow', isRain: true },
  71: { label: 'Slight snow fall', icon: 'Snowflake', category: 'snow', isRain: false },
  73: { label: 'Moderate snow fall', icon: 'Snowflake', category: 'snow', isRain: false },
  75: { label: 'Heavy snow fall', icon: 'Snowflake', category: 'snow', isRain: false },
  77: { label: 'Snow grains', icon: 'Snowflake', category: 'snow', isRain: false },
  80: { label: 'Slight rain showers', icon: 'CloudRain', category: 'rain', isRain: true },
  81: { label: 'Moderate rain showers', icon: 'CloudRain', category: 'rain', isRain: true },
  82: { label: 'Violent rain showers', icon: 'CloudRain', category: 'rain', isRain: true },
  85: { label: 'Slight snow showers', icon: 'Snowflake', category: 'snow', isRain: false },
  86: { label: 'Heavy snow showers', icon: 'Snowflake', category: 'snow', isRain: false },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', category: 'storm', isRain: true },
  96: { label: 'Thunderstorm with slight hail', icon: 'CloudLightning', category: 'storm', isRain: true },
  99: { label: 'Thunderstorm with heavy hail', icon: 'CloudLightning', category: 'storm', isRain: true },
};

export function getWeatherInfo(code) {
  if (code === undefined || code === null) {
    return { label: 'Unknown', icon: 'Cloud', category: 'cloudy', isRain: false };
  }
  return WMO_WEATHER_CODES[code] || { label: 'Partly cloudy', icon: 'CloudSun', category: 'cloudy', isRain: false };
}
