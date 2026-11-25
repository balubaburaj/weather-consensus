import { formatTemp, formatWind, formatTime } from '../utils/units';

/**
 * Weather Narrative Engine (Intelligent, Time-Aware)
 * 
 * Generates natural, human-intelligible weather stories tailored specifically
 * to the exact time of day a person is looking at the screen:
 *   - Early Morning (5 AM - 8:59 AM): Morning commute, frost/chill, day ahead preview.
 *   - Mid-Day / Afternoon (9 AM - 4:59 PM): Peak temperatures, afternoon sun, evening commute preview.
 *   - Evening (5 PM - 8:59 PM): Dinner & sunset, evening chill, overnight outlook.
 *   - Night / Late Night (9 PM - 4:59 AM): Overnight lows, frost/dew, wake-up & tomorrow morning forecast.
 * 
 * Strict Reality Rules:
 *   - NEVER recommend sunglasses, sun glare, or hanging washing out at night or after sunset!
 *   - Rest of day / tomorrow morning transitions are dynamically computed across the next 18 hours.
 */

function getLocalHour(current) {
  if (current?.time && typeof current.time === 'string' && current.time.includes('T')) {
    const parts = current.time.split('T')[1].split(':');
    const h = parseInt(parts[0], 10);
    if (!isNaN(h)) return h;
  }
  return new Date().getHours();
}

function getTimePeriod(hour) {
  if (hour >= 5 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night'; // 21:00 (9 PM) to 04:59 AM
}

function getWindCategory(speedKmh) {
  if (speedKmh === null || speedKmh === undefined || speedKmh < 8) {
    return { level: 'calm', text: 'barely a breeze', isNotable: false };
  }
  if (speedKmh < 18) {
    return { level: 'light', text: 'a gentle breeze', isNotable: false };
  }
  if (speedKmh < 30) {
    return { level: 'fresh', text: 'a fresh Atlantic breeze', isNotable: true };
  }
  if (speedKmh < 48) {
    return { level: 'blustery', text: 'a strong blustery wind', isNotable: true };
  }
  return { level: 'gale', text: 'gale-force gusts', isNotable: true };
}

function getCurrentFeelCondition(weatherCode, precip, isDay) {
  const isWet = precip > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode);

  if (isWet) {
    if (precip >= 2.5 || [65, 82].includes(weatherCode)) {
      return {
        type: 'heavy_rain',
        narrativeText: 'driving rain',
        shortText: 'Driving rain',
        irishText: 'lashing rain that would soak through stone',
        isWet: true,
      };
    }
    if (precip >= 0.7 || [61, 63, 80, 81].includes(weatherCode)) {
      return {
        type: 'steady_rain',
        narrativeText: 'steady rain',
        shortText: 'Steady rain',
        irishText: 'proper rain that will soak your jumper',
        isWet: true,
      };
    }
    return {
      type: 'mizzle',
      narrativeText: 'light mizzle and damp air',
      shortText: 'Light mizzle',
      irishText: 'fine misty mizzle that slowly wets you through',
      isWet: true,
    };
  }

  // Dry conditions
  if (weatherCode === 0 || weatherCode === 1) {
    return {
      type: 'clear',
      narrativeText: isDay ? 'bright sunshine and clear skies' : 'crisp, clear night skies',
      shortText: isDay ? 'Sunny & clear' : 'Clear night',
      irishText: isDay ? 'grand bright sun' : 'clear starlit skies',
      isWet: false,
    };
  }
  if (weatherCode === 2) {
    return {
      type: 'partly_cloudy',
      narrativeText: isDay ? 'sunny spells breaking through broken cloud' : 'patchy cloud under quiet skies',
      shortText: isDay ? 'Sunny spells' : 'Partly cloudy',
      irishText: isDay ? 'fair sunny spells breaking through' : 'scattered clouds',
      isWet: false,
    };
  }
  if (weatherCode === 3) {
    return {
      type: 'overcast',
      narrativeText: isDay ? 'flat grey cloud cover' : 'overcast night skies',
      shortText: 'Dull overcast',
      irishText: isDay ? 'grey overcast skies hanging low' : 'dull overcast night',
      isWet: false,
    };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      type: 'fog',
      narrativeText: isDay ? 'dense mist and low visibility' : 'mist and patchy fog settling in',
      shortText: 'Misty fog',
      irishText: 'thick sea fog rolling across the hills',
      isWet: false,
    };
  }

  return {
    type: 'cloudy',
    narrativeText: isDay ? 'overcast skies' : 'cloudy night skies',
    shortText: 'Overcast',
    irishText: 'dull cloud',
    isWet: false,
  };
}

