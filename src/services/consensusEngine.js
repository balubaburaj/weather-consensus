import { WEATHER_PROVIDERS, PROVIDER_KEYS, getWeatherInfo, resolveSmartWeatherInfo, getRainHumanType } from '../constants/providers';

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

    // Smart resolver ensures that icons & human labels match reality
    const weatherInfo = resolveSmartWeatherInfo(dominantCode, consensusProb, consensusPrecip);
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
  const maxHourlyRain = Math.max(...validHours.map((h) => h.consensus.precipitation || 0));

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

  // Peak rain human classification
  const peakRainType = getRainHumanType(maxHourlyRain, maxRainProb, 0);

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
  } else if (maxRainProb >= 25 || totalRain > 0) {
    dailyCondition = 'Fine Misting Drizzle ("Soft Day")';
    dailyIcon = 'CloudDrizzle';
    dailyEmoji = '🌦️';
  } else if (validHours.filter((h) => h.consensus.weatherCode === 3).length > 10) {
    dailyCondition = 'Overcast / Grey Sky';
    dailyIcon = 'Cloud';
    dailyEmoji = '☁️';
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
    description = `Dry and settled conditions throughout the day. High model consensus (${avgAgreement}%) with low chance of rain.`;
  } else {
    description = `Overcast with isolated chance (${maxRainProb}%) of passing fine drizzle. High of ${maxTemp}°C.`;
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
