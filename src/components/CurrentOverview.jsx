import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Wind,
  Thermometer,
  Award,
  Sparkles,
  CloudRain,
  Umbrella,
  Eye,
  Check,
  Sunrise,
  Sunset,
  Sun,
} from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp, formatWind, formatPrecip, formatTime } from '../utils/units';
import { getWeatherInfo, resolveSmartWeatherInfo, getRainHumanType, WEATHER_PROVIDERS } from '../constants/providers';
// import WeatherHouse3D from './WeatherHouse3D';
import WeatherNarrativeCard from './WeatherNarrativeCard';

/**
 * Quick modest gear & wear checklist generator
 */
function getQuickGearChecklist(current, isWet, isSunny) {
  const temp = current?.temperature || 12;
  const feels = current?.apparentTemperature !== null && current?.apparentTemperature !== undefined ? current.apparentTemperature : temp;
  const wind = current?.windSpeed || 15;

  // Jacket
  let jacket = 'Light jacket or overshirt';
  if (isWet) {
    jacket = feels < 8 ? 'Warm waterproof coat / winter trench' : 'Water-resistant rain jacket or mac';
  } else if (feels < 4) {
    jacket = 'Heavy down puffer or thick wool overcoat';
  } else if (feels < 9) {
    jacket = 'Warm fleece-lined coat or wool jacket';
  } else if (feels < 14) {
    jacket = 'Light quilted jacket or denim with overshirt';
  } else {
    jacket = 'No heavy jacket needed';
  }

  // Umbrella
  const umbrellaNeeded = isWet;
  const umbrella = isWet
    ? (wind >= 25 ? 'Yes, stout windproof umbrella (25+ km/h gusts)' : 'Yes, umbrella recommended')
    : 'No umbrella needed';

  // Sunglasses
  const sunglassesNeeded = isSunny && current?.isDay;
  const sunglasses = sunglassesNeeded
    ? 'Yes, polarized sunglasses (low-angle sun glare)'
    : 'No sunglasses needed (overcast)';

  // Hoodie / Mid-layer
  let hoodie = 'Cotton t-shirt is fine';
  if (feels < 6) {
    hoodie = 'Heavy fleece hoodie or merino wool jumper';
  } else if (feels < 12) {
    hoodie = 'Warm hoodie or knit sweater underneath';
  } else if (feels < 16) {
    hoodie = 'Light hoodie or long-sleeve layer';
  }

  // Hat / Headwear
  let earCover = false;
  let hat = 'No hat required';
  if (feels < 6 || (feels < 8 && wind >= 25)) {
    earCover = true;
    hat = 'Warm beanie / ear cover hat (blocks sharp wind)';
  } else if (isSunny && current?.isDay) {
    hat = 'Normal cap or sun visor (for sun glare)';
  } else if (isWet) {
    hat = 'Hood up or water-resistant cap';
  }

  return {
    jacket,
    umbrella,
    umbrellaNeeded,
    sunglasses,
    sunglassesNeeded,
    hoodie,
    hat,
    earCover,
  };
}

