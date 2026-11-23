export function formatTemp(tempC, unit = 'C') {
  if (tempC === null || tempC === undefined) return '--';
  if (unit === 'F') {
    const tempF = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
    return `${Math.round(tempF)}°F`;
  }
  return `${Math.round(tempC * 10) / 10}°C`;
}

export function formatRawTemp(tempC, unit = 'C') {
  if (tempC === null || tempC === undefined) return null;
  if (unit === 'F') {
    return Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
  }
  return Math.round(tempC * 10) / 10;
}

export function formatPrecip(mm, unit = 'C') {
  if (mm === null || mm === undefined) return '0 mm';
  if (unit === 'F') {
    const inches = (mm * 0.0393701).toFixed(2);
    return `${inches} in`;
  }
  return `${mm} mm`;
}

export function formatWind(kmh, unit = 'C') {
  if (kmh === null || kmh === undefined) return '--';
  if (unit === 'F') {
    const mph = Math.round(kmh * 0.621371);
    return `${mph} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

/**
 * Detect user's system 12h vs 24h preference via browser Intl API
 */
export function getSystemTimeFormatPreference() {
  try {
    const options = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    if (typeof options.hour12 === 'boolean') {
      return options.hour12 ? '12h' : '24h';
    }
    if (options.hourCycle) {
      return (options.hourCycle === 'h11' || options.hourCycle === 'h12') ? '12h' : '24h';
    }
  } catch (e) {
    // fallback test below
  }

  try {
    const testDate = new Date(2026, 0, 1, 13, 0);
    const formatted = testDate.toLocaleTimeString(undefined, { hour: 'numeric' });
    if (/pm|am/i.test(formatted)) {
      return '12h';
    }
  } catch (e) {
    // fallback
  }

  return '24h';
}

/**
 * Format time string ("13:00", "08:06", or ISO) according to timeFormat ('12h' or '24h')
 */
export function formatTime(timeInput, timeFormat = '24h', includeMinutes = true) {
  if (!timeInput) return '--';

  let hours = 0;
  let minutes = 0;

  if (typeof timeInput === 'string') {
    if (timeInput.includes('T')) {
      const parts = timeInput.split('T')[1].split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    } else if (timeInput.includes(':')) {
      const parts = timeInput.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    } else {
      hours = parseInt(timeInput, 10);
      minutes = 0;
    }
  } else if (timeInput instanceof Date) {
    hours = timeInput.getHours();
    minutes = timeInput.getMinutes();
  } else if (typeof timeInput === 'number') {
    hours = timeInput;
    minutes = 0;
  }

  if (isNaN(hours)) return String(timeInput);

  if (timeFormat === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    if (includeMinutes) {
      const mStr = minutes < 10 ? `0${minutes}` : minutes;
      return `${h12}:${mStr} ${period}`;
    }
    return `${h12} ${period}`;
  }

  // 24h format
  const h24 = hours < 10 ? `0${hours}` : hours;
  const m24 = minutes < 10 ? `0${minutes}` : minutes;
  return includeMinutes ? `${h24}:${m24}` : `${h24}:00`;
}
