import { formatTemp, formatWind, formatTime } from '../utils/units';

/**
 * Weather Narrative Engine
 * 
 * Implements the 4-Slot Dynamic Sentence Builder Logic:
 *   Slot 1: Temp & Feel (smart gap threshold >= 2°C)
 *   Slot 2: Current Condition & Wind
 *   Slot 3: Next Shift (Next 12h / Rest of Today)
 *   Slot 4: Practical Trigger & Gear Action
 * 
 * Produces:
 *   - Option 1: Natural & Practical ("Looking Out the Window" 2-sentence hero)
 *   - Option 2: Punchy & Scannable (3-Second Commuter Glance)
 *   - Option 3: Irish-Flavoured (Authentic Irish composite idioms & personality)
 *   - Option 4: Split Now / Later / Gear Micro-Copy
 */

/**
 * Categorize wind intensity
 */
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

/**
 * Categorize current sky / precipitation feel
 */
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
      narrativeText: 'light mizzle that feels damp and clammy',
      shortText: 'Light mizzle',
      irishText: 'fine mizzle misty enough to slowly wet you through',
      isWet: true,
    };
  }

  // Dry conditions
  if (weatherCode === 0 || weatherCode === 1) {
    return {
      type: 'clear',
      narrativeText: isDay ? 'bright sun and clear skies' : 'crisp clear night skies',
      shortText: isDay ? 'Sunny & clear' : 'Clear night',
      irishText: isDay ? 'grand bright sun' : 'clear starlit sky',
      isWet: false,
    };
  }
  if (weatherCode === 2) {
    return {
      type: 'partly_cloudy',
      narrativeText: 'sunny spells under broken cloud',
      shortText: 'Sunny spells',
      irishText: 'fair sunny spells breaking through the cloud',
      isWet: false,
    };
  }
  if (weatherCode === 3) {
    return {
      type: 'overcast',
      narrativeText: 'flat grey cloud',
      shortText: 'Dull overcast',
      irishText: 'grey overcast skies hanging low',
      isWet: false,
    };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      type: 'fog',
      narrativeText: 'dense mist and low visibility',
      shortText: 'Misty fog',
      irishText: 'thick sea fog rolling across the hills',
      isWet: false,
    };
  }

  return {
    type: 'cloudy',
    narrativeText: 'overcast skies',
    shortText: 'Overcast',
    irishText: 'dull cloud',
    isWet: false,
  };
}

/**
 * Scan subsequent hours today (from now up to midnight or next 12 hours)
 * to detect the first significant weather shift.
 */
