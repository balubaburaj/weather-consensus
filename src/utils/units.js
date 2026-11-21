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
