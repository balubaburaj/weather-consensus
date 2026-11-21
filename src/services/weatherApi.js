import { PROVIDER_KEYS } from '../constants/providers';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// Popular default cities
export const DEFAULT_CITIES = [
  { name: 'London', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London', countryCode: 'GB' },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', countryCode: 'US' },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo', countryCode: 'JP' },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', countryCode: 'FR' },
  { name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin', countryCode: 'DE' },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', countryCode: 'AU' },
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai', countryCode: 'AE' },
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', countryCode: 'SG' },
];

/**
 * Search locations using Open-Meteo Geocoding API
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${GEOCODING_BASE_URL}?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`);
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
      timezone: item.timezone || 'auto',
      elevation: item.elevation,
    }));
  } catch (err) {
    console.error('Error searching location:', err);
    return [];
  }
}

/**
 * Fetch comprehensive multi-model forecast and ground-truth observations
 */
export async function fetchMultiModelWeather(lat, lon, timezone = 'auto') {
  const modelsParam = PROVIDER_KEYS.join(',');
  const hourlyVariables = 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m';
  const currentVariables = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,is_day';

  // 1. Multi-model call (past 2 days + next 5 days)
  const modelsUrl = `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&hourly=${hourlyVariables}&models=${modelsParam}&past_days=2&forecast_days=6&timezone=${encodeURIComponent(timezone)}`;

  // 2. Actual observations / standard seamless analysis call
  const actualUrl = `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&current=${currentVariables}&hourly=temperature_2m,precipitation,weather_code,relative_humidity_2m,wind_speed_10m&past_days=2&forecast_days=6&timezone=${encodeURIComponent(timezone)}`;

  try {
    const [modelsRes, actualRes] = await Promise.all([
      fetch(modelsUrl),
      fetch(actualUrl),
    ]);

    if (!modelsRes.ok || !actualRes.ok) {
      throw new Error(`Weather API failed: models ${modelsRes.status}, actual ${actualRes.status}`);
    }

    const modelsData = await modelsRes.json();
    const actualData = await actualRes.json();

    return parseWeatherData(modelsData, actualData);
  } catch (err) {
    console.error('Failed to fetch multi-model weather:', err);
    throw err;
  }
}

/**
 * Parse and organize the raw Open-Meteo payloads into clean structured data
 */
function parseWeatherData(modelsPayload, actualPayload) {
  const hourlyTimeList = modelsPayload.hourly?.time || [];
  const actualHourly = actualPayload.hourly || {};
  const modelsHourly = modelsPayload.hourly || {};
  const current = actualPayload.current || {};

  const nowIso = new Date().toISOString();
  const currentHourDate = new Date();
  currentHourDate.setMinutes(0, 0, 0);

  const hours = hourlyTimeList.map((timeIso, idx) => {
    const timeDate = new Date(timeIso);
    const dateStr = timeIso.split('T')[0];
    const hourLabel = timeIso.split('T')[1].substring(0, 5);
    const isPast = timeDate < currentHourDate;
    const isCurrent = Math.abs(timeDate.getTime() - currentHourDate.getTime()) < 30 * 60 * 1000;

    // Actual observed values for this hour (from seamless reanalysis/nowcast)
    const actual = {
      temperature: actualHourly.temperature_2m ? actualHourly.temperature_2m[idx] : null,
      precipitation: actualHourly.precipitation ? actualHourly.precipitation[idx] : 0,
      weatherCode: actualHourly.weather_code ? actualHourly.weather_code[idx] : 0,
      humidity: actualHourly.relative_humidity_2m ? actualHourly.relative_humidity_2m[idx] : null,
      windSpeed: actualHourly.wind_speed_10m ? actualHourly.wind_speed_10m[idx] : null,
    };

    // Providers values for this hour
    const providers = {};
    for (const key of PROVIDER_KEYS) {
      const tempKey = `temperature_2m_${key}`;
      const precipProbKey = `precipitation_probability_${key}`;
      const precipKey = `precipitation_${key}`;
      const codeKey = `weather_code_${key}`;
      const windKey = `wind_speed_10m_${key}`;

      const temp = modelsHourly[tempKey] ? modelsHourly[tempKey][idx] : null;
      let prob = modelsHourly[precipProbKey] ? modelsHourly[precipProbKey][idx] : null;
      const precip = modelsHourly[precipKey] ? modelsHourly[precipKey][idx] : 0;
      const code = modelsHourly[codeKey] ? modelsHourly[codeKey][idx] : 0;
      const wind = modelsHourly[windKey] ? modelsHourly[windKey][idx] : 0;

      // Some regional models (like MeteoFrance) don't report precip probability directly,
      // so we compute a meteorologically sound estimated probability based on precipitation rate
      if (prob === null || prob === undefined) {
        if (precip > 1.5) prob = 90;
        else if (precip > 0.5) prob = 75;
        else if (precip > 0.1) prob = 50;
        else if (precip > 0) prob = 30;
        else prob = 5;
      }

      providers[key] = {
        temperature: temp !== null ? Math.round(temp * 10) / 10 : null,
        precipitationProbability: Math.min(100, Math.max(0, Math.round(prob || 0))),
        precipitation: precip !== null ? Math.round(precip * 10) / 10 : 0,
        weatherCode: code || 0,
        windSpeed: wind !== null ? Math.round(wind * 10) / 10 : 0,
      };
    }

    return {
      index: idx,
      timeIso,
      date: dateStr,
      hourLabel,
      isPast,
      isCurrent,
      actual,
      providers,
    };
  });

  // Extract distinct dates
  const dates = Array.from(new Set(hours.map((h) => h.date))).sort();

  return {
    latitude: actualPayload.latitude,
    longitude: actualPayload.longitude,
    timezone: actualPayload.timezone,
    elevation: actualPayload.elevation,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      relativeHumidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      isDay: current.is_day === 1,
    },
    dates,
    hours,
  };
}
