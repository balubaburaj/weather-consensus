// Weather providers & NWP model definitions with metadata, colors, and capabilities

export const WEATHER_PROVIDERS = {
  ukmo_seamless: {
    id: 'ukmo_seamless',
    name: 'UK Met Office',
    shortName: 'UK Met',
    organization: 'Met Office (United Kingdom & Ireland Marine)',
    origin: 'United Kingdom & Ireland 🇬🇧 🇮🇪',
    color: '#06b6d4', // Cyan
    bgLight: 'rgba(6, 182, 212, 0.15)',
    border: 'border-cyan-500',
    description: 'Premier maritime and radar weather model for the British Isles, Irish Sea, and North Atlantic fronts (~10-17km resolution).',
    resolution: '~10 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.4,
    tag: 'Ireland & UK Specialist',
  },
  metno_seamless: {
    id: 'metno_seamless',
    name: 'MET Norway (Yr.no)',
    shortName: 'MET Norway (Yr)',
    organization: 'Norwegian Meteorological Institute',
    origin: 'Norway & Scandinavia 🇳🇴',
    color: '#38bdf8', // Sky Blue
    bgLight: 'rgba(56, 189, 248, 0.15)',
    border: 'border-sky-400',
    description: 'Powers the beloved Yr.no service. Renowned in Ireland for accurate North Atlantic precipitation and cloud cover modeling.',
    resolution: '~2.5-10 km',
    updateFrequency: 'Every 3-6 hours',
    baseWeight: 1.35,
    tag: 'Yr.no Atlantic Precision',
  },
  ecmwf_ifs025: {
    id: 'ecmwf_ifs025',
    name: 'ECMWF IFS',
    shortName: 'ECMWF',
    organization: 'European Centre for Medium-Range Weather Forecasts',
    origin: 'Europe 🇪🇺',
    color: '#3b82f6', // Blue
    bgLight: 'rgba(59, 130, 246, 0.15)',
    border: 'border-blue-500',
    description: 'The global benchmark numerical weather prediction model used as the foundation by Met Éireann and leading national agencies.',
    resolution: '~25 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.35,
    tag: 'Global Benchmark',
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
    description: 'German Weather Service model utilizing an icosahedral grid (~7-13km EU resolution). High accuracy for localized convective rainfall.',
    resolution: '~7-13 km',
    updateFrequency: 'Every 3-6 hours',
    baseWeight: 1.25,
    tag: 'Convective Rain',
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
    description: 'French meteorological agency operational model, exceptional for European and Celtic Sea Atlantic depressions.',
    resolution: '~10-25 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.15,
    tag: 'Atlantic Depressions',
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
    description: 'Primary US operational global forecast system (~13-22km). Powers many commercial smartphone weather apps.',
    resolution: '~13 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.1,
    tag: 'US Standard',
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
    description: 'Global Environmental Multiscale model by Environment Canada, specialized in North Atlantic cold front physics.',
    resolution: '~15 km',
    updateFrequency: 'Every 12 hours',
    baseWeight: 1.05,
    tag: 'Cold Fronts',
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
    description: 'Global Spectral Model by Japan Meteorological Agency, providing global independent verification.',
    resolution: '~20 km',
    updateFrequency: 'Every 6 hours',
    baseWeight: 1.0,
    tag: 'Global Spectrum',
  },
};

export const PROVIDER_KEYS = Object.keys(WEATHER_PROVIDERS);

// Weather condition codes (WMO code mapping)
export const WMO_WEATHER_CODES = {
  0: { label: 'Clear sky', icon: 'Sun', category: 'clear', isRain: false, emoji: '☀️' },
  1: { label: 'Mainly clear', icon: 'SunDim', category: 'clear', isRain: false, emoji: '🌤️' },
  2: { label: 'Partly cloudy', icon: 'CloudSun', category: 'cloudy', isRain: false, emoji: '⛅' },
  3: { label: 'Overcast', icon: 'Cloud', category: 'cloudy', isRain: false, emoji: '☁️' },
  45: { label: 'Fog', icon: 'CloudFog', category: 'fog', isRain: false, emoji: '🌫️' },
  48: { label: 'Depositing rime fog', icon: 'CloudFog', category: 'fog', isRain: false, emoji: '🌫️' },
  51: { label: 'Light drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true, emoji: '🌦️' },
  53: { label: 'Moderate drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true, emoji: '🌧️' },
  55: { label: 'Dense drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true, emoji: '🌧️' },
  56: { label: 'Freezing drizzle', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  57: { label: 'Dense freezing drizzle', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  61: { label: 'Light rain', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  62: { label: 'Moderate rain', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  63: { label: 'Heavy rain', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  65: { label: 'Violent rain downpours', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '⛈️' },
  66: { label: 'Light freezing rain', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  67: { label: 'Heavy freezing rain', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  71: { label: 'Slight snow fall', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '🌨️' },
  73: { label: 'Moderate snow fall', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  75: { label: 'Heavy snow fall', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  77: { label: 'Snow grains', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  80: { label: 'Slight rain showers', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌦️' },
  81: { label: 'Moderate rain showers', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  82: { label: 'Violent rain showers', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '⛈️' },
  85: { label: 'Slight snow showers', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '🌨️' },
  86: { label: 'Heavy snow showers', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', category: 'storm', isRain: true, emoji: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: 'CloudLightning', category: 'storm', isRain: true, emoji: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'CloudLightning', category: 'storm', isRain: true, emoji: '⛈️' },
};

export function getWeatherInfo(code) {
  if (code === undefined || code === null) {
    return { label: 'Unknown', icon: 'Cloud', category: 'cloudy', isRain: false, emoji: '☁️' };
  }
  return WMO_WEATHER_CODES[code] || { label: 'Partly cloudy', icon: 'CloudSun', category: 'cloudy', isRain: false, emoji: '⛅' };
}

/**
 * Intelligent Weather Resolver: Ensures icons and labels always match rain reality.
 * Prevents misleading "Sunny / Cloud" icons when rain probability is 70%+ or when precipitation is actively falling!
 */
export function resolveSmartWeatherInfo(code, rainProb = 0, rainAmount = 0) {
  const base = getWeatherInfo(code);

  // If model marked overcast or cloudy, but significant rain probability or volume is forecasted:
  if (!base.isRain && (rainProb >= 40 || rainAmount >= 0.15)) {
    if (rainAmount >= 2.0 || rainProb >= 80) {
      return {
        label: 'Heavy Rain',
        icon: 'CloudRain',
        category: 'rain',
        isRain: true,
        emoji: '🌧️',
      };
    }
    if (rainAmount >= 0.4 || rainProb >= 55) {
      return {
        label: 'Rain Showers',
        icon: 'CloudRain',
        category: 'rain',
        isRain: true,
        emoji: '🌦️',
      };
    }
    return {
      label: 'Light Rain / Drizzle',
      icon: 'CloudDrizzle',
      category: 'rain',
      isRain: true,
      emoji: '🌦️',
    };
  }

  // If already a rain code, adjust intensity wording if rain is heavy
  if (base.isRain && (rainAmount >= 2.5 || (code >= 63 && code <= 65))) {
    return {
      ...base,
      label: 'Heavy Rain Downpours',
      icon: 'CloudRain',
      emoji: '⛈️',
    };
  }

  return base;
}
