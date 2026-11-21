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
  45: { label: 'Dense fog', icon: 'CloudFog', category: 'fog', isRain: false, emoji: '🌫️' },
  48: { label: 'Depositing rime fog', icon: 'CloudFog', category: 'fog', isRain: false, emoji: '🌫️' },
  51: { label: 'Light drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true, emoji: '🌦️' },
  53: { label: 'Moderate drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true, emoji: '🌧️' },
  55: { label: 'Dense drizzle', icon: 'CloudDrizzle', category: 'rain', isRain: true, emoji: '🌧️' },
  56: { label: 'Freezing drizzle', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  57: { label: 'Dense freezing drizzle', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  61: { label: 'Light rain', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  62: { label: 'Moderate rain', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  63: { label: 'Heavy rain', icon: 'CloudRainWind', category: 'rain', isRain: true, emoji: '🌧️' },
  65: { label: 'Lashing downpours', icon: 'CloudRainWind', category: 'rain', isRain: true, emoji: '⛈️' },
  66: { label: 'Light freezing rain', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  67: { label: 'Heavy freezing rain', icon: 'CloudSnow', category: 'snow', isRain: true, emoji: '🌨️' },
  71: { label: 'Slight snow fall', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '🌨️' },
  73: { label: 'Moderate snow fall', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  75: { label: 'Heavy snow fall', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  77: { label: 'Snow grains', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  80: { label: 'Passing rain showers', icon: 'CloudSunRain', category: 'rain', isRain: true, emoji: '🌦️' },
  81: { label: 'Moderate rain showers', icon: 'CloudRain', category: 'rain', isRain: true, emoji: '🌧️' },
  82: { label: 'Violent rain showers', icon: 'CloudRainWind', category: 'rain', isRain: true, emoji: '⛈️' },
  85: { label: 'Slight snow showers', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '🌨️' },
  86: { label: 'Heavy snow showers', icon: 'Snowflake', category: 'snow', isRain: false, emoji: '❄️' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', category: 'storm', isRain: true, emoji: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: 'CloudHail', category: 'storm', isRain: true, emoji: '⛈️' },
  99: { label: 'Heavy thunderstorm & hail', icon: 'CloudHail', category: 'storm', isRain: true, emoji: '⛈️' },
};

export function getWeatherInfo(code) {
  if (code === undefined || code === null) {
    return { label: 'Unknown', icon: 'Cloud', category: 'cloudy', isRain: false, emoji: '☁️' };
  }
  return WMO_WEATHER_CODES[code] || { label: 'Partly cloudy', icon: 'CloudSun', category: 'cloudy', isRain: false, emoji: '⛅' };
}

/**
 * Human Rain & Precipitation Classifier:
 * Translates abstract millimeters into plain English terms normal humans and Irish locals understand.
 */
export function getRainHumanType(rainAmountMm = 0, rainProb = 0, weatherCode = 0) {
  const amount = Number(rainAmountMm) || 0;
  const prob = Number(rainProb) || 0;

  // 1. Thunderstorms & Hail
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return {
      type: 'thunderstorm',
      label: 'Thunderstorms & Hail',
      shortLabel: 'Thunderstorm',
      intensity: 'Storm Alert',
      icon: 'CloudLightning',
      emoji: '⛈️',
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      description: 'Convective storm cells with lightning flashes, thunder, and gusty squalls.',
      whatItMeans: 'Sudden intense downpours with lightning hazard. Seek shelter indoors.',
      umbrellaNeeded: true,
      scaleIndex: 5,
    };
  }

  // 2. Snow / Sleet
  if (weatherCode >= 71 && weatherCode <= 86) {
    if (amount >= 2.0) {
      return {
        type: 'heavy_snow',
        label: 'Heavy Snowfall / Blizzard',
        shortLabel: 'Heavy Snow',
        intensity: 'Heavy Snow',
        icon: 'Snowflake',
        emoji: '❄️',
        color: 'text-indigo-200',
        badgeBg: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
        description: 'Accumulating snow, slick icy surfaces, poor driving visibility.',
        whatItMeans: 'Winter coat, boots, gloves needed. Hazardous travel conditions.',
        umbrellaNeeded: false,
        scaleIndex: 4,
      };
    }
    return {
      type: 'snow',
      label: 'Snow Flurries / Light Snow',
      shortLabel: 'Snow',
      intensity: 'Light Snow',
      icon: 'Snowflake',
      emoji: '🌨️',
      color: 'text-sky-200',
      badgeBg: 'bg-sky-500/20 text-sky-200 border border-sky-500/30',
      description: 'Gentle fluttering snow grains, light ground dusting.',
      whatItMeans: 'Winter coat and scarf needed.',
      umbrellaNeeded: false,
      scaleIndex: 2,
    };
  }

  // 3. Hail
  if (weatherCode === 96 || weatherCode === 99 || weatherCode === 89) {
    return {
      type: 'hail',
      label: 'Hail & Ice Pellets',
      shortLabel: 'Hail',
      intensity: 'Severe Burst',
      icon: 'CloudHail',
      emoji: '🌨️',
      color: 'text-cyan-300',
      badgeBg: 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30',
      description: 'Hard frozen ice pellets falling in brief violent bursts.',
      whatItMeans: 'Take cover immediately; stinging ice pellets.',
      umbrellaNeeded: true,
      scaleIndex: 5,
    };
  }

  // 4. Torrential Deluge (> 6.0 mm/hr)
  if (amount >= 6.0) {
    return {
      type: 'torrential',
      label: 'Torrential Deluge / Cloudburst',
      shortLabel: 'Deluge',
      intensity: 'Torrential',
      icon: 'CloudRainWind',
      emoji: '⛈️',
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40',
      description: 'Blinding sheets of driving rain, severe road spray, flash water runoff.',
      whatItMeans: 'Soaked in seconds. Avoid non-essential road travel.',
      umbrellaNeeded: true,
      scaleIndex: 5,
    };
  }

  // 5. Heavy Downpours / "Lashing Rain" (2.5 - 6.0 mm/hr)
  if (amount >= 2.5 || weatherCode === 63 || weatherCode === 65 || weatherCode === 82) {
    return {
      type: 'heavy_rain',
      label: 'Heavy Downpours ("Lashing Rain")',
      shortLabel: 'Lashing Rain',
      intensity: 'Heavy',
      icon: 'CloudRainWind',
      emoji: '🌧️',
      color: 'text-blue-400',
      badgeBg: 'bg-blue-600/30 text-blue-200 border border-blue-500/40',
      description: 'Classic Irish "lashing rain". Heavy soaking downpour, puddles merging into sheets, gutters overflowing.',
      whatItMeans: 'Thoroughly soaking rain. Heavy waterproof jacket or sturdy umbrella essential.',
      umbrellaNeeded: true,
      scaleIndex: 4,
    };
  }

  // 6. Moderate Rain Showers (0.7 - 2.5 mm/hr)
  if (amount >= 0.7 || weatherCode === 62 || weatherCode === 81) {
    return {
      type: 'moderate_rain',
      label: 'Moderate Rain Showers',
      shortLabel: 'Showers',
      intensity: 'Moderate',
      icon: 'CloudRain',
      emoji: '🌧️',
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/25 text-blue-300 border border-blue-500/30',
      description: 'Continuous proper rain. Audibly pattering, steady street spray, clothes get soaked without cover.',
      whatItMeans: 'Standard umbrella or hooded rain jacket definitely required.',
      umbrellaNeeded: true,
      scaleIndex: 3,
    };
  }

  // 7. Steady Light Rain (0.25 - 0.7 mm/hr)
  if (amount >= 0.25 || (prob >= 45 && amount > 0.05) || weatherCode === 61) {
    return {
      type: 'light_rain',
      label: 'Steady Light Rain',
      shortLabel: 'Light Rain',
      intensity: 'Light',
      icon: 'CloudRain',
      emoji: '🌧️',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25',
      description: 'Steady light rain. Noticeable droplets, windshield wipers on intermittent, coats get wet after a few minutes.',
      whatItMeans: 'Light raincoat or umbrella recommended for walks.',
      umbrellaNeeded: true,
      scaleIndex: 2,
    };
  }

  // 8. Fine Misting Drizzle / "Soft Day" (0.01 - 0.25 mm/hr)
  if (amount > 0 || prob >= 25 || (weatherCode >= 51 && weatherCode <= 55)) {
    return {
      type: 'drizzle',
      label: 'Fine Misting Drizzle ("Soft Day")',
      shortLabel: 'Misting',
      intensity: 'Misting / Very Light',
      icon: 'CloudDrizzle',
      emoji: '🌦️',
      color: 'text-teal-300',
      badgeBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/25',
      description: 'Typical Irish "soft day" mist. Tiny floating water droplets that coat hair and clothing like condensation.',
      whatItMeans: 'No heavy downpour, but dampens glasses and jackets. Hood up.',
      umbrellaNeeded: false,
      scaleIndex: 1,
    };
  }

  // 9. Dry
  return {
    type: 'dry',
    label: 'Dry & Settled',
    shortLabel: 'Dry',
    intensity: 'Dry',
    icon: 'Sun',
    emoji: '☀️',
    color: 'text-slate-400',
    badgeBg: 'bg-slate-800 text-slate-400',
    description: 'Dry conditions with negligible chance of precipitation.',
    whatItMeans: 'No wet weather gear needed.',
    umbrellaNeeded: false,
    scaleIndex: 0,
  };
}

/**
 * Intelligent Weather Resolver: Selects specific icon and specific label for ANY weather condition
 */
export function resolveSmartWeatherInfo(code, rainProb = 0, rainAmount = 0) {
  const rainInfo = getRainHumanType(rainAmount, rainProb, code);

  // If there is rain/drizzle/snow/thunder, let the rain human classification dictate
  if (rainInfo.type !== 'dry') {
    return {
      label: rainInfo.label,
      shortLabel: rainInfo.shortLabel,
      icon: rainInfo.icon,
      emoji: rainInfo.emoji,
      color: rainInfo.color,
      category: rainInfo.type.includes('snow') ? 'snow' : 'rain',
      isRain: !rainInfo.type.includes('snow'),
      rainInfo,
    };
  }

  // Otherwise, dry sky states:
  const base = getWeatherInfo(code);

  let shortLabel = 'Partly Cloudy';
  if (code === 0) shortLabel = 'Sunny';
  else if (code === 1) shortLabel = 'Mainly Clear';
  else if (code === 2) shortLabel = 'Partly Cloudy';
  else if (code === 3) shortLabel = 'Overcast';
  else if (code === 45 || code === 48) shortLabel = 'Dense Fog';

  return {
    label: base.label,
    shortLabel,
    icon: base.icon,
    emoji: base.emoji,
    color: 'text-slate-200',
    category: base.category,
    isRain: false,
    rainInfo,
  };
}