/**
 * Scan subsequent hours (up to 18 hours ahead) to detect the most meaningful next transition
 * using city-local date/hour strings (never browser local Date clock).
 */
function detectIntelligentShift({
  upcomingHours,
  isCurrentlyWet,
  currentTemp,
  todayCityDate,
  timePeriod,
  timeFormat,
  unit,
}) {
  if (!upcomingHours || upcomingHours.length === 0) {
    if (timePeriod === 'night') {
      return {
        summary: 'Conditions remain steady overnight with no rain expected.',
        laterTitle: 'TOMORROW MORNING',
        laterCopy: 'Holding steady and dry overnight with a cool start tomorrow morning.',
        footerLabel: 'Outlook',
        footerValue: 'Tomorrow',
        shiftTime: 'Dawn',
        hasRain: false,
      };
    }
    return {
      summary: 'Holding steady and dry through the hours ahead.',
      laterTitle: 'LATER',
      laterCopy: 'Holding steady with no sudden shifts through the hours ahead.',
      footerLabel: 'Rest of day',
      footerValue: 'Tonight',
      shiftTime: null,
      hasRain: false,
    };
  }

  // 1. Rain Shift Detection
  if (!isCurrentlyWet) {
    for (let i = 0; i < upcomingHours.length; i++) {
      const h = upcomingHours[i];
      const consensus = h.consensus || {};
      const prob = consensus.precipitationProbability || 0;
      const precip = consensus.precipitation || 0;

      if (prob >= 40 || precip >= 0.2) {
        const timeStr = formatTime(h.hourLabel || h.timeIso, timeFormat, false);
        const hDate = h.date || (h.timeIso ? h.timeIso.split('T')[0] : null);
        const isTomorrow = todayCityDate && hDate ? hDate !== todayCityDate : false;
        const timeLabel = isTomorrow ? `tomorrow around ${timeStr}` : `around ${timeStr}`;

        let rainType = 'steady rain';
        if (precip >= 2.0 || prob >= 75) rainType = 'heavy rain';
        else if (precip < 0.5 && prob < 55) rainType = 'passing showers';

        const laterTitle = timePeriod === 'night' ? 'RAIN INCOMING' : (timePeriod === 'morning' ? 'THIS AFTERNOON' : 'LATER TODAY');

        return {
          summary: `Dry right now, but ${rainType} arrives ${timeLabel} (${prob}% chance).`,
          laterTitle,
          laterCopy: `${prob}% chance of ${rainType} arriving ${timeLabel} — plan outdoor trips before then or pack rain gear.`,
          footerLabel: 'Rain arrival',
          footerValue: `@ ${timeStr}`,
          shiftTime: timeStr,
          hasRain: true,
        };
      }
    }
  }

  // 2. If currently wet, scan for clearing
  if (isCurrentlyWet) {
    let clearIdx = -1;
    for (let i = 0; i < upcomingHours.length; i++) {
      const h = upcomingHours[i];
      const prob = h.consensus?.precipitationProbability || 0;
      const precip = h.consensus?.precipitation || 0;
      if (prob < 25 && precip < 0.1) {
        clearIdx = i;
        break;
      }
    }

    if (clearIdx !== -1) {
      const clearHour = upcomingHours[clearIdx];
      const clearTime = formatTime(clearHour.hourLabel || clearHour.timeIso, timeFormat, false);
      const isNight = timePeriod === 'night' || timePeriod === 'evening';

      return {
        summary: `Rain eases off around ${clearTime}, drying out ${isNight ? 'overnight' : 'later'}.`,
        laterTitle: isNight ? 'CLEARING OVERNIGHT' : 'CLEARING LATER',
        laterCopy: `Wet spell ends around ${clearTime}, staying dry afterwards.`,
        footerLabel: 'Rain clears',
        footerValue: `@ ${clearTime}`,
        shiftTime: clearTime,
        hasRain: false,
      };
    }

    return {
      summary: 'Periods of rain look set to stick around for the next several hours.',
      laterTitle: timePeriod === 'night' ? 'WET NIGHT AHEAD' : 'STAYING WET',
      laterCopy: 'Ongoing showers expected over the coming hours — no clear dry window yet.',
      footerLabel: 'Outlook',
      footerValue: 'Wet spell',
      shiftTime: null,
      hasRain: true,
    };
  }

  // 3. Temperature extrema (Overnight Low or Daytime Peak)
  if (timePeriod === 'night' || timePeriod === 'evening') {
    let minT = 999;
    let minHour = null;
    upcomingHours.slice(0, 10).forEach((h) => {
      const t = h.consensus?.temperature !== undefined ? h.consensus.temperature : h.actual?.temperature;
      if (t !== undefined && t !== null && t < minT) {
        minT = t;
        minHour = h;
      }
    });

    if (minHour) {
      const minTime = formatTime(minHour.hourLabel || minHour.timeIso, timeFormat, false);
      const minFmt = formatTemp(minT, unit);

      const morningHour = upcomingHours.find((h) => {
        const hh = h.timeIso && h.timeIso.includes('T')
          ? parseInt(h.timeIso.split('T')[1], 10)
          : new Date(h.timeIso).getHours();
        return hh >= 8 && hh <= 10;
      });
      const mornT = morningHour?.consensus?.temperature !== undefined
        ? morningHour.consensus.temperature
        : (morningHour?.actual?.temperature ?? minT + 1);
      const mornFmt = formatTemp(mornT, unit);

      return {
        summary: `Staying dry overnight, dipping to ${minFmt} near ${minTime} with a ${mornFmt} start tomorrow.`,
        laterTitle: 'TOMORROW MORNING',
        laterCopy: `Overnight low of ${minFmt} near ${minTime}, starting dry and cool around ${mornFmt} tomorrow morning.`,
        footerLabel: 'Overnight low',
        footerValue: `${minFmt} @ ${minTime}`,
        shiftTime: minTime,
        hasRain: false,
      };
    }
  }

  // Daytime: scan for afternoon peak
  let maxT = -999;
  let maxHour = null;
  upcomingHours.slice(0, 10).forEach((h) => {
    const t = h.consensus?.temperature !== undefined ? h.consensus.temperature : h.actual?.temperature;
    if (t !== undefined && t !== null && t > maxT) {
      maxT = t;
      maxHour = h;
    }
  });

  if (maxHour && maxT - currentTemp >= 2.5 && (timePeriod === 'morning' || timePeriod === 'early_morning')) {
    const maxTime = formatTime(maxHour.hourLabel || maxHour.timeIso, timeFormat, false);
    const maxFmt = formatTemp(maxT, unit);
    const maxCloud = maxHour.consensus?.cloudCover ?? maxHour.actual?.cloudCover ?? 50;
    const isClearWarmup = maxCloud < 45 && (maxHour.consensus?.weatherCode ?? 2) <= 2;
    return {
      summary: `Dry through the day, warming up to ${maxFmt} around ${maxTime}.`,
      laterTitle: 'THIS AFTERNOON',
      laterCopy: `${isClearWarmup ? 'Brightening and warming' : 'Warming'} to a high of ${maxFmt} around ${maxTime}, staying dry.`,
      footerLabel: 'Afternoon peak',
      footerValue: `${maxFmt} @ ${maxTime}`,
      shiftTime: maxTime,
      hasRain: false,
    };
  }

  // Default holding steady
  if (timePeriod === 'night') {
    return {
      summary: 'Dry and steady right through dawn.',
      laterTitle: 'TOMORROW MORNING',
      laterCopy: 'Dry and steady overnight with no rain before morning.',
      footerLabel: 'Overnight outlook',
      footerValue: 'Dry & Steady',
      shiftTime: null,
      hasRain: false,
    };
  }

  if (timePeriod === 'evening') {
    return {
      summary: 'Staying dry and settled through the evening.',
      laterTitle: 'OVERNIGHT',
      laterCopy: 'Dry and calm this evening; no rain expected tonight.',
      footerLabel: 'Evening shift',
      footerValue: 'Dry & Calm',
      shiftTime: null,
      hasRain: false,
    };
  }

  return {
    summary: 'Staying dry with steady conditions through the evening.',
    laterTitle: 'LATER TODAY',
    laterCopy: 'Dry and steady through the rest of the day — safe for outdoor plans.',
    footerLabel: 'Rest of day',
    footerValue: 'Dry & Steady',
    shiftTime: null,
    hasRain: false,
  };
}

