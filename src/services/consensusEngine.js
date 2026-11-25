import { WEATHER_PROVIDERS, PROVIDER_KEYS, getWeatherInfo, resolveSmartWeatherInfo, getRainHumanType } from '../constants/providers';
import { formatTime } from '../utils/units';

/**
 * Classify a WMO weather code into a physical sky/weather regime
 * so split votes across similar codes never let a minority outlier win.
 */
function getWeatherRegime(code) {
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([51, 53, 55, 61, 62, 63, 65, 80, 81, 82].includes(code)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'overcast';
  if (code === 2) return 'partly_cloudy';
  return 'clear';
}

/**
 * Compute weighted average of an optional numeric property across active providers.
 */
function computeWeightedOptionalMean(providerValues, weights, extractor, decimals = 1) {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [id, data] of providerValues) {
    const val = extractor(data);
    if (val !== null && val !== undefined && !Number.isNaN(Number(val))) {
      const w = weights[id] || 1;
      weightedSum += Number(val) * w;
      weightTotal += w;
    }
  }
  if (weightTotal === 0) return null;
  const factor = Math.pow(10, decimals);
  return Math.round((weightedSum / weightTotal) * factor) / factor;
}

/**
 * Compute the TrueCast Consensus for an array of hourly items.
 * Incorporates dynamic weights, regime-first sky voting, cloud-cover cross-checks,
 * and aggregated wind/humidity/cloud metrics.
 */
