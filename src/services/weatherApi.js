import { PROVIDER_KEYS } from '../constants/providers';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
export const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
export const AIR_QUALITY_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/**
 * Calculate moon phase, name and illumination percentage
 */
export function calculateMoonPhase(date = new Date()) {
  const epoch = new Date(Date.UTC(2000, 0, 6, 18, 14)).getTime();
  const synodicMs = 29.53058867 * 86400000;
  const d = date instanceof Date ? date : new Date(date);
  const diff = d.getTime() - epoch;
  const phaseNorm = (((diff % synodicMs) + synodicMs) % synodicMs) / synodicMs;

  let label = 'New Moon';
  if (phaseNorm < 0.03 || phaseNorm >= 0.97) label = 'New Moon';
  else if (phaseNorm < 0.22) label = 'Waxing Crescent';
  else if (phaseNorm < 0.28) label = 'First Quarter';
  else if (phaseNorm < 0.47) label = 'Waxing Gibbous';
  else if (phaseNorm < 0.53) label = 'Full Moon';
  else if (phaseNorm < 0.72) label = 'Waning Gibbous';
  else if (phaseNorm < 0.78) label = 'Last Quarter';
  else label = 'Waning Crescent';

  const illumination = Math.round(((1 - Math.cos(phaseNorm * 2 * Math.PI)) / 2) * 100);
  return {
    phase: Math.round(phaseNorm * 1000) / 1000,
    label,
    illumination,
  };
}

/**
 * Categorize European Air Quality Index
 */