function detectNextShift(restOfDayHours, isCurrentlyWet, currentTemp, timeFormat, unit) {
  if (!restOfDayHours || restOfDayHours.length === 0) {
    return {
      summary: 'Holding steady through the evening.',
      punchy: 'Holding steady through the evening.',
      irish: 'Holding steady and calm right through the night.',
      laterCopy: 'Holding steady with no sudden shifts through the evening.',
      shiftFound: false,
      shiftTime: null,
      shiftProb: null,
      shiftType: null,
    };
  }

  // 1. If currently dry, look for rain moving in
  if (!isCurrentlyWet) {
    for (let i = 0; i < restOfDayHours.length; i++) {
      const h = restOfDayHours[i];
      const consensus = h.consensus;
      if (!consensus) continue;

      const prob = consensus.precipitationProbability || 0;
      const precip = consensus.precipitation || 0;

      if (prob >= 40 || precip >= 0.2) {
        const timeStr = formatTime(h.hourLabel || h.timeIso, timeFormat);
        let rainTypeStr = 'steady rain';
        let punchyRain = 'rain moving in';
        let irishRain = 'proper rain moving in';

        if (precip >= 2.0 || prob >= 75) {
          rainTypeStr = 'heavy driving rain';
          punchyRain = 'heavy sideways rain';
          irishRain = 'a deluge of driving rain';
        } else if (precip < 0.5 && prob < 60) {
          rainTypeStr = 'passing showers';
          punchyRain = 'brief shower likely';
          irishRain = 'scattered showers';
        }

        return {
          summary: `Dry for now, though ${rainTypeStr} is expected around ${timeStr}.`,
          punchy: `Dry until ${timeStr}, then ${punchyRain} for the evening commute.`,
          irish: `Staying dry for now, but watch out around ${timeStr} when a ${prob}% chance of ${irishRain} arrives.`,
          laterCopy: `${prob}% chance of ${rainTypeStr} starting around ${timeStr}.`,
          shiftFound: true,
          shiftTime: timeStr,
          shiftProb: prob,
          shiftType: rainTypeStr,
        };
      }
    }
  }

  // 2. If currently wet, look for rain easing or brightening
  if (isCurrentlyWet) {
    let rainClearsIndex = -1;
    for (let i = 0; i < restOfDayHours.length; i++) {
      const h = restOfDayHours[i];
      const prob = h.consensus?.precipitationProbability || 0;
      const precip = h.consensus?.precipitation || 0;
      if (prob < 30 && precip < 0.1) {
        rainClearsIndex = i;
        break;
      }
    }

    if (rainClearsIndex !== -1) {
      const clearHour = restOfDayHours[rainClearsIndex];
      const clearTime = formatTime(clearHour.hourLabel || clearHour.timeIso, timeFormat);

      // Check if rain returns later
      let returnsLater = null;
      for (let j = rainClearsIndex + 1; j < restOfDayHours.length; j++) {
        const h2 = restOfDayHours[j];
        const prob2 = h2.consensus?.precipitationProbability || 0;
        if (prob2 >= 50) {
          const returnTime = formatTime(h2.hourLabel || h2.timeIso, timeFormat);
          returnsLater = { time: returnTime, prob: prob2 };
          break;
        }
      }

      if (returnsLater) {
        return {
          summary: `It should brighten up by ${clearTime}, with a ${returnsLater.prob}% chance of passing showers returning around ${returnsLater.time}.`,
          punchy: `Eases off around ${clearTime}; passing showers returning after ${returnsLater.time}.`,
          irish: `The rain eases off around ${clearTime}, but don't drop your guard—there's a ${returnsLater.prob}% chance of it returning by ${returnsLater.time}.`,
          laterCopy: `Easing around ${clearTime}, with scattered showers returning at ${returnsLater.time}.`,
          shiftFound: true,
          shiftTime: clearTime,
          shiftProb: returnsLater.prob,
          shiftType: 'clearing_then_returning',
        };
      }

      return {
        summary: `Rain eases off around ${clearTime}, clearing to a mild, dry rest of the day.`,
        punchy: `Rain stops around ${clearTime}; dry and clear for the rest of the evening.`,
        irish: `The wet weather clears around ${clearTime}, leaving a grand dry evening in its wake.`,
        laterCopy: `Rain easing off by ${clearTime}, holding dry afterwards.`,
        shiftFound: true,
        shiftTime: clearTime,
        shiftProb: 20,
        shiftType: 'clearing',
      };
    }
  }

  // 3. Scan for significant temperature warmup or evening drop
  let maxTempHour = null;
  let minTempHour = null;
  let maxT = -999;
  let minT = 999;

  restOfDayHours.forEach((h) => {
    const t = h.consensus?.temperature;
    if (t !== undefined && t !== null) {
      if (t > maxT) {
        maxT = t;
        maxTempHour = h;
      }
      if (t < minT) {
        minT = t;
        minTempHour = h;
      }
    }
  });

  if (maxTempHour && maxT - currentTemp >= 3.5) {
    const warmTime = formatTime(maxTempHour.hourLabel || maxTempHour.timeIso, timeFormat);
    const warmFormatted = formatTemp(maxT, unit);
    return {
      summary: `Warming to a pleasant ${warmFormatted} by ${warmTime} and staying dry through the evening.`,
      punchy: `Dry all day. Warming to ${warmFormatted} around ${warmTime}.`,
      irish: `Dry and pleasant right through, warming up to a grand ${warmFormatted} around ${warmTime}.`,
      laterCopy: `Staying dry and brightening, peaking at ${warmFormatted} around ${warmTime}.`,
      shiftFound: true,
      shiftTime: warmTime,
      shiftProb: 0,
      shiftType: 'warming',
    };
  }

  if (minTempHour && currentTemp - minT >= 4.0) {
    const coolTime = formatTime(minTempHour.hourLabel || minTempHour.timeIso, timeFormat);
    const coolFormatted = formatTemp(minT, unit);
    return {
      summary: `Staying dry all afternoon, dropping to a cool ${coolFormatted} after sunset around ${coolTime}.`,
      punchy: `Dry all day. Temperatures falling to ${coolFormatted} by ${coolTime}.`,
      irish: `Grand drying weather all afternoon, turning right chilly at ${coolFormatted} once darkness sets in.`,
      laterCopy: `Dry throughout; temperatures cool sharply to ${coolFormatted} by ${coolTime}.`,
      shiftFound: true,
      shiftTime: coolTime,
      shiftProb: 0,
      shiftType: 'cooling',
    };
  }

  // 4. Default: holding steady
  return {
    summary: 'Staying dry and holding steady through the evening.',
    punchy: 'Dry and steady through the evening commute.',
    irish: 'Grand and steady out there, holding dry right through the night.',
    laterCopy: 'Holding steady and dry with no significant shifts expected tonight.',
    shiftFound: false,
    shiftTime: null,
    shiftProb: null,
    shiftType: 'steady',
  };
}