export function computeHourlyConsensus(hours, customWeights = null) {
  return hours.map((hour) => {
    const providerValues = Object.entries(hour.providers)
      .filter(([id, data]) => data && data.temperature !== null && data.temperature !== undefined);

    if (providerValues.length === 0) {
      return {
        ...hour,
        consensus: null,
      };
    }

    // 1. Calculate weights
    let totalWeight = 0;
    const weights = {};
    for (const [id] of providerValues) {
      const w = customWeights && customWeights[id] !== undefined
        ? customWeights[id]
        : (WEATHER_PROVIDERS[id]?.baseWeight || 1.0);
      weights[id] = w;
      totalWeight += w;
    }

    // 2. Temperature & Apparent Temperature (Feels Like)
    const temps = providerValues.map(([_, d]) => d.temperature);
    const sortedTemps = [...temps].sort((a, b) => a - b);
    const minTemp = sortedTemps[0];
    const maxTemp = sortedTemps[sortedTemps.length - 1];
    const tempSpread = Math.round((maxTemp - minTemp) * 10) / 10;

    let weightedTempSum = 0;
    let weightedApparentSum = 0;
    for (const [id, d] of providerValues) {
      const weight = weights[id] || 1;
      weightedTempSum += d.temperature * weight;
      const app = d.apparentTemperature !== null && d.apparentTemperature !== undefined ? d.apparentTemperature : d.temperature;
      weightedApparentSum += app * weight;
    }
    const weightedTemp = Math.round((weightedTempSum / totalWeight) * 10) / 10;
    const weightedApparent = Math.round((weightedApparentSum / totalWeight) * 10) / 10;

    const mid = Math.floor(sortedTemps.length / 2);
    const medianTemp = sortedTemps.length % 2 !== 0
      ? sortedTemps[mid]
      : Math.round(((sortedTemps[mid - 1] + sortedTemps[mid]) / 2) * 10) / 10;

    // 2b. Aggregated Wind Speed, Humidity, Cloud Cover
    const consensusWind = computeWeightedOptionalMean(providerValues, weights, (d) => d.windSpeed, 1);
    const consensusHumidity = computeWeightedOptionalMean(providerValues, weights, (d) => d.humidity, 0);
    let consensusCloudCover = computeWeightedOptionalMean(providerValues, weights, (d) => d.cloudCover, 0);
    if (consensusCloudCover === null && hour.actual?.cloudCover !== null && hour.actual?.cloudCover !== undefined) {
      consensusCloudCover = Math.round(hour.actual.cloudCover);
    }

    // 3. Precipitation Probability & Rain Amount statistics
    const probs = providerValues.map(([_, d]) => d.precipitationProbability);
    const minProb = Math.min(...probs);
    const maxProb = Math.max(...probs);
    const probSpread = maxProb - minProb;

    let weightedProbSum = 0;
    for (const [id, d] of providerValues) {
      weightedProbSum += d.precipitationProbability * (weights[id] || 1);
    }
    let consensusProb = Math.round(weightedProbSum / totalWeight);

    // Rain model count
    const rainPredictors = providerValues.filter(([_, d]) => d.precipitationProbability >= 40 || d.precipitation > 0.15);
    const rainAgreementPct = Math.round((rainPredictors.length / providerValues.length) * 100);

    // Smooth calibration with physical precip coherence
    let weightedPrecipSum = 0;
    for (const [id, d] of providerValues) {
      weightedPrecipSum += (d.precipitation || 0) * (weights[id] || 1);
    }
    const consensusPrecip = Math.round((weightedPrecipSum / totalWeight) * 10) / 10;

    if (rainAgreementPct >= 65 && consensusProb < 60) {
      consensusProb = Math.min(95, consensusProb + 12);
    } else if (rainAgreementPct <= 15 && consensusPrecip < 0.05 && consensusProb > 25) {
      consensusProb = Math.max(5, consensusProb - 10);
    }
    if (consensusPrecip >= 0.2 && consensusProb < 45) {
      consensusProb = 45;
    }

    // 4. Two-Stage Hierarchical Weather Code Voting (prevents minority "Sunny" split-vote upsets)
    const regimeWeights = {};
    const regimeCodeVotes = {};
    let validCodeWeightTotal = 0;

    for (const [id, d] of providerValues) {
      if (d.weatherCode === null || d.weatherCode === undefined) continue;
      const code = d.weatherCode;
      const w = weights[id] || 1;
      const regime = getWeatherRegime(code);

      regimeWeights[regime] = (regimeWeights[regime] || 0) + w;
      if (!regimeCodeVotes[regime]) regimeCodeVotes[regime] = {};
      regimeCodeVotes[regime][code] = (regimeCodeVotes[regime][code] || 0) + w;
      validCodeWeightTotal += w;
    }

    let dominantCode = 2;
    if (validCodeWeightTotal > 0) {
      const wetWeight = (regimeWeights.storm || 0) + (regimeWeights.snow || 0) + (regimeWeights.rain || 0);
      const nonClearWeight = validCodeWeightTotal - (regimeWeights.clear || 0);

      let winningRegime = null;
      // Wet group vs Dry group check first: don't declare dry/sunny if majority is wet
      if (wetWeight >= validCodeWeightTotal * 0.45 && consensusProb >= 40) {
        const wetRegimes = ['storm', 'snow', 'rain'].filter((r) => regimeWeights[r] > 0);
        winningRegime = wetRegimes.sort((a, b) => (regimeWeights[b] || 0) - (regimeWeights[a] || 0))[0];
      } else if ((regimeWeights.clear || 0) >= nonClearWeight) {
        winningRegime = 'clear';
      } else {
        // Majority expects clouds, fog, or precipitation rather than clear skies
        const nonClearRegimes = Object.keys(regimeWeights).filter((r) => r !== 'clear');
        winningRegime = nonClearRegimes.sort((a, b) => (regimeWeights[b] || 0) - (regimeWeights[a] || 0))[0];
      }

      const candidates = regimeCodeVotes[winningRegime] || {};
      let maxVote = -1;
      for (const [code, vote] of Object.entries(candidates)) {
        if (vote > maxVote) {
          maxVote = vote;
          dominantCode = parseInt(code, 10);
        }
      }
    }

    // 5. Physical Truthfulness Guardrail: reconcile clear/sunny codes with cloudCover & precip
    if (dominantCode <= 3) {
      if (consensusPrecip >= 0.25 || (consensusProb >= 55 && consensusPrecip >= 0.05)) {
        dominantCode = consensusPrecip >= 0.7 ? 62 : 61;
      } else if (consensusProb >= 45) {
        dominantCode = 51;
      } else if (consensusCloudCover !== null) {
        if (consensusCloudCover >= 80 && dominantCode < 3) {
          dominantCode = 3;
        } else if (consensusCloudCover >= 45 && dominantCode < 2) {
          dominantCode = 2;
        } else if (consensusCloudCover >= 25 && dominantCode === 0) {
          dominantCode = 1;
        }
      }
      if (rainAgreementPct >= 35 && dominantCode < 2) {
        dominantCode = 2;
      }
    }

    // 6. Agreement & Confidence Rating (0 - 100%)
    let agreementScore = 100;
    if (tempSpread > 1.5) agreementScore -= Math.min(35, (tempSpread - 1.5) * 12);
    if (probSpread > 30) agreementScore -= Math.min(45, (probSpread - 30) * 0.9);
    agreementScore = Math.max(25, Math.min(100, Math.round(agreementScore)));

    let agreementLevel = 'Very High';
    let agreementColor = 'emerald';
    if (agreementScore < 50) {
      agreementLevel = 'Split / Low';
      agreementColor = 'rose';
    } else if (agreementScore < 70) {
      agreementLevel = 'Moderate';
      agreementColor = 'amber';
    } else if (agreementScore < 85) {
      agreementLevel = 'High';
      agreementColor = 'cyan';
    }

    // 7. Divergence flag & explanation
    let isDivergent = false;
    let divergenceReason = null;
    if (probSpread >= 45 || tempSpread >= 3.0) {
      isDivergent = true;
      if (probSpread >= 45) {
        const wetModels = providerValues.filter(([_, d]) => d.precipitationProbability >= 50).map(([id]) => WEATHER_PROVIDERS[id]?.shortName || id);
        const dryModels = providerValues.filter(([_, d]) => d.precipitationProbability < 30).map(([id]) => WEATHER_PROVIDERS[id]?.shortName || id);
        divergenceReason = `Rain split: ${wetModels.join(', ')} predict rain, while ${dryModels.join(', ')} predict dry.`;
      } else {
        divergenceReason = `Temp spread of ${tempSpread}°C between models (range: ${minTemp}°C - ${maxTemp}°C).`;
      }
    }

    // Smart resolver ensures icons & labels stay faithful to day/night and cloud cover
    const isDay = hour.isDay !== undefined ? Boolean(hour.isDay) : true;
    const weatherInfo = resolveSmartWeatherInfo(dominantCode, consensusProb, consensusPrecip, isDay, consensusCloudCover);
    const rainTypeInfo = getRainHumanType(consensusPrecip, consensusProb, dominantCode);

    return {
      ...hour,
      consensus: {
        temperature: weightedTemp,
        apparentTemperature: weightedApparent,
        medianTemperature: medianTemp,
        tempSpread,
        minTemp,
        maxTemp,
        windSpeed: consensusWind,
        humidity: consensusHumidity,
        cloudCover: consensusCloudCover,
        precipitationProbability: consensusProb,
        precipitation: consensusPrecip,
        probSpread,
        weatherCode: dominantCode,
        weatherLabel: weatherInfo.label,
        shortLabel: weatherInfo.shortLabel,
        weatherIcon: weatherInfo.icon,
        weatherEmoji: weatherInfo.emoji,
        isRain: weatherInfo.isRain,
        rainTypeInfo,
        agreementScore,
        agreementLevel,
        agreementColor,
        isDivergent,
        divergenceReason,
        rainPredictorCount: rainPredictors.length,
        totalModels: providerValues.length,
      },
    };
  });
}

