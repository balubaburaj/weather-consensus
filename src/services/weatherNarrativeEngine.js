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
 */
function detectIntelligentShift({
  upcomingHours,
  isCurrentlyWet,
  currentTemp,
  timePeriod,
  timeFormat,
  unit,
}) {
  if (!upcomingHours || upcomingHours.length === 0) {
    if (timePeriod === 'night') {
      return {
        summary: 'Conditions will remain quiet and dry overnight.',
        laterTitle: 'TOMORROW MORNING',
        laterCopy: 'Holding steady and dry overnight with a cool start tomorrow morning.',
        footerLabel: 'Outlook',
        footerValue: 'Tomorrow',
        shiftTime: 'Dawn',
      };
    }
    return {
      summary: 'Holding steady and dry through the hours ahead.',
      laterTitle: 'LATER',
      laterCopy: 'Holding steady with no sudden shifts through the hours ahead.',
      footerLabel: 'Rest of day',
      footerValue: 'Tonight',
      shiftTime: null,
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
        const isTomorrow = i > 4 && (new Date(h.timeIso).getDate() !== new Date().getDate());
        const timeLabel = isTomorrow ? `tomorrow around ${timeStr}` : `around ${timeStr}`;

        let rainType = 'steady rain';
        if (precip >= 2.0 || prob >= 75) rainType = 'heavy driving rain';
        else if (precip < 0.5 && prob < 55) rainType = 'passing showers';

        const laterTitle = timePeriod === 'night' ? 'RAIN INCOMING' : (timePeriod === 'morning' ? 'THIS AFTERNOON' : 'LATER TODAY');

        return {
          summary: `Dry for now, though ${rainType} is expected ${timeLabel} (${prob}% chance).`,
          laterTitle,
          laterCopy: `${prob}% chance of ${rainType} arriving ${timeLabel}.`,
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
        summary: `Rain eases off around ${clearTime}, clearing to dry ${isNight ? 'conditions overnight' : 'weather later'}.`,
        laterTitle: isNight ? 'CLEARING OVERNIGHT' : 'CLEARING LATER',
        laterCopy: `Rain easing off by ${clearTime}, holding dry afterwards.`,
        footerLabel: 'Rain clears',
        footerValue: `@ ${clearTime}`,
        shiftTime: clearTime,
        hasRain: false,
      };
    }
  }

  // 3. Temperature extrema (Overnight Low or Daytime Peak)
  if (timePeriod === 'night' || timePeriod === 'evening') {
    // Find overnight low (between now and 7 AM)
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

      // Also check tomorrow morning (around 8-9 AM)
      const morningHour = upcomingHours.find((h) => {
        const d = new Date(h.timeIso);
        return d.getHours() >= 8 && d.getHours() <= 10;
      });
      const mornT = morningHour?.consensus?.temperature !== undefined ? morningHour.consensus.temperature : (morningHour?.actual?.temperature || minT + 2);
      const mornFmt = formatTemp(mornT, unit);

      return {
        summary: `Staying dry through tonight, dropping to an overnight low of ${minFmt} around ${minTime}. Tomorrow morning starts cool at ${mornFmt}.`,
        laterTitle: 'TOMORROW MORNING',
        laterCopy: `Overnight low of ${minFmt} near ${minTime}. Tomorrow starts cool and dry around ${mornFmt}.`,
        footerLabel: 'Overnight low',
        footerValue: `${minFmt} @ ${minTime}`,
        shiftTime: minTime,
      };
    }
  }

  // Daytime: scan for afternoon peak or evening drop
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
    return {
      summary: `Warming to a high of ${maxFmt} around ${maxTime} and holding dry through the afternoon.`,
      laterTitle: 'THIS AFTERNOON',
      laterCopy: `Brightening and warming to a high of ${maxFmt} around ${maxTime}.`,
      footerLabel: 'Afternoon peak',
      footerValue: `${maxFmt} @ ${maxTime}`,
      shiftTime: maxTime,
    };
  }

  // Default holding steady
  if (timePeriod === 'night') {
    return {
      summary: 'Holding dry and steady overnight with quiet conditions through dawn.',
      laterTitle: 'TOMORROW MORNING',
      laterCopy: 'Dry and steady through the night; cool start expected tomorrow morning.',
      footerLabel: 'Overnight outlook',
      footerValue: 'Steady',
      shiftTime: null,
    };
  }

  if (timePeriod === 'evening') {
    return {
      summary: 'Holding dry and steady through the evening with temperatures easing gradually.',
      laterTitle: 'OVERNIGHT',
      laterCopy: 'Dry and calm through bedtime, with overnight lows holding steady.',
      footerLabel: 'Evening shift',
      footerValue: 'Tonight',
      shiftTime: null,
    };
  }

  return {
    summary: 'Staying dry and holding steady through the afternoon and evening.',
    laterTitle: 'LATER TODAY',
    laterCopy: 'Holding steady with no significant shifts expected through the evening.',
    footerLabel: 'Rest of day',
    footerValue: 'Steady',
    shiftTime: null,
  };
}