/**
 * Slot 4: Practical Trigger / Gear Advice
 */
function getPracticalTrigger({ currentTemp, feelsLike, windSpeed, isCurrentlyWet, nextShift }) {
  const windChillDelta = Math.round(currentTemp - feelsLike);
  const willRainLater = nextShift?.shiftType?.includes('rain') || nextShift?.shiftType === 'clearing_then_returning';

  // High wind + rain (umbrella unusable)
  if ((isCurrentlyWet || willRainLater) && windSpeed >= 25) {
    return {
      natural: 'leave the umbrella at home and grab a hooded coat',
      punchy: 'Too blustery for umbrellas — wear a hooded shell.',
      irish: "an umbrella won't survive the wind; grab your hooded coat",
      headsUp: "Pack a waterproof shell now; it'll be too windy for an umbrella on the way home.",
    };
  }

  // Rain with light/moderate wind
  if (isCurrentlyWet || willRainLater) {
    return {
      natural: 'keep an umbrella handy and slip on a water-resistant layer',
      punchy: 'Keep an umbrella in your bag.',
      irish: 'keep your umbrella close and your jacket zipped',
      headsUp: 'Rain gear recommended today; keep a compact brolly in your bag.',
    };
  }

  // Freezing / Frost risk
  if (feelsLike <= 2) {
    return {
      natural: 'watch for frost or black ice on shaded pavements and bundle up',
      punchy: 'Black ice risk on shaded paths; bundle up.',
      irish: 'wrap up well in a thick scarf and mind the slippery paths',
      headsUp: 'Biting cold outdoors. Heavy coat, beanie, and watch for icy steps.',
    };
  }

  // Low sun glare with cold air
  if (feelsLike < 12 && windChillDelta >= 2) {
    return {
      natural: 'sunglasses are handy for low sun glare, but bring a warm coat',
      punchy: 'Sun glare alert: sunglasses + warm fleece coat.',
      irish: "the sun looks grand through the window, but don't be fooled—take your proper coat",
      headsUp: 'Bright low-angle sun glare, but sharp wind chill. Sunglasses + warm jacket.',
    };
  }

  // Mild & pleasant
  if (feelsLike >= 16 && feelsLike < 24) {
    return {
      natural: 'a light sweater or fleece is all you need',
      punchy: 'Mild & pleasant — light layers are ideal.',
      irish: 'ideal weather for hanging out the washing; grand and mild in a light top',
      headsUp: 'Comfortable mild temperatures. Light outer layer or fleece is plenty.',
    };
  }

  // Warm
  if (feelsLike >= 24) {
    return {
      natural: 'breathable cotton is best; stay hydrated',
      punchy: 'Warm & bright — stay hydrated.',
      irish: 'proper warm out; get out and enjoy the heat while it lasts',
      headsUp: 'Warm sunny afternoon. Stay hydrated and stick to light breathable clothes.',
    };
  }

  // Default chilly
  return {
    natural: 'a comfortable mid-layer jacket will keep you warm',
    punchy: 'Standard jacket recommended.',
    irish: 'a good jacket is all you need out there',
    headsUp: 'Fresh Atlantic air. Standard jacket and comfortable shoes will do the job.',
  };
}

/**
 * Generate Irish Composite Title
 */
