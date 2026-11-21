import { PROVIDER_KEYS } from '../constants/providers';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

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

/**
 * Fetch comprehensive multi-model forecast and ground-truth observations
 */
export async function fetchMultiModelWeather(lat, lon, timezone = 'auto') {
  const modelsParam = PROVIDER_KEYS.join(',');
  const hourlyVariables = 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m';
  const currentVariables = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,is_day';

  // 1. Multi-model call (past 2 days + next 6 days)
  const modelsUrl = `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&hourly=${hourlyVariables}&models=${modelsParam}&past_days=2&forecast_days=6&timezone=${encodeURIComponent(timezone)}`;

  // 2. Actual observations / standard seamless analysis call
  const actualUrl = `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&current=${currentVariables}&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,relative_humidity_2m,wind_speed_10m&past_days=2&forecast_days=6&timezone=${encodeURIComponent(timezone)}`;

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

  const currentHourDate = new Date();
  currentHourDate.setMinutes(0, 0, 0);

  const hours = hourlyTimeList.map((timeIso, idx) => {
    const timeDate = new Date(timeIso);
    const dateStr = timeIso.split('T')[0];
    const hourLabel = timeIso.split('T')[1].substring(0, 5);
    const isPast = timeDate < currentHourDate;
    const isCurrent = Math.abs(timeDate.getTime() - currentHourDate.getTime()) < 30 * 60 * 1000;

    const actualTemp = actualHourly.temperature_2m ? actualHourly.temperature_2m[idx] : null;
    const actualWind = actualHourly.wind_speed_10m ? actualHourly.wind_speed_10m[idx] : null;
    const actualHumidity = actualHourly.relative_humidity_2m ? actualHourly.relative_humidity_2m[idx] : null;
    const actualApparent = actualHourly.apparent_temperature
      ? actualHourly.apparent_temperature[idx]
      : calculateFeelsLike(actualTemp, actualWind, actualHumidity);

    // Actual observed values for this hour
    const actual = {
      temperature: actualTemp !== null ? Math.round(actualTemp * 10) / 10 : null,
      apparentTemperature: actualApparent !== null ? Math.round(actualApparent * 10) / 10 : null,
      precipitation: actualHourly.precipitation ? actualHourly.precipitation[idx] : 0,
      weatherCode: actualHourly.weather_code ? actualHourly.weather_code[idx] : 0,
      humidity: actualHumidity,
      windSpeed: actualWind,
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
      apparentTemperature: current.apparent_temperature !== undefined ? current.apparent_temperature : calculateFeelsLike(current.temperature_2m, current.wind_speed_10m, current.relative_humidity_2m),
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