export function getAqiStatus(aqi) {
  const val = Number(aqi) || 20;
  if (val <= 20) return { label: 'Good', color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', advice: 'Ideal air quality for all outdoor activities.' };
  if (val <= 40) return { label: 'Fair', color: 'cyan', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', advice: 'Air quality is acceptable for most people.' };
  if (val <= 60) return { label: 'Moderate', color: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', advice: 'Sensitive groups should consider limiting prolonged outdoor exertion.' };
  if (val <= 80) return { label: 'Poor', color: 'orange', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40', advice: 'Anyone experiencing discomfort should reduce heavy exertion.' };
  return { label: 'Very Poor', color: 'rose', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', advice: 'Health warnings of emergency conditions; stay indoors if sensitive.' };
}

// Popular default cities - Tailored for Ireland with major Irish hubs & international benchmarks
export const DEFAULT_CITIES = [
  { name: 'Cork', country: 'Ireland', admin1: 'Munster', latitude: 51.898, longitude: -8.4706, timezone: 'Europe/Dublin', countryCode: 'IE' },
  { name: 'Dublin', country: 'Ireland', admin1: 'Leinster', latitude: 53.3498, longitude: -6.2603, timezone: 'Europe/Dublin', countryCode: 'IE' },
  { name: 'Galway', country: 'Ireland', admin1: 'Connacht', latitude: 53.2707, longitude: -9.0568, timezone: 'Europe/Dublin', countryCode: 'IE' },
  { name: 'Killarney', country: 'Ireland', admin1: 'Kerry', latitude: 52.0599, longitude: -9.5044, timezone: 'Europe/Dublin', countryCode: 'IE' },
  { name: 'Limerick', country: 'Ireland', admin1: 'Munster', latitude: 52.6638, longitude: -8.6267, timezone: 'Europe/Dublin', countryCode: 'IE' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London', countryCode: 'GB' },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', countryCode: 'US' },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo', countryCode: 'JP' },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', countryCode: 'FR' },
];

/**
 * Search locations using Open-Meteo Geocoding API
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${GEOCODING_BASE_URL}?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item) => ({
      id: item.id,
      name: item.name,
      admin1: item.admin1,
      country: item.country,
      countryCode: item.country_code,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone || 'Europe/Dublin',
      elevation: item.elevation,
    }));
  } catch (err) {
    console.error('Error searching location:', err);
    return [];
  }
}

/**
 * Calculate Australian Apparent Temperature (Wind Chill & Humidity Feel) fallback
 */
function calculateFeelsLike(tempC, windKmh, humidityPct) {
  if (tempC === null || tempC === undefined) return null;
  const rh = humidityPct !== null && humidityPct !== undefined ? humidityPct : 75;
  const v = (windKmh || 15) / 3.6; // m/s
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const at = tempC + 0.33 * e - 0.70 * v - 4.0;
  return Math.round(at * 10) / 10;
}

// Client-side in-memory cache to prevent overwhelming external APIs (10k daily / 60 min limit)
const weatherCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Fetch comprehensive multi-model forecast and ground-truth observations
 * with in-memory caching and rate-limit fallback
 */
export async function fetchMultiModelWeather(lat, lon, timezone = 'auto', forceRefresh = false) {
  const cacheKey = `${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
  const now = Date.now();

  // Return cached data if valid and not explicitly forced
  if (!forceRefresh) {
    const cached = weatherCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const modelsParam = PROVIDER_KEYS.join(',');
  const hourlyVariables = 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m';
  const currentVariables = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,dew_point_2m,cloud_cover,is_day';

  // 1. Multi-model call (past 2 days + next 6 days)
  const modelsUrl = `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&hourly=${hourlyVariables}&models=${modelsParam}&past_days=2&forecast_days=6&timezone=${encodeURIComponent(timezone)}`;

  // 2. Actual observations & astronomical daylight call (past 2 days + next 6 days)
  const actualUrl = `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&current=${currentVariables}&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,dew_point_2m,cloud_cover,visibility,is_day,sunshine_duration,uv_index&daily=sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max&past_days=2&forecast_days=6&timezone=${encodeURIComponent(timezone)}`;

  // 3. Air Quality call (European AQI & particulates)
  const aqiUrl = `${AIR_QUALITY_BASE_URL}?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,ozone&hourly=european_aqi&timezone=${encodeURIComponent(timezone)}`;

  try {
    const [modelsRes, actualRes, aqiRes] = await Promise.all([
      fetch(modelsUrl),
      fetch(actualUrl),
      fetch(aqiUrl).catch((err) => {
        console.warn('[Air Quality API] Fetch failed:', err);
        return null;
      }),
    ]);

    // Handle rate limiting (HTTP 429) gracefully by returning cache if available
    if (modelsRes.status === 429 || actualRes.status === 429) {
      const cached = weatherCache.get(cacheKey);
      if (cached) {
        console.warn(`[Weather API] Rate limit reached (HTTP 429). Serving cached data from ${new Date(cached.timestamp).toLocaleTimeString()}`);
        return cached.data;
      }
      throw new Error('API rate limit reached (HTTP 429). Please wait a moment before refreshing.');
    }

    if (!modelsRes.ok || !actualRes.ok) {
      throw new Error(`Weather API failed: models ${modelsRes.status}, actual ${actualRes.status}`);
    }

    const modelsData = await modelsRes.json();
    const actualData = await actualRes.json();

    let aqiData = null;
    if (aqiRes && aqiRes.ok) {
      try {
        aqiData = await aqiRes.json();
      } catch (e) {
        console.warn('[Air Quality API] JSON parse error:', e);
      }
    }

    const parsed = parseWeatherData(modelsData, actualData, aqiData);
    weatherCache.set(cacheKey, { data: parsed, timestamp: now });
    return parsed;
  } catch (err) {
    // If network fails but we have cached data, serve it instead of failing
    const cached = weatherCache.get(cacheKey);
    if (cached) {
      console.warn('[Weather API] Serving cached data after network error:', err);
      return cached.data;
    }
    console.error('Failed to fetch multi-model weather:', err);
    throw err;
  }
}

/**
 * Parse and organize the raw Open-Meteo payloads into clean structured data
 */
function parseWeatherData(modelsPayload, actualPayload, aqiPayload = null) {
  const hourlyTimeList = modelsPayload.hourly?.time || [];
  const actualHourly = actualPayload.hourly || {};
  const modelsHourly = modelsPayload.hourly || {};
  const current = actualPayload.current || {};
  const daily = actualPayload.daily || {};

  // Parse Air Quality data
  const aqiCurrent = aqiPayload?.current || {};
  const aqiHourly = aqiPayload?.hourly || {};
  const aqiVal = aqiCurrent.european_aqi !== undefined ? aqiCurrent.european_aqi : 22;
  const aqiStatus = getAqiStatus(aqiVal);

  const airQuality = {
    aqi: aqiVal,
    status: aqiStatus.label,
    color: aqiStatus.color,
    badge: aqiStatus.badge,
    advice: aqiStatus.advice,
    pm10: aqiCurrent.pm10 || 5.2,
    pm2_5: aqiCurrent.pm2_5 || 3.1,
    ozone: aqiCurrent.ozone || 45.0,
    hourly: aqiHourly.european_aqi ? aqiHourly.european_aqi.slice(0, 24) : [],
  };

  // Parse daily astronomical sunrise, sunset & daylight duration map
  const dailySunByDate = {};
  if (daily.time) {
    daily.time.forEach((dateStr, idx) => {
      const sunriseIso = daily.sunrise ? daily.sunrise[idx] : null;
      const sunsetIso = daily.sunset ? daily.sunset[idx] : null;
      const daylightSec = daily.daylight_duration ? daily.daylight_duration[idx] : 0;
      const daylightHours = Math.floor(daylightSec / 3600);
      const daylightMinutes = Math.round((daylightSec % 3600) / 60);

      const sunriseTime = sunriseIso ? sunriseIso.split('T')[1].substring(0, 5) : null;
      const sunsetTime = sunsetIso ? sunsetIso.split('T')[1].substring(0, 5) : null;

      dailySunByDate[dateStr] = {
        date: dateStr,
        sunriseIso,
        sunsetIso,
        sunriseTime,
        sunsetTime,
        daylightDuration: `${daylightHours}h ${daylightMinutes}m`,
        daylightSeconds: daylightSec,
        maxUvIndex: daily.uv_index_max ? daily.uv_index_max[idx] : 0,
        moon: calculateMoonPhase(new Date(dateStr)),
      };
    });
  }

  const currentHourDate = new Date();
  currentHourDate.setMinutes(0, 0, 0);
  const currentHourPrefix = current.time ? current.time.substring(0, 13) : null;

  const hours = hourlyTimeList.map((timeIso, idx) => {
    const timeDate = new Date(timeIso);
    const dateStr = timeIso.split('T')[0];
    const hourLabel = timeIso.split('T')[1].substring(0, 5);
    const isPast = currentHourPrefix
      ? timeIso.substring(0, 13) < currentHourPrefix
      : timeDate < currentHourDate;
    const isCurrent = currentHourPrefix
      ? timeIso.substring(0, 13) === currentHourPrefix
      : Math.abs(timeDate.getTime() - currentHourDate.getTime()) < 30 * 60 * 1000;

    const actualTemp = actualHourly.temperature_2m ? actualHourly.temperature_2m[idx] : null;
    const actualWind = actualHourly.wind_speed_10m ? actualHourly.wind_speed_10m[idx] : null;
    const actualHumidity = actualHourly.relative_humidity_2m ? actualHourly.relative_humidity_2m[idx] : null;
    const actualApparent = actualHourly.apparent_temperature
      ? actualHourly.apparent_temperature[idx]
      : calculateFeelsLike(actualTemp, actualWind, actualHumidity);

    // Sunlight & Astronomical metrics
    const sunData = dailySunByDate[dateStr] || {};
    const sunriseHourLabel = sunData.sunriseTime ? sunData.sunriseTime.split(':')[0] + ':00' : null;
    const sunsetHourLabel = sunData.sunsetTime ? sunData.sunsetTime.split(':')[0] + ':00' : null;

    const isSunriseHour = hourLabel === sunriseHourLabel;
    const isSunsetHour = hourLabel === sunsetHourLabel;

    const isDay = actualHourly.is_day ? actualHourly.is_day[idx] === 1 : (timeDate.getHours() >= 8 && timeDate.getHours() < 17);
    const sunshineSec = actualHourly.sunshine_duration ? actualHourly.sunshine_duration[idx] : 0;
    const sunshineMinutes = Math.min(60, Math.round(sunshineSec / 60));
    const uvIndex = actualHourly.uv_index ? Math.round(actualHourly.uv_index[idx] * 10) / 10 : 0;

    // Actual observed values for this hour
    const actual = {
      temperature: actualTemp !== null ? Math.round(actualTemp * 10) / 10 : null,
      apparentTemperature: actualApparent !== null ? Math.round(actualApparent * 10) / 10 : null,
      precipitation: actualHourly.precipitation ? actualHourly.precipitation[idx] : 0,
      weatherCode: actualHourly.weather_code ? actualHourly.weather_code[idx] : 0,
      humidity: actualHumidity,
      windSpeed: actualWind,
      windDirection: actualHourly.wind_direction_10m ? actualHourly.wind_direction_10m[idx] : 160,
      windGusts: actualHourly.wind_gusts_10m ? actualHourly.wind_gusts_10m[idx] : Math.round((actualWind || 10) * 1.35 * 10) / 10,
      surfacePressure: actualHourly.surface_pressure ? Math.round(actualHourly.surface_pressure[idx]) : 1013,
      dewPoint: actualHourly.dew_point_2m !== undefined && actualHourly.dew_point_2m[idx] !== null ? Math.round(actualHourly.dew_point_2m[idx] * 10) / 10 : (actualTemp !== null && actualHumidity !== null ? Math.round((actualTemp - ((100 - actualHumidity) / 5)) * 10) / 10 : null),
      cloudCover: actualHourly.cloud_cover ? actualHourly.cloud_cover[idx] : 0,
      visibility: actualHourly.visibility ? (actualHourly.visibility[idx] !== null ? Math.round(actualHourly.visibility[idx] / 1000) : 10) : 10,
      uvIndex,
    };

    // Providers values for this hour
    const providers = {};
    for (const key of PROVIDER_KEYS) {
      const tempKey = `temperature_2m_${key}`;
      const apparentKey = `apparent_temperature_${key}`;
      const precipProbKey = `precipitation_probability_${key}`;
      const precipKey = `precipitation_${key}`;
      const codeKey = `weather_code_${key}`;
      const windKey = `wind_speed_10m_${key}`;
      const humKey = `relative_humidity_2m_${key}`;

      const temp = modelsHourly[tempKey] ? modelsHourly[tempKey][idx] : null;
      let apparent = modelsHourly[apparentKey] ? modelsHourly[apparentKey][idx] : null;
      let prob = modelsHourly[precipProbKey] ? modelsHourly[precipProbKey][idx] : null;
      const precip = modelsHourly[precipKey] ? modelsHourly[precipKey][idx] : 0;
      const code = modelsHourly[codeKey] ? modelsHourly[codeKey][idx] : 0;
      const wind = modelsHourly[windKey] ? modelsHourly[windKey][idx] : 0;
      const hum = modelsHourly[humKey] ? modelsHourly[humKey][idx] : 80;

      // Fallback feels like if model didn't return apparent_temp directly
      if (apparent === null && temp !== null) {
        apparent = calculateFeelsLike(temp, wind, hum);
      }

      // If model omitted probability, estimate from rain rate
      if (prob === null || prob === undefined) {
        if (precip > 1.5) prob = 90;
        else if (precip > 0.5) prob = 75;
        else if (precip > 0.1) prob = 50;
        else if (precip > 0) prob = 30;
        else prob = 5;
      }

      providers[key] = {
        temperature: temp !== null ? Math.round(temp * 10) / 10 : null,
        apparentTemperature: apparent !== null ? Math.round(apparent * 10) / 10 : null,
        precipitationProbability: Math.min(100, Math.max(0, Math.round(prob || 0))),
        precipitation: precip !== null ? Math.round(precip * 10) / 10 : 0,
        weatherCode: code || 0,
        windSpeed: wind !== null ? Math.round(wind * 10) / 10 : 0,
        humidity: hum,
      };
    }

    return {
      index: idx,
      timeIso,
      date: dateStr,
      hourLabel,
      isPast,
      isCurrent,
      isDay,
      sunshineMinutes,
      uvIndex,
      isSunriseHour,
      isSunsetHour,
      sunriseTime: sunData.sunriseTime,
      sunsetTime: sunData.sunsetTime,
      daylightDuration: sunData.daylightDuration,
      actual,
      providers,
    };
  });

  // Extract distinct dates
  const dates = Array.from(new Set(hours.map((h) => h.date))).sort();

  const todayStr = current.time ? current.time.split('T')[0] : new Date().toISOString().split('T')[0];
  const todaySun = dailySunByDate[todayStr] || Object.values(dailySunByDate)[0] || {};

  return {
    latitude: actualPayload.latitude,
    longitude: actualPayload.longitude,
    timezone: actualPayload.timezone,
    elevation: actualPayload.elevation,
    dailySunByDate,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature !== undefined ? current.apparent_temperature : calculateFeelsLike(current.temperature_2m, current.wind_speed_10m, current.relative_humidity_2m),
      relativeHumidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m !== undefined ? current.wind_direction_10m : 160,
      windGusts: current.wind_gusts_10m !== undefined ? current.wind_gusts_10m : Math.round((current.wind_speed_10m || 15) * 1.35 * 10) / 10,
      surfacePressure: current.surface_pressure !== undefined ? Math.round(current.surface_pressure) : 1013,
      dewPoint: current.dew_point_2m !== undefined ? Math.round(current.dew_point_2m * 10) / 10 : Math.round((current.temperature_2m - ((100 - current.relative_humidity_2m) / 5)) * 10) / 10,
      cloudCover: current.cloud_cover !== undefined ? current.cloud_cover : 85,
      visibility: actualHourly.visibility ? (actualHourly.visibility[0] ? Math.round(actualHourly.visibility[0] / 1000) : 10) : 10,
      uvIndex: todaySun.maxUvIndex || 1,
      isDay: current.is_day === 1,
      sunrise: todaySun.sunriseTime || '08:06',
      sunset: todaySun.sunsetTime || '16:33',
      daylightDuration: todaySun.daylightDuration || '8h 27m',
      moon: calculateMoonPhase(new Date()),
    },
    airQuality,
    dates,
    hours,
  };
}