/**
 * Generate a smart high-level daily synthesis summary
 */
export function generateDailySummary(dayHours, dateStr, timeFormat = '24h') {
  if (!dayHours || dayHours.length === 0) return null;

  const validHours = dayHours.filter((h) => h.consensus);
  if (validHours.length === 0) return null;

  const temps = validHours.map((h) => h.consensus.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  const rainHours = validHours.filter((h) => h.consensus.precipitationProbability >= 40 || h.consensus.precipitation >= 0.15);
  const maxRainProb = Math.max(...validHours.map((h) => h.consensus.precipitationProbability));
  const totalRain = Math.round(validHours.reduce((sum, h) => sum + (h.consensus.precipitation || 0), 0) * 10) / 10;
  const maxHourlyRain = Math.max(...validHours.map((h) => h.consensus.precipitation || 0));

  const avgAgreement = Math.round(validHours.reduce((sum, h) => sum + h.consensus.agreementScore, 0) / validHours.length);

  // Peak rain window
  let rainWindow = null;
  if (rainHours.length > 0) {
    const startHour = formatTime(rainHours[0].hourLabel, timeFormat);
    const endHour = formatTime(rainHours[rainHours.length - 1].hourLabel, timeFormat);
    rainWindow = startHour === endHour ? `around ${startHour}` : `between ${startHour} and ${endHour}`;
  }

  // Divergent hours
  const divergentHours = validHours.filter((h) => h.consensus.isDivergent);

  // Peak rain human classification
  const peakRainType = getRainHumanType(maxHourlyRain, maxRainProb, 0);

  // Daytime hours for dry-sky classification (fallback to all valid hours if nighttime-only)
  const dayWindow = validHours.filter((h) => h.isDay !== false);
  const skySample = dayWindow.length > 0 ? dayWindow : validHours;
  const fogCount = skySample.filter((h) => h.consensus.weatherCode === 45 || h.consensus.weatherCode === 48).length;
  const overcastCount = skySample.filter((h) => h.consensus.weatherCode === 3 || (h.consensus.cloudCover !== null && h.consensus.cloudCover >= 75)).length;
  const partlyCloudyCount = skySample.filter((h) => h.consensus.weatherCode === 2 || (h.consensus.cloudCover !== null && h.consensus.cloudCover >= 35)).length;
  const isAllNight = dayWindow.length === 0;

  // Determine true dominant daily icon & condition that tells the story
  let dailyCondition = 'Partly Cloudy';
  let dailyIcon = 'CloudSun';
  let dailyEmoji = '⛅';

  if (maxHourlyRain >= 2.5 || totalRain >= 6.0) {
    dailyCondition = 'Heavy Downpours ("Lashing Rain")';
    dailyIcon = 'CloudRainWind';
    dailyEmoji = '⛈️';
  } else if (maxHourlyRain >= 0.7 || totalRain >= 2.0 || maxRainProb >= 70) {
    dailyCondition = 'Moderate Rain Showers';
    dailyIcon = 'CloudRain';
    dailyEmoji = '🌧️';
  } else if (maxRainProb >= 40 || totalRain >= 0.3) {
    dailyCondition = 'Steady Light Rain';
    dailyIcon = 'CloudRain';
    dailyEmoji = '🌧️';
  } else if (maxRainProb >= 25 || totalRain >= 0.1) {
    dailyCondition = 'Fine Misting Drizzle ("Soft Day")';
    dailyIcon = 'CloudDrizzle';
    dailyEmoji = '🌦️';
  } else if (fogCount >= Math.max(2, Math.ceil(skySample.length * 0.35))) {
    dailyCondition = 'Foggy / Misty';
    dailyIcon = 'fog';
    dailyEmoji = '🌫️';
  } else if (overcastCount >= Math.ceil(skySample.length * 0.5)) {
    dailyCondition = 'Overcast / Grey Sky';
    dailyIcon = 'Cloud';
    dailyEmoji = '☁️';
  } else if (partlyCloudyCount >= Math.ceil(skySample.length * 0.4)) {
    dailyCondition = 'Partly Cloudy';
    dailyIcon = 'CloudSun';
    dailyEmoji = '⛅';
  } else if (isAllNight) {
    dailyCondition = 'Clear Night Sky';
    dailyIcon = 'Sun';
    dailyEmoji = '🌙';
  } else {
    dailyCondition = 'Mainly Clear & Sunny';
    dailyIcon = 'Sun';
    dailyEmoji = '☀️';
  }

  // Natural language human description
  let description = '';
  if (totalRain >= 8.0 || maxHourlyRain >= 3.0) {
    description = `Substantial rainfall expected ${rainWindow}. Peak conditions: ${peakRainType.label} (up to ${maxHourlyRain} mm/hr). Expect wet roads, localized surface spray, and ~${totalRain} mm total volume.`;
  } else if (rainHours.length > 0) {
    description = `${peakRainType.label} expected ${rainWindow}. Peak rain chance is ${maxRainProb}% with ~${totalRain} mm total volume.`;
  } else if (maxRainProb < 20) {
    description = `${dailyCondition} with dry, settled conditions. High model consensus (${avgAgreement}%) with low chance of rain.`;
  } else {
    description = `${dailyCondition} with isolated chance (${maxRainProb}%) of passing fine drizzle. High of ${maxTemp}°C.`;
  }

  return {
    date: dateStr,
    minTemp,
    maxTemp,
    maxRainProb,
    totalRain,
    maxHourlyRain,
    avgAgreement,
    rainWindow,
    hasRain: rainHours.length > 0,
    divergentCount: divergentHours.length,
    dailyCondition,
    dailyIcon,
    dailyEmoji,
    peakRainType,
    description,
  };
}
