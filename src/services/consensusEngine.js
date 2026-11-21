import { WEATHER_PROVIDERS, PROVIDER_KEYS, getWeatherInfo, resolveSmartWeatherInfo } from '../constants/providers';

/**
 * Compute the TrueCast Consensus for an array of hourly items.
 * Can incorporate dynamic weights based on real-time accuracy scoring.
 */
export function computeHourlyConsensus(hours, customWeights = null) {
  return hours.map((hour) => {
    const providerValues = Object.entries(hour.providers)
      .filter(([id, data]) => data && data.temperature !== null);

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

    // 2. Temperature statistics
    const temps = providerValues.map(([_, d]) => d.temperature);
    const sortedTemps = [...temps].sort((a, b) => a - b);
    const minTemp = sortedTemps[0];
    const maxTemp = sortedTemps[sortedTemps.length - 1];
    const tempSpread = Math.round((maxTemp - minTemp) * 10) / 10;

    // Weighted temperature
    let weightedTempSum = 0;
    for (const [id, d] of providerValues) {
      weightedTempSum += d.temperature * (weights[id] || 1);
    }
    const weightedTemp = Math.round((weightedTempSum / totalWeight) * 10) / 10;

    // Median temperature
    const mid = Math.floor(sortedTemps.length / 2);
    const medianTemp = sortedTemps.length % 2 !== 0
      ? sortedTemps[mid]
      : Math.round(((sortedTemps[mid - 1] + sortedTemps[mid]) / 2) * 10) / 10;

    // 3. Precipitation Probability statistics
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

    // If strong majority predicts rain, calibrate probability up
    if (rainAgreementPct >= 65 && consensusProb < 60) {
      consensusProb = Math.min(95, consensusProb + 15);
    } else if (rainAgreementPct <= 15 && consensusProb > 25) {
      consensusProb = Math.max(5, consensusProb - 15);
    }

    // 4. Precipitation amount (mm)
    let weightedPrecipSum = 0;
    for (const [id, d] of providerValues) {
      weightedPrecipSum += (d.precipitation || 0) * (weights[id] || 1);
    }
    const consensusPrecip = Math.round((weightedPrecipSum / totalWeight) * 10) / 10;

    // 5. Weather code consensus (weighted voting)
    const codeVotes = {};
    for (const [id, d] of providerValues) {
      const code = d.weatherCode;
      codeVotes[code] = (codeVotes[code] || 0) + (weights[id] || 1);
    }
    let dominantCode = 0;
    let maxVote = -1;
    for (const [code, vote] of Object.entries(codeVotes)) {
      if (vote > maxVote) {
        maxVote = vote;
        dominantCode = parseInt(code, 10);
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

    // Smart resolver ensures that high rain probability or rain volume ALWAYS has a matching rain icon & label!
    const weatherInfo = resolveSmartWeatherInfo(dominantCode, consensusProb, consensusPrecip);

    return {
      ...hour,
      consensus: {
        temperature: weightedTemp,
        medianTemperature: medianTemp,
        tempSpread,
        minTemp,
        maxTemp,
        precipitationProbability: consensusProb,
        precipitation: consensusPrecip,
        probSpread,
        weatherCode: dominantCode,
        weatherLabel: weatherInfo.label,
        weatherIcon: weatherInfo.icon,
        weatherEmoji: weatherInfo.emoji,
        isRain: weatherInfo.isRain,
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
export function generateDailySummary(dayHours, dateStr) {
  if (!dayHours || dayHours.length === 0) return null;

  const validHours = dayHours.filter((h) => h.consensus);
  if (validHours.length === 0) return null;

  const temps = validHours.map((h) => h.consensus.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  const rainHours = validHours.filter((h) => h.consensus.precipitationProbability >= 40 || h.consensus.precipitation >= 0.15);
  const maxRainProb = Math.max(...validHours.map((h) => h.consensus.precipitationProbability));
  const totalRain = Math.round(validHours.reduce((sum, h) => sum + (h.consensus.precipitation || 0), 0) * 10) / 10;

  const avgAgreement = Math.round(validHours.reduce((sum, h) => sum + h.consensus.agreementScore, 0) / validHours.length);

  // Peak rain window
  let rainWindow = null;
  if (rainHours.length > 0) {
    const startHour = rainHours[0].hourLabel;
    const endHour = rainHours[rainHours.length - 1].hourLabel;
    rainWindow = startHour === endHour ? `around ${startHour}` : `between ${startHour} and ${endHour}`;
  }

  // Divergent hours
  const divergentHours = validHours.filter((h) => h.consensus.isDivergent);

  // Determine true dominant daily icon & condition that tells the story
  let dailyCondition = 'Partly Cloudy';
  let dailyIcon = 'CloudSun';
  let dailyEmoji = '⛅';

  if (maxRainProb >= 70 || totalRain >= 2.0) {
    dailyCondition = totalRain >= 5.0 ? 'Heavy Rain Downpours' : 'Rain Showers';
    dailyIcon = 'CloudRain';
    dailyEmoji = '🌧️';
  } else if (maxRainProb >= 40 || totalRain >= 0.4) {
    dailyCondition = 'Light Rain / Showers';
    dailyIcon = 'CloudRain';
    dailyEmoji = '🌦️';
  } else if (maxRainProb >= 25) {
    dailyCondition = 'Passing Drizzle';
    dailyIcon = 'CloudDrizzle';
    dailyEmoji = '🌦️';
  } else if (validHours.filter((h) => h.consensus.weatherCode === 3).length > 10) {
    dailyCondition = 'Overcast';
    dailyIcon = 'Cloud';
    dailyEmoji = '☁️';
  } else {
    dailyCondition = 'Mainly Clear';
    dailyIcon = 'Sun';
    dailyEmoji = '☀️';
  }

  // Natural language summary
  let description = '';
  if (totalRain >= 10.0 || maxRainProb >= 85) {
    description = `Substantial rainfall expected ${rainWindow}. Peak precipitation probability is ${maxRainProb}% with up to ${totalRain} mm expected. Heavy downpours possible.`;
  } else if (rainHours.length > 0) {
    description = `Showers expected ${rainWindow}. Peak rain chance is ${maxRainProb}% with ~${totalRain} mm total volume.`;
  } else if (maxRainProb < 20) {
    description = `Largely dry and settled conditions throughout the day. High model consensus (${avgAgreement}%) with low chance of rain.`;
  } else {
    description = `Overcast with isolated chance (${maxRainProb}%) of passing drizzle. High of ${maxTemp}°C.`;
  }

  return {
    date: dateStr,
    minTemp,
    maxTemp,
    maxRainProb,
    totalRain,
    avgAgreement,
    rainWindow,
    hasRain: rainHours.length > 0,
    divergentCount: divergentHours.length,
    dailyCondition,
    dailyIcon,
    dailyEmoji,
    description,
  };
}