function getIrishCompositeTitle(feelsLike, windSpeed, isWet, isSunny, isOvercast) {
  if (isWet && windSpeed >= 32) {
    return 'Turning wild later';
  }
  if (isWet && windSpeed < 18) {
    return 'Soft day out there';
  }
  if (isSunny && windSpeed >= 20) {
    return 'Four seasons in one day';
  }
  if (!isWet && isSunny && windSpeed < 25 && feelsLike >= 13) {
    return 'Grand drying weather';
  }
  if (feelsLike <= 3) {
    return 'Biting raw cold';
  }
  if (feelsLike >= 18 && isOvercast) {
    return 'Close and clammy';
  }
  if (windSpeed >= 38) {
    return 'Fierce windy out';
  }
  if (isSunny) {
    return 'Grand bright spell';
  }
  return 'Fresh and brisk';
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

  const temp = Math.round(current.temperature * 10) / 10;
  const rawFeels = current.apparentTemperature !== null && current.apparentTemperature !== undefined
    ? current.apparentTemperature
    : temp;
  const feelsLike = Math.round(rawFeels * 10) / 10;
  const gap = Math.abs(temp - feelsLike);
  const includeFeels = gap >= 2.0;

  const windSpeed = current.windSpeed || 15;
  const weatherCode = current.weatherCode || 0;
  const precip = current.precipitation || 0;
  const isDay = current.isDay !== undefined ? Boolean(current.isDay) : true;

  const wind = getWindCategory(windSpeed);
  const cond = getCurrentFeelCondition(weatherCode, precip, isDay);
  const isCurrentlyWet = cond.isWet;

  // Filter rest of day hours (from current hour onwards)
  let restOfDayHours = [];
  if (hourlyHours && hourlyHours.length > 0) {
    const currentIdx = hourlyHours.findIndex((h) => h.isCurrent);
    if (currentIdx !== -1) {
      restOfDayHours = hourlyHours.slice(currentIdx + 1, currentIdx + 14);
    } else {
      restOfDayHours = hourlyHours.filter((h) => !h.isPast).slice(1, 14);
    }
  }

  // Format strings
  const formattedTemp = formatTemp(temp, unit);
  const formattedFeels = formatTemp(feelsLike, unit);

  // Slot 3: Next Shift detection
  const nextShift = detectNextShift(restOfDayHours, isCurrentlyWet, temp, timeFormat, unit);

  // Slot 4: Practical trigger
  const trigger = getPracticalTrigger({ currentTemp: temp, feelsLike, windSpeed, isCurrentlyWet, nextShift });

  // ----------------------------------------------------
  // Option 1: Natural & Practical ("Looking Out the Window")
  // ----------------------------------------------------
  let opt1Slot1 = '';
  if (includeFeels) {
    if (wind.isNotable) {
      opt1Slot1 = `It’s ${formattedTemp} out, but ${wind.text} makes it feel closer to ${formattedFeels}.`;
    } else {
      opt1Slot1 = `It’s ${formattedTemp} out, but feels closer to ${formattedFeels}.`;
    }
  } else {
    opt1Slot1 = `It’s ${formattedTemp} right now with ${cond.narrativeText}${wind.isNotable ? ` and ${wind.text}` : ''}.`;
  }

  let opt1Slot2 = '';
  if (includeFeels) {
    opt1Slot2 = `Currently observing ${cond.narrativeText}.`;
  }

  const naturalHero = `${opt1Slot1} ${nextShift.summary}—${trigger.natural}.`;

  // ----------------------------------------------------
  // Option 2: Punchy & Scannable (3-Second Commuter Glance)
  // ----------------------------------------------------
  const opt2Header = includeFeels ? `${formattedTemp} (feels like ${formattedFeels})` : formattedTemp;
  const opt2Condition = wind.isNotable ? `${cond.shortText} & blustery` : cond.shortText;
  const commuterGlance = `${opt2Header} · ${opt2Condition}. ${nextShift.punchy} ${trigger.punchy}`;

  // ----------------------------------------------------
  // Option 3: Irish-Flavoured (Using Composite Labels)
  // ----------------------------------------------------
  const irishTitle = getIrishCompositeTitle(
    feelsLike,
    windSpeed,
    isCurrentlyWet,
    weatherCode === 0 || weatherCode === 1 || weatherCode === 2,
    weatherCode === 3
  );

  let irishBody = '';
  if (includeFeels) {
    irishBody = `${irishTitle}. It’s ${formattedTemp} right now (feels like ${formattedFeels} in the breeze) with ${cond.irishText}. ${nextShift.irish} Sure ${trigger.irish}!`;
  } else {
    irishBody = `${irishTitle}. It’s ${formattedTemp} out, with ${cond.irishText}. ${nextShift.irish} Sure ${trigger.irish}!`;
  }

  // ----------------------------------------------------
  // Option 4: Split "Now / Later / Gear" Micro-Copy
  // ----------------------------------------------------
  const nowField = `${opt2Header} — ${cond.shortText}${wind.isNotable ? ` with ${wind.text}` : ''}.`;
  const laterField = nextShift.laterCopy;
  const headsUpField = trigger.headsUp;

  return {
    cityName: selectedCity?.name || 'Local Area',
    temperature: formattedTemp,
    feelsLike: formattedFeels,
    hasFeelsGap: includeFeels,
    windSummary: wind.text,
    conditionShort: cond.shortText,
    irishTitle,
    // The 4 Option Deliverables:
    naturalHero,
    commuterGlance,
    irishNarrative: irishBody,
    microFields: {
      now: nowField,
      later: laterField,
      headsUp: headsUpField,
    },
    nextShiftMeta: {
      found: nextShift.shiftFound,
      time: nextShift.shiftTime,
      prob: nextShift.shiftProb,
      type: nextShift.shiftType,
    },
  };
}