/**
 * Slot 4 / Card 3: Intelligible, Time-Aware Practical Gear & Safety Advice
 */
function getIntelligentAdvice({
  currentTemp,
  feelsLike,
  windSpeed,
  isCurrentlyWet,
  isDay,
  timePeriod,
  nextShift,
}) {
  const isNightOrEvening = timePeriod === 'night' || timePeriod === 'evening' || !isDay;
  const willRain = isCurrentlyWet || nextShift.hasRain;

  // 1. NIGHT & LATE EVENING ADVICE (STRICT: ZERO SUNGLASSES / ZERO SUN GLARE)
  if (isNightOrEvening) {
    if (willRain && windSpeed >= 25) {
      return {
        heroAdvice: 'bring a waterproof hooded coat if heading out—too gusty for umbrellas',
        headsUpTitle: 'NIGHT GEAR',
        headsUpText: 'Gusty wet conditions tonight. A waterproof hooded jacket is essential if stepping out.',
        footerLabel: 'Tonight',
        footerValue: 'Rain & Gusts',
      };
    }
    if (willRain) {
      return {
        heroAdvice: 'an umbrella or light raincoat is recommended if you are stepping out',
        headsUpTitle: 'WET WEATHER',
        headsUpText: 'Showers expected tonight. Keep an umbrella near the door if heading outside.',
        footerLabel: 'Tonight',
        footerValue: 'Wet paths',
      };
    }
    if (feelsLike <= 2) {
      return {
        heroAdvice: 'bundle up warmly if heading out, and watch for frost or icy patches late',
        headsUpTitle: 'FROST ALERT',
        headsUpText: 'Freezing night ahead. Heavy coat needed; watch for windscreen frost and slippery steps by morning.',
        footerLabel: 'Overnight & morning',
        footerValue: 'Frost risk',
      };
    }
    if (feelsLike <= 8) {
      return {
        heroAdvice: 'a warm coat is needed if you are out tonight, with a chilly start tomorrow',
        headsUpTitle: 'CHILLY NIGHT',
        headsUpText: 'Cold night ahead. A proper warm jacket is recommended if stepping outside; keep layers ready for tomorrow.',
        footerLabel: 'Overnight & morning',
        footerValue: 'Warm layers',
      };
    }
    return {
      heroAdvice: 'a comfortable jacket is plenty if stepping out tonight',
      headsUpTitle: 'QUIET NIGHT',
      headsUpText: 'Comfortable, quiet night conditions. A standard evening layer is all you need.',
      footerLabel: 'Tonight',
      footerValue: 'Mild & dry',
    };
  }

  // 2. DAYTIME ADVICE (Morning / Afternoon)
  if (willRain && windSpeed >= 25) {
    return {
      heroAdvice: 'leave the umbrella at home and grab a hooded waterproof shell',
      headsUpTitle: 'COMMUTE ADVICE',
      headsUpText: 'Too blustery for umbrellas today; a hooded waterproof jacket is essential on your commute.',
      footerLabel: 'For the commute',
      footerValue: 'Wind & Rain',
    };
  }

  if (willRain) {
    return {
      heroAdvice: 'keep an umbrella handy and slip on a water-resistant layer',
      headsUpTitle: 'RAIN GEAR',
      headsUpText: 'Rain showers in the area today. Keep a compact brolly in your bag for your trips out.',
      footerLabel: 'Today',
      footerValue: 'Bring brolly',
    };
  }

  if (feelsLike <= 2) {
    return {
      heroAdvice: 'watch for frost or black ice on shaded pavements and bundle up',
      headsUpTitle: 'COLD ALERT',
      headsUpText: 'Biting cold outdoors. Heavy winter coat, beanie, and watch for icy steps in shaded areas.',
      footerLabel: 'Today',
      footerValue: 'Freezing air',
    };
  }

  // Low sun glare only when daytime, sunny spells, and low cold air
  if (isDay && feelsLike < 12 && (currentTemp - feelsLike >= 2)) {
    return {
      heroAdvice: 'sunglasses are handy for low daytime sun glare, but bring a warm coat',
      headsUpTitle: 'SUN & CHILL',
      headsUpText: 'Low-angle sun glare paired with a sharp breeze. Sunglasses + warm jacket recommended.',
      footerLabel: 'Daytime commute',
      footerValue: 'Sun & Wind',
    };
  }

  if (feelsLike >= 16 && feelsLike < 24) {
    return {
      heroAdvice: 'a light sweater or fleece is all you need',
      headsUpTitle: 'MILD & DRY',
      headsUpText: 'Comfortable mild temperatures. Great drying weather for laundry; light layers are ideal.',
      footerLabel: 'Today',
      footerValue: 'Mild layers',
    };
  }

  if (feelsLike >= 24) {
    return {
      heroAdvice: 'breathable clothing is best; stay hydrated',
      headsUpTitle: 'WARM DAY',
      headsUpText: 'Warm and bright today. Stick to light breathable fabrics and keep water on hand.',
      footerLabel: 'Today',
      footerValue: 'Stay hydrated',
    };
  }

  return {
    heroAdvice: 'a comfortable mid-layer jacket will keep you warm',
    headsUpTitle: 'PRACTICAL HEADS-UP',
    headsUpText: 'Fresh air across the area. A standard jacket and comfortable shoes will do the job nicely.',
    footerLabel: 'Today',
    footerValue: 'Standard jacket',
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

  const temp = Math.round(current.temperature * 10) / 10;
  const rawFeels = current.apparentTemperature !== null && current.apparentTemperature !== undefined
    ? current.apparentTemperature
    : temp;
  const feelsLike = Math.round(rawFeels * 10) / 10;
  const gap = Math.abs(temp - feelsLike);
  const includeFeels = gap >= 1.8;

  const windSpeed = current.windSpeed || 15;
  const weatherCode = current.weatherCode || 0;
  const precip = current.precipitation || 0;
  const isDay = current.isDay !== undefined ? Boolean(current.isDay) : (currentHour >= 8 && currentHour < 17);

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

  const formattedTemp = formatTemp(temp, unit);
  const formattedFeels = formatTemp(feelsLike, unit);

  // Shift & Advice Analysis
  const nextShift = detectIntelligentShift({
    upcomingHours,
    isCurrentlyWet,
    currentTemp: temp,
    timePeriod,
    timeFormat,
    unit,
  });

  const advice = getIntelligentAdvice({
    currentTemp: temp,
    feelsLike,
    windSpeed,
    isCurrentlyWet,
    isDay,
    timePeriod,
    nextShift,
  });

  // Dynamic Sub-header based on time period
  const cityName = selectedCity?.name || 'Local Area';
  let subHeader = `${cityName} • Today's Outlook`;
  if (timePeriod === 'early_morning') subHeader = `${cityName} • Morning Briefing & Day Ahead`;
  else if (timePeriod === 'morning') subHeader = `${cityName} • Morning into Afternoon Outlook`;
  else if (timePeriod === 'afternoon') subHeader = `${cityName} • Afternoon & Evening Commute`;
  else if (timePeriod === 'evening') subHeader = `${cityName} • This Evening & Tonight`;
  else if (timePeriod === 'night') subHeader = `${cityName} • Tonight through Tomorrow Morning`;

  // ----------------------------------------------------
  // Option 1: Natural & Cohesive Hero Paragraph
  // ----------------------------------------------------
  let openingSentence = '';
  if (timePeriod === 'early_morning') {
    openingSentence = `Good morning. It’s a crisp ${formattedTemp} to start the day${includeFeels ? `, feeling closer to ${formattedFeels} in the breeze` : ''} under ${cond.narrativeText}.`;
  } else if (timePeriod === 'morning') {
    openingSentence = `It’s ${formattedTemp} this morning${includeFeels ? `, though ${wind.text} makes it feel like ${formattedFeels}` : ''} with ${cond.narrativeText}.`;
  } else if (timePeriod === 'afternoon') {
    openingSentence = `It’s ${formattedTemp} this afternoon${includeFeels ? `, feeling closer to ${formattedFeels} in ${wind.text}` : ''} under ${cond.narrativeText}.`;
  } else if (timePeriod === 'evening') {
    openingSentence = `It’s ${formattedTemp} this evening under ${cond.narrativeText}${includeFeels ? `, with a cool breeze making it feel closer to ${formattedFeels}` : ''}.`;
  } else {
    // Night
    openingSentence = `A quiet, dry night at ${formattedTemp}${includeFeels ? `, though the breeze drops the feel to ${formattedFeels}` : ''} under ${cond.narrativeText}.`;
  }

  const naturalHero = `${openingSentence} ${nextShift.summary} — ${advice.heroAdvice}.`;

  // ----------------------------------------------------
  // Option 2: 3-Second Commuter Glance
  // ----------------------------------------------------
  const glanceHeader = includeFeels ? `${formattedTemp} (feels ${formattedFeels})` : formattedTemp;
  const commuterGlance = `${glanceHeader} · ${cond.shortText}${wind.isNotable ? ` & ${wind.level}` : ''}. ${nextShift.laterCopy} ${advice.headsUpText}`;

  // ----------------------------------------------------
  // Option 3: Irish-Flavoured Local Expression
  // ----------------------------------------------------
  let irishTitle = 'Fresh and brisk';
  if (isCurrentlyWet && windSpeed >= 30) irishTitle = 'Turning wild later';
  else if (isCurrentlyWet) irishTitle = 'Soft day out there';
  else if (isDay && !isCurrentlyWet && feelsLike >= 13) irishTitle = 'Grand drying weather';
  else if (feelsLike <= 3) irishTitle = 'Biting raw cold';
  else if (timePeriod === 'night') irishTitle = 'Quiet, chilly night';
  else if (isDay && (weatherCode === 0 || weatherCode === 1)) irishTitle = 'Grand bright spell';

  const irishNarrative = `${irishTitle}. It’s ${formattedTemp} out${includeFeels ? ` (feels like ${formattedFeels} in the breeze)` : ''} with ${cond.irishText}. ${nextShift.summary} Sure ${advice.heroAdvice}!`;

  // ----------------------------------------------------
  // Option 4: Intelligible 3 Micro-Cards
  // ----------------------------------------------------
  let nowTitle = 'RIGHT NOW';
  if (timePeriod === 'night') nowTitle = 'TONIGHT';
  else if (timePeriod === 'evening') nowTitle = 'THIS EVENING';
  else if (timePeriod === 'early_morning') nowTitle = 'EARLY MORNING';

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
      nowFooterLabel: 'Observed condition',
      nowFooterValue: formattedTemp,

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