/**
 * Slot 4 / Card 3: Concrete Action Guide — tells someone walking out the door exactly what to wear & bring
 */
function getIntelligentAdvice({
  currentTemp,
  feelsLike,
  windSpeed,
  weatherCode,
  cloudCover,
  isCurrentlyWet,
  isDay,
  timePeriod,
  nextShift,
}) {
  const isNightOrEvening = timePeriod === 'night' || timePeriod === 'evening' || !isDay;
  const rainLater = !isCurrentlyWet && nextShift.hasRain;
  const isGusty = windSpeed >= 25;
  const isBrightSunny = isDay && !isCurrentlyWet && weatherCode <= 1 && (cloudCover === null || cloudCover < 45);
  const isFreezing = feelsLike <= 2;
  const isCold = feelsLike <= 8;
  const isCool = feelsLike <= 14;
  const isMild = feelsLike <= 21;

  // Base outerwear recommendation by Feels-Like temperature
  let coatAction = 'dress in a light shirt or t-shirt';
  let coatLabel = 'Breathable clothes';
  if (isCurrentlyWet && isGusty) {
    coatAction = isCold ? 'put on a warm hooded waterproof jacket' : 'wear a hooded waterproof shell';
    coatLabel = isCold ? 'Warm hooded waterproof coat' : 'Hooded waterproof jacket';
  } else if (isCurrentlyWet) {
    coatAction = isCold ? 'wear a warm waterproof coat' : 'wear a light rain jacket';
    coatLabel = isCold ? 'Warm waterproof coat' : 'Waterproof jacket';
  } else if (isFreezing) {
    coatAction = 'bundle up in a heavy winter coat, warm jumper, and beanie';
    coatLabel = 'Heavy winter coat + beanie';
  } else if (isCold) {
    coatAction = 'wear a proper warm coat or padded jacket';
    coatLabel = 'Warm coat + mid-layer';
  } else if (isCool) {
    coatAction = 'wear a medium jacket or fleece layer';
    coatLabel = 'Medium jacket / fleece';
  } else if (isMild) {
    coatAction = 'a light overshirt or sweater is plenty';
    coatLabel = 'Light layer / overshirt';
  }

  // Umbrella / Frost / Glare extras
  const gearExtras = [];
  let headsUpTitle = 'WHAT TO WEAR & BRING';
  let footerValue = 'Go-out guide';

  if (isCurrentlyWet) {
    if (isGusty) {
      gearExtras.push('leave the umbrella behind (wind is too strong for one)');
      headsUpTitle = 'WIND & RAIN GEAR';
      footerValue = 'Hood up • No brolly';
    } else {
      gearExtras.push('take an umbrella');
      headsUpTitle = 'RAIN GEAR NEEDED';
      footerValue = 'Take umbrella';
    }
  } else if (rainLater) {
    gearExtras.push(`pack a compact umbrella for ${nextShift.shiftTime || 'rain later'}`);
    headsUpTitle = 'PACK FOR RAIN LATER';
    footerValue = `Brolly by ${nextShift.shiftTime || 'later'}`;
  } else if (isFreezing) {
    gearExtras.push('no umbrella needed, but watch for frost or slick pavements');
    headsUpTitle = isNightOrEvening ? 'FROST WATCH & COAT' : 'FREEZING & FROST RISK';
    footerValue = 'Heavy coat • Frost';
  } else if (isBrightSunny) {
    gearExtras.push('no umbrella needed — grab sunglasses for direct sun');
    headsUpTitle = 'SUNNY & CLEAR PLANS';
    footerValue = isCold ? 'Coat + sunglasses' : 'Sunglasses • No rain';
  } else if (isNightOrEvening) {
    gearExtras.push('no umbrella needed');
    headsUpTitle = isCold ? 'CHILLY NIGHT LAYERS' : 'QUIET NIGHT PLANS';
    footerValue = isCold ? 'Warm coat • Dry' : 'Light layer • Dry';
  } else {
    gearExtras.push('no umbrella needed');
    headsUpTitle = isCold ? 'COLD & DRY LAYERS' : 'GOOD OUTDOOR PLANS';
    footerValue = isCold ? 'Warm coat • Dry' : 'No rain gear';
  }

  const heroAdvice = `${coatAction}${gearExtras.length ? `, and ${gearExtras[0]}` : ''}`;
  const headsUpText = `${coatLabel}. ${gearExtras.length ? gearExtras[0].charAt(0).toUpperCase() + gearExtras[0].slice(1) + '.' : 'Conditions look straightforward.'}`;

  return {
    heroAdvice,
    coatLabel,
    headsUpTitle,
    headsUpText,
    footerLabel: 'Going outside',
    footerValue,
  };
}