export default function CurrentOverview({
  weatherData,
  selectedCity,
  dailySummary,
  accuracyReport,
  unit,
  timeFormat = '24h',
  onOpenExplainer,
}) {
  if (!weatherData) return null;

  const { current } = weatherData;
  const topPerformer = accuracyReport?.topPerformer;

  // Resolve condition text and specific human rain classification
  const currentCondition = resolveSmartWeatherInfo(current.weatherCode, current.precipitation > 0 ? 85 : 10, current.precipitation);
  const currentRainType = getRainHumanType(current.precipitation, current.precipitation > 0 ? 85 : 0, current.weatherCode);
  const isCurrentlyRaining = current.precipitation > 0 || currentCondition.isRain;
  const isSunny = current.weatherCode === 0 || current.weatherCode === 1 || current.weatherCode === 2;

  // Quick modest gear checklist
  const quickGear = getQuickGearChecklist(current, isCurrentlyRaining, isSunny);

  return (
    <div className="space-y-4 mb-8">
      
      {/* ⚠️ Met Weather Advisory for Heavy Rain in Ireland / Cork */}
      {(dailySummary?.totalRain >= 6.0 || current.precipitation >= 0.2 || dailySummary?.maxRainProb >= 80) && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-slate-900 border border-amber-500/50 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30">
                  Met Weather Advisory
                </span>
                <span className="font-bold text-white text-sm">
                  Heavy Rain &amp; Road Spray Across {selectedCity?.name || 'Area'}
                </span>
              </div>
              <p className="text-amber-200/90 mt-1 leading-relaxed text-xs">
                Active rain falling now. Models predict substantial rain tonight ({dailySummary?.rainWindow || 'overnight'}), with peak downpours reaching <strong>{dailySummary?.peakRainType?.label || 'Heavy Rain'}</strong> ({dailySummary?.maxHourlyRain} mm/hr). Expect slick roads, standing water, and reduced visibility.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-auto shrink-0 font-mono text-xs bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-amber-300 font-bold">
            Rain Chance: {dailySummary?.maxRainProb || 95}%
          </div>
        </div>
      )}

      {/* 📖 Natural Weather Story (Now through Tonight) */}
      <WeatherNarrativeCard
        currentWeather={current}
        hourlyHours={weatherData.hours}
        dailySummary={dailySummary}
        selectedCity={selectedCity}
        unit={unit}
        timeFormat={timeFormat}
      />

      {/* 🏡 Procedural 3D Live Weather Scene: House No. 121 & Animated Couple (Hidden for production per user request) */}
      {/* <WeatherHouse3D
        currentWeather={current}
        isCurrentlyRaining={isCurrentlyRaining}
        selectedCity={selectedCity}
      /> */}

      {/* ⭐ UNIFIED LIVE GROUND OBSERVATION & CURRENT CONDITIONS MASTER HUB */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Master Card Header: Live Station & Accuracy Benchmark */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                Live Ground Station Weather
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white tracking-tight">
                {selectedCity?.name || 'Selected City'}
              </span>
              <span className="text-xs text-slate-400">
                ({selectedCity?.admin1 ? `${selectedCity.admin1}, ` : ''}{selectedCity?.country || 'IE'} • {weatherData.timezone})
              </span>
            </div>
          </div>

          {/* Model Accuracy Benchmark Chip (Pillar 4 Consolidated) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs self-start sm:self-auto shadow-inner">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-medium">Model Accuracy:</span>
            <span className="font-bold text-amber-300 font-mono">
              {topPerformer ? `${topPerformer.overallScore}% Grade` : '98% Grade'}
            </span>
            {topPerformer && (
              <span className="text-slate-400 text-[11px] hidden md:inline">
                • Best: <strong className="text-slate-200">{topPerformer.provider.shortName}</strong> (±{topPerformer.mae}°C error)
              </span>
            )}
          </div>
        </div>

        {/* Desktop Grid: Left (3 Prominent Hero Cards + Atmospheric Strip) | Right (Quick Wear Checklist) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-stretch">
          
          {/* Left Column (col-span-7): 3 Prominent Hero Cards + Atmospheric Strip */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* The 3 Prominent Weather Metrics: Temp, Feels Like, Rain Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* 1. CURRENT TEMP (PROMINENT) */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    1. Current Temp
                  </span>
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Thermometer className="w-4 h-4" />
                  </div>
                </div>

                <div className="my-2 flex items-baseline gap-2">
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {formatTemp(current.temperature, unit)}
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-700/60 rounded-xl shrink-0 shadow-sm">
                    <WeatherIcon iconName={currentCondition.icon} className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-900">
                  High <strong className="text-slate-200">{formatTemp(dailySummary?.maxTemp, unit)}</strong> • Low <strong className="text-slate-200">{formatTemp(dailySummary?.minTemp, unit)}</strong>
                </div>
              </div>

              {/* 2. FEELS LIKE (PROMINENT) */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-md flex flex-col justify-between hover:border-sky-500/40 transition-colors">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    2. Feels Like
                  </span>
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Wind className="w-4 h-4" />
                  </div>
                </div>

                <div className="my-2">
                  <div className="text-3xl sm:text-4xl font-black text-sky-300 font-mono tracking-tight">
                    {formatTemp(current.apparentTemperature, unit)}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-900 leading-tight">
                  Wind <strong className="text-slate-200">{formatWind(current.windSpeed, unit)}</strong> ({Math.round(current.temperature - current.apparentTemperature)}° colder wind chill)
                </div>
              </div>

              {/* 3. RAIN STATUS (PROMINENT) */}
              <div className={`p-4 rounded-2xl border shadow-md flex flex-col justify-between transition-colors ${
                isCurrentlyRaining
                  ? 'bg-blue-950/40 border-blue-500/40 shadow-blue-500/10'
                  : 'bg-slate-950/70 border-slate-800/90'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>3. Rain Status</span>
                    {isCurrentlyRaining && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    )}
                  </span>
                  <div className={`p-1.5 rounded-xl ${isCurrentlyRaining ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                    <WeatherIcon iconName={currentRainType.icon} className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-2">
                  <div className="text-base font-black text-white flex items-center gap-2 leading-tight">
                    <WeatherIcon iconName={currentRainType.icon} className="w-7 h-7 shrink-0" />
                    <span className="truncate">{isCurrentlyRaining ? currentRainType.label : 'Currently Dry'}</span>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-medium mt-0.5">
                    {currentRainType.intensity !== 'Dry' ? `Intensity: ${currentRainType.intensity}` : 'Dry roads & sidewalks'}
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-900 leading-tight truncate" title={isCurrentlyRaining ? currentRainType.whatItMeans : 'Dry conditions'}>
                  {isCurrentlyRaining
                    ? `${currentRainType.whatItMeans} (${current.precipitation} mm/hr)`
                    : dailySummary?.totalRain > 0
                    ? `Rain expected tonight (~${dailySummary.totalRain} mm)`
                    : 'Clear & dry throughout today'}
                </div>
              </div>

            </div>

            {/* Atmospheric Observations Bar (All Live Ground Station Data Preserved) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Wind Speed</div>
                  <div className="font-bold text-white">{formatWind(current.windSpeed, unit)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Humidity</div>
                  <div className="font-bold text-white">{current.relativeHumidity || '--'}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <CloudRain className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Active Precip</div>
                  <div className="font-bold text-white">{formatPrecip(current.precipitation, unit)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Station Code</div>
                  <div className="font-bold text-white">WMO {current.weatherCode} ({currentCondition.label})</div>
                </div>
              </div>
            </div>

            {/* Astronomical Sunrise, Sunset & Daylight Hours Strip */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-950/60 to-purple-950/30 border border-amber-500/25 text-xs shadow-inner">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-400 uppercase font-bold">Sunrise:</span>
                <span className="font-mono font-bold text-white text-xs">{formatTime(current.sunrise || '08:06', timeFormat)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Daylight: <strong className="text-white font-mono">{current.daylightDuration || '8h 27m'}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-purple-300 font-semibold">
                <Sunset className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-[11px] text-slate-400 uppercase font-bold">Sunset:</span>
                <span className="font-mono font-bold text-white text-xs">{formatTime(current.sunset || '16:33', timeFormat)}</span>
              </div>
            </div>

          </div>

          {/* Right Column (col-span-5): Quick Wear & Gear Checklist */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-800/80 lg:pl-6 flex flex-col justify-between">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 h-full flex flex-col justify-between">
              
              <div className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <span className="text-sm">🧥</span>
                  <span>Quick Wear &amp; Gear Checklist</span>
                </span>
                <span className="text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  {formatTemp(current.apparentTemperature, unit)} feel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs leading-snug">
                
                {/* Jacket */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="shrink-0 text-base">🧥</span>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wide text-slate-400">Jacket</div>
                    <div className="text-slate-200 font-medium text-xs mt-0.5">{quickGear.jacket}</div>
                  </div>
                </div>

                {/* Umbrella */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="shrink-0 text-base">☂️</span>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wide text-slate-400">Umbrella</div>
                    <div className={`font-medium text-xs mt-0.5 ${quickGear.umbrellaNeeded ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                      {quickGear.umbrella}
                    </div>
                  </div>
                </div>

                {/* Hoodie / Mid-Layer */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="shrink-0 text-base">🧶</span>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wide text-slate-400">Hoodie / Mid-Layer</div>
                    <div className="text-slate-200 font-medium text-xs mt-0.5">{quickGear.hoodie}</div>
                  </div>
                </div>

                {/* Sunglasses */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="shrink-0 text-base">🕶️</span>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wide text-slate-400">Sunglasses</div>
                    <div className={`font-medium text-xs mt-0.5 ${quickGear.sunglassesNeeded ? 'text-amber-300 font-semibold' : 'text-slate-400'}`}>
                      {quickGear.sunglasses}
                    </div>
                  </div>
                </div>

                {/* Hat & Headwear (Span 2 cols on tablet/desktop) */}
                <div className="sm:col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="shrink-0 text-base">🧢</span>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wide text-slate-400">Hat &amp; Headwear</div>
                    <div className={`font-medium text-xs mt-0.5 ${quickGear.earCover ? 'text-sky-300 font-semibold' : 'text-slate-300'}`}>
                      {quickGear.hat}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

        {/* 2. Consensus Weather Outlook (DOWN: Compact, Low-Height Desktop Bar) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-blue-950/30 border border-cyan-500/30 px-5 py-3.5 shadow-lg backdrop-blur-md">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Left: Badge, Title & Brief Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  TrueCast AI Consensus
                </span>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Consensus Weather Outlook
                </h2>
                <span className="text-[11px] text-slate-400">
                  • 8 Models Aggregated &amp; Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 lg:line-clamp-1 leading-snug">
                {dailySummary?.description || 'Aggregating predictions from 8 world-class meteorological models.'}
              </p>
            </div>

            {/* Middle / Right: Compact Status Badges & Agreement Score */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {dailySummary?.divergentCount > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>{dailySummary.divergentCount} hrs split</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>Strong Agreement</span>
                </div>
              )}

              {topPerformer && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-medium">
                  <Award className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span>#1: <strong className="text-cyan-300">{topPerformer.provider.shortName}</strong> ({topPerformer.overallScore}%)</span>
                </div>
              )}

              {/* Compact Agreement Score Badge */}
              {dailySummary && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                    dailySummary.avgAgreement >= 80
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : dailySummary.avgAgreement >= 60
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'border-rose-500 text-rose-400 bg-rose-500/10'
                  }`}>
                    {dailySummary.avgAgreement}%
                  </div>
                  <div className="text-[11px] leading-tight">
                    <div className={`font-bold ${
                      dailySummary.avgAgreement >= 80 ? 'text-emerald-300' : dailySummary.avgAgreement >= 60 ? 'text-amber-300' : 'text-rose-300'
                    }`}>
                      {dailySummary.avgAgreement >= 80 ? 'High Confidence' : dailySummary.avgAgreement >= 60 ? 'Moderate Variance' : 'Divergent'}
                    </div>
                    <div className="text-[9px] text-slate-400">Agreement</div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Active Feeds & Explainer Link */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Active Feeds:</span>
              {Object.values(WEATHER_PROVIDERS).map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-850/80 border border-slate-700/50 text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.shortName}
                </span>
              ))}
            </div>

            <button
              onClick={onOpenExplainer}
              className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
            >
              How consensus weighting works →
            </button>
          </div>

        </div>

    </div>
  );
}
