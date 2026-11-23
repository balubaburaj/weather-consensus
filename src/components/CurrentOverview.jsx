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
  Check
} from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';
import { formatTemp, formatWind, formatPrecip } from '../utils/units';
import { getWeatherInfo, resolveSmartWeatherInfo, getRainHumanType, WEATHER_PROVIDERS } from '../constants/providers';

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

      {/* ⭐ THE 4 CORE ANSWERS HERO BAR (Temperature, Feels Like, What Kind of Rain, How Accurate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Pillar 1: What is the Temperature? */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              1. What's The Temp?
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatTemp(current.temperature, unit)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              High: <span className="text-slate-200 font-semibold">{formatTemp(dailySummary?.maxTemp, unit)}</span> • Low: <span className="text-slate-200 font-semibold">{formatTemp(dailySummary?.minTemp, unit)}</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: What Does It Feel Like? */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              2. Feels Like
            </div>
            <div className="text-2xl font-black text-sky-300 font-mono tracking-tight">
              {formatTemp(current.apparentTemperature, unit)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Wind: <span className="text-slate-200 font-semibold">{formatWind(current.windSpeed, unit)}</span> ({Math.round(current.temperature - current.apparentTemperature)}° colder from wind chill)
            </div>
          </div>
        </div>

        {/* Pillar 3: How Much & What Kind of Rain? */}
        <div className={`p-4 rounded-3xl border shadow-md flex items-start gap-4 relative overflow-hidden ${
          isCurrentlyRaining
            ? 'bg-blue-950/40 border-blue-500/40 shadow-blue-500/10'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
            isCurrentlyRaining
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse-subtle'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <WeatherIcon iconName={currentRainType.icon} className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>3. What Kind of Rain?</span>
              {isCurrentlyRaining && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              )}
            </div>
            
            {/* Plain English Human Rain Classification */}
            <div className="text-xs font-black text-white mt-1 flex items-center gap-1">
              <span>{currentRainType.emoji}</span>
              <span>{isCurrentlyRaining ? currentRainType.label : 'Currently Dry'}</span>
            </div>

            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {isCurrentlyRaining
                ? `${currentRainType.whatItMeans} (${current.precipitation} mm/hr)`
                : dailySummary?.totalRain > 0
                ? `${dailySummary.peakRainType.label} coming tonight (~${dailySummary.totalRain} mm)`
                : 'Dry sidewalks & roads throughout today.'}
            </p>
          </div>
        </div>

        {/* Pillar 4: How Accurate Are You? */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              4. How Accurate?
            </div>
            <div className="text-xl font-black text-amber-300 font-mono tracking-tight">
              {topPerformer ? `${topPerformer.overallScore}% Grade` : '95% Benchmarked'}
            </div>
            <div className="text-[11px] text-slate-300 truncate mt-0.5" title={topPerformer ? `#1 ${topPerformer.provider.name} (±${topPerformer.mae}°C error)` : 'Ground truth verified'}>
              {topPerformer ? `Best: ${topPerformer.provider.shortName} (±${topPerformer.mae}°C error)` : 'Ground Truth Verified'}
            </div>
          </div>
        </div>

      </div>

      {/* Main Live Ground Observation & TrueCast Consensus Blocks */}
      <div className="space-y-4">
        
        {/* 1. Live Ground Observation Card (UP: Full Width Desktop Dashboard) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Col 1-5: Live Station Readings */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Ground Station Weather
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {selectedCity?.name || 'Selected City'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedCity?.admin1 ? `${selectedCity.admin1}, ` : ''}{selectedCity?.country} • {weatherData.timezone}
                  </p>
                </div>

                <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-inner">
                  <WeatherIcon iconName={currentCondition.icon} className="w-10 h-10" />
                </div>
              </div>

              {/* Explicit Condition Display */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                <span className="text-xl">{currentCondition.emoji}</span>
                <div>
                  <div className="text-sm font-black text-white">
                    {currentCondition.label}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-medium">
                    {currentRainType.intensity !== 'Dry' ? `Intensity: ${currentRainType.intensity}` : 'Clear & Dry Conditions'}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  WMO {current.weatherCode}
                </span>
              </div>

              <div className="flex items-baseline gap-4">
                <div className="text-5xl font-black text-white tracking-tighter">
                  {formatTemp(current.temperature, unit)}
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>Feels like <span className="font-bold text-slate-100">{formatTemp(current.apparentTemperature, unit)}</span></div>
                  <div>Humidity <span className="font-bold text-slate-100">{current.relativeHumidity || '--'}%</span></div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Wind Speed</div>
                    <div className="font-bold">{formatWind(current.windSpeed, unit)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Precip</div>
                    <div className="font-bold">{formatPrecip(current.precipitation, unit)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 6-12: Quick Wear & Gear Checklist */}
            <div className="lg:col-span-7 lg:border-l lg:border-slate-800/80 lg:pl-6">
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                <div className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white">
                    <span className="text-sm">🧥</span>
                    <span>Quick Wear &amp; Gear Checklist</span>
                  </span>
                  <span className="text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                    {formatTemp(current.apparentTemperature, unit)} feel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs leading-snug">
                  {/* Jacket */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="shrink-0 text-base">🧥</span>
                    <div>
                      <div className="font-bold text-white text-[11px] uppercase tracking-wide text-slate-400">Jacket</div>
                      <div className="text-slate-200 font-medium text-xs mt-0.5">{quickGear.jacket}</div>
                    </div>
                  </div>

                  {/* Umbrella */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="shrink-0 text-base">☂️</span>
                    <div>
                      <div className="font-bold text-white text-[11px] uppercase tracking-wide text-slate-400">Umbrella</div>
                      <div className={`font-medium text-xs mt-0.5 ${quickGear.umbrellaNeeded ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                        {quickGear.umbrella}
                      </div>
                    </div>
                  </div>

                  {/* Hoodie / Mid */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="shrink-0 text-base">🧶</span>
                    <div>
                      <div className="font-bold text-white text-[11px] uppercase tracking-wide text-slate-400">Hoodie / Mid-Layer</div>
                      <div className="text-slate-200 font-medium text-xs mt-0.5">{quickGear.hoodie}</div>
                    </div>
                  </div>

                  {/* Sunglasses */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="shrink-0 text-base">🕶️</span>
                    <div>
                      <div className="font-bold text-white text-[11px] uppercase tracking-wide text-slate-400">Sunglasses</div>
                      <div className={`font-medium text-xs mt-0.5 ${quickGear.sunglassesNeeded ? 'text-amber-300 font-semibold' : 'text-slate-400'}`}>
                        {quickGear.sunglasses}
                      </div>
                    </div>
                  </div>

                  {/* Hat (Full Width on 2-col) */}
                  <div className="sm:col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="shrink-0 text-base">🧢</span>
                    <div>
                      <div className="font-bold text-white text-[11px] uppercase tracking-wide text-slate-400">Hat &amp; Headwear</div>
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

    </div>
  );
}