/**
 * Main Generator Function
 */
export function generateWeatherNarrative({
  current,
  hourlyHours,
  dailySummary,
  selectedCity,
  unit = 'C',
  timeFormat = '24h',
}) {
  if (!current) return null;

  const currentHour = getLocalHour(current);
  const timePeriod = getTimePeriod(currentHour);
  const currentHourObj = hourlyHours?.find((h) => h.isCurrent) || hourlyHours?.[0];
  const cConsensus = currentHourObj?.consensus;

  const temp = Math.round(current.temperature * 10) / 10;
  const rawFeels = current.apparentTemperature !== null && current.apparentTemperature !== undefined
    ? current.apparentTemperature
    : temp;
  const feelsLike = Math.round(rawFeels * 10) / 10;
  const gap = Math.abs(temp - feelsLike);
  const includeFeels = gap >= 1.8;

  const windSpeed = current.windSpeed ?? cConsensus?.windSpeed ?? 0;
  const rawCode = current.weatherCode ?? cConsensus?.weatherCode ?? 2;
  const precip = current.precipitation ?? 0;
  const isDay = current.isDay !== undefined ? Boolean(current.isDay) : (currentHour >= 8 && currentHour < 17);
  const effectiveCloud = current.cloudCover ?? cConsensus?.cloudCover ?? null;

  // Reconcile clear codes against cloud cover so story never calls an overcast day sunny
  let weatherCode = rawCode;
  if (weatherCode <= 3 && precip === 0 && effectiveCloud !== null) {
    if (effectiveCloud >= 80 && weatherCode < 3) weatherCode = 3;
    else if (effectiveCloud >= 45 && weatherCode < 2) weatherCode = 2;
    else if (effectiveCloud >= 25 && weatherCode === 0) weatherCode = 1;
  }

  const wind = getWindCategory(windSpeed);
  const cond = getCurrentFeelCondition(weatherCode, precip, isDay);
  const isCurrentlyWet = cond.isWet;

  // Extract upcoming 18 hours starting from current
  let upcomingHours = [];
  if (hourlyHours && hourlyHours.length > 0) {
    const currentIdx = hourlyHours.findIndex((h) => h.isCurrent);
    if (currentIdx !== -1) {
      upcomingHours = hourlyHours.slice(currentIdx + 1, currentIdx + 18);
    } else {
      upcomingHours = hourlyHours.filter((h) => !h.isPast).slice(1, 18);
    }
  }

  const todayCityDate = current.time && current.time.includes('T')
    ? current.time.split('T')[0]
    : currentHourObj?.date || null;

  const formattedTemp = formatTemp(temp, unit);
  const formattedFeels = formatTemp(feelsLike, unit);

  // Shift & Action Advice Analysis
  const nextShift = detectIntelligentShift({
    upcomingHours,
    isCurrentlyWet,
    currentTemp: temp,
    todayCityDate,
    timePeriod,
    timeFormat,
    unit,
  });

  const advice = getIntelligentAdvice({
    currentTemp: temp,
    feelsLike,
    windSpeed,
    weatherCode,
    cloudCover: effectiveCloud,
    isCurrentlyWet,
    isDay,
    timePeriod,
    nextShift,
  });

  // Dynamic Sub-header based on time period
  const cityName = selectedCity?.name || 'Local Area';
  let subHeader = `${cityName} • Step-Outside Guide`;
  if (timePeriod === 'early_morning') subHeader = `${cityName} • Morning Commute & Day Ahead`;
  else if (timePeriod === 'morning') subHeader = `${cityName} • Morning into Afternoon Guide`;
  else if (timePeriod === 'afternoon') subHeader = `${cityName} • Afternoon & Evening Guide`;
  else if (timePeriod === 'evening') subHeader = `${cityName} • This Evening & Tonight`;
  else if (timePeriod === 'night') subHeader = `${cityName} • Tonight through Tomorrow Morning`;

  // ----------------------------------------------------
  // Option 1: Natural & Action-First Going-Outside Story
  // ----------------------------------------------------
  const feelsPhrase = includeFeels ? ` (feels closer to ${formattedFeels} in ${wind.text})` : '';
  const leadAction = advice.heroAdvice.charAt(0).toUpperCase() + advice.heroAdvice.slice(1);

  let conditionLine = '';
  if (timePeriod === 'night') {
    if (isCurrentlyWet) {
      conditionLine = `Wet outside tonight at ${formattedTemp}${feelsPhrase} with ${cond.narrativeText}.`;
    } else if (wind.level === 'gale' || wind.level === 'blustery') {
      conditionLine = `Blustery out tonight at ${formattedTemp}${feelsPhrase} under ${cond.narrativeText}.`;
    } else {
      conditionLine = `Quiet and dry outside tonight at ${formattedTemp}${feelsPhrase} under ${cond.narrativeText}.`;
    }
  } else if (timePeriod === 'early_morning') {
    conditionLine = `It’s a crisp ${formattedTemp}${feelsPhrase} early this morning under ${cond.narrativeText}.`;
  } else if (timePeriod === 'morning') {
    conditionLine = `It’s ${formattedTemp}${feelsPhrase} this morning with ${cond.narrativeText}.`;
  } else if (timePeriod === 'afternoon') {
    conditionLine = `It’s ${formattedTemp}${feelsPhrase} this afternoon under ${cond.narrativeText}.`;
  } else {
    conditionLine = `It’s ${formattedTemp}${feelsPhrase} this evening under ${cond.narrativeText}.`;
  }

  const naturalHero = `${leadAction}. ${conditionLine} ${nextShift.summary}`;

  // ----------------------------------------------------
  // Option 2: 3-Second Commuter Glance
  // ----------------------------------------------------
  const glanceHeader = includeFeels ? `${formattedTemp} (feels ${formattedFeels})` : formattedTemp;
  const commuterGlance = `${glanceHeader} · ${cond.shortText}${wind.isNotable ? ` & ${wind.level}` : ''}. ${advice.headsUpText} ${nextShift.laterCopy}`;

  // ----------------------------------------------------
  // Option 3: Irish-Flavoured Local Expression
  // ----------------------------------------------------
  let irishTitle = 'Fresh and brisk';
  if (isCurrentlyWet && windSpeed >= 30) irishTitle = 'Turning wild out there';
  else if (isCurrentlyWet) irishTitle = 'Soft wet day out there';
  else if (isDay && !isCurrentlyWet && feelsLike >= 13 && (effectiveCloud === null || effectiveCloud < 55)) irishTitle = 'Grand drying weather';
  else if (feelsLike <= 3) irishTitle = 'Biting raw cold';
  else if (timePeriod === 'night') irishTitle = wind.level === 'blustery' || wind.level === 'gale' ? 'Breezy, chilly night' : 'Quiet, chilly night';
  else if (isDay && weatherCode <= 1 && (effectiveCloud === null || effectiveCloud < 35)) irishTitle = 'Grand bright spell';

  const irishNarrative = `${irishTitle}. Sure ${advice.heroAdvice}! It’s ${formattedTemp} out${includeFeels ? ` (feels like ${formattedFeels} in the breeze)` : ''} with ${cond.irishText}. ${nextShift.summary}`;

  // ----------------------------------------------------
  // Option 4: Intelligible 3 Micro-Cards (What It Feels Like / Shift / What to Bring)
  // ----------------------------------------------------
  let nowTitle = 'STEPPING OUT NOW';
  if (timePeriod === 'night') nowTitle = 'OUTSIDE TONIGHT';
  else if (timePeriod === 'evening') nowTitle = 'OUT THIS EVENING';
  else if (timePeriod === 'early_morning') nowTitle = 'EARLY COMMUTE';

  const nowField = `${glanceHeader} — ${cond.shortText}${wind.isNotable ? ` with ${wind.text}` : ''}.`;
  const laterField = nextShift.laterCopy;
  const headsUpField = advice.headsUpText;

  return {
    cityName,
    subHeader,
    temperature: formattedTemp,
    feelsLike: formattedFeels,
    hasFeelsGap: includeFeels,
    windSummary: wind.text,
    conditionShort: cond.shortText,
    irishTitle,
    naturalHero,
    commuterGlance,
    irishNarrative,
    microFields: {
      nowTitle,
      now: nowField,
      nowFooterLabel: 'Real-feel outside',
      nowFooterValue: includeFeels ? `Feels ${formattedFeels}` : formattedTemp,

      laterTitle: nextShift.laterTitle,
      later: laterField,
      laterFooterLabel: nextShift.footerLabel,
      laterFooterValue: nextShift.footerValue,

      headsUpTitle: advice.headsUpTitle,
      headsUp: headsUpField,
      headsUpFooterLabel: advice.footerLabel,
      headsUpFooterValue: advice.footerValue,
    },
    nextShiftMeta: {
      found: Boolean(nextShift.shiftTime),
      time: nextShift.shiftTime,
    },
  };
}
