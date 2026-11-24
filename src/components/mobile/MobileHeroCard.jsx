import React, { useState, useMemo } from 'react';
import { Sliders, X, Copy, Check, RotateCcw } from 'lucide-react';
import { formatTemp, formatTime } from '../../utils/units';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo, getRainHumanType } from '../../constants/providers';
import WeatherHouse3D from '../WeatherHouse3D';

const DEFAULT_TUNING = {
  cardHeight: 320,
  coupleX: 2.40,
  coupleY: 0.00,
  coupleZ: 0.94,
  cameraY: 2.05,
  cameraZ: 8.20,
};

export default function MobileHeroCard({
  currentWeather,
  isCurrentlyRaining,
  selectedCity,
  dailySummary,
  unit = 'C',
  timeFormat = '24h',
}) {
  const [tuning, setTuning] = useState(() => {
    try {
      const saved = localStorage.getItem('omni_hero_card_tuning');
      if (saved) return { ...DEFAULT_TUNING, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_TUNING;
  });

  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateTuning = (key, val) => {
    setTuning((prev) => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem('omni_hero_card_tuning', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleReset = () => {
    setTuning(DEFAULT_TUNING);
    try {
      localStorage.removeItem('omni_hero_card_tuning');
    } catch (e) {}
  };

  const summaryString = useMemo(() => {
    return `Couple: X=${tuning.coupleX.toFixed(2)}, Y=${tuning.coupleY.toFixed(2)}, Z=${tuning.coupleZ.toFixed(2)} | Card Height=${tuning.cardHeight}px | Camera: Y=${tuning.cameraY.toFixed(2)}, Z=${tuning.cameraZ.toFixed(2)}`;
  }, [tuning]);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (!currentWeather) return null;

  const temp = currentWeather.temperature !== null ? Math.round(currentWeather.temperature) : '--';
  const feels = currentWeather.apparentTemperature !== null ? Math.round(currentWeather.apparentTemperature) : temp;
  const weatherCode = currentWeather.weatherCode || 0;
  const precip = currentWeather.precipitation || 0;
  const weatherInfo = resolveSmartWeatherInfo(weatherCode, isCurrentlyRaining ? 85 : 10, precip);
  const rainInfo = getRainHumanType(precip, isCurrentlyRaining ? 85 : 0, weatherCode);

  const minTemp = dailySummary?.minTemp !== undefined ? Math.round(dailySummary.minTemp) : temp - 2;
  const maxTemp = dailySummary?.maxTemp !== undefined ? Math.round(dailySummary.maxTemp) : temp + 4;

  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D Model Scene Backdrop (with real-time tunable container height) */}
      <div
        style={{ height: `${tuning.cardHeight}px` }}
        className="relative w-full overflow-hidden transition-[height] duration-200"
      >
        <WeatherHouse3D
          currentWeather={currentWeather}
          isCurrentlyRaining={isCurrentlyRaining}
          selectedCity={selectedCity}
          showControls={false}
          initialCamera="front"
          playIntro={false}
          couplePosition={{
            x: tuning.coupleX,
            y: tuning.coupleY,
            z: tuning.coupleZ,
          }}
          cameraSettings={{
            posY: tuning.cameraY,
            posZ: tuning.cameraZ,
            targetY: tuning.cameraY - 0.6,
          }}
          className="w-full h-full border-none rounded-none"
        />

        {/* Gradient shadow overlay for crystal-clear readability */}
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-14 pointer-events-none bg-gradient-to-b from-slate-950/60 to-transparent" />

        {/* Top-Right Badges: LIVE pulse indicator + Temporary Position Tuner Button */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setIsTunerOpen(!isTunerOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md transition-all shadow-md ${
              isTunerOpen
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900/80 text-amber-300 hover:text-white border-amber-500/40 hover:bg-slate-800'
            }`}
            title="Adjust 3D Couple position and Hero card height sliders"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tune 3D</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[10px] text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Bottom-left Hero Information Overlay */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex items-end justify-between z-10">
          <div>
            {/* Big Temperature */}
            <div className="flex items-start">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg font-mono">
                {temp}°
              </span>
              <span className="text-sm font-bold text-slate-300 ml-1 mt-2">
                {unit === 'F' ? 'F' : 'C'}
              </span>
            </div>

            {/* Feels Like - Below current temp with distinct warm color */}
            <div className="flex items-center gap-1.5 -mt-0.5 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/35 drop-shadow">
                Feels like {feels}°{unit === 'F' ? 'F' : 'C'}
              </span>
            </div>

            {/* Condition with ENLARGED Weather Icon */}
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                <WeatherIcon
                  iconName={weatherInfo.icon}
                  className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-300 drop-shadow-md"
                />
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-100 drop-shadow leading-tight">
                {weatherInfo.label}
              </span>
            </div>

            {/* City Label */}
            <div className="text-xs font-bold text-slate-300 tracking-wide mt-1 flex items-center gap-1.5 drop-shadow">
              <span>{selectedCity?.name || 'Cork'}</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedCity?.admin1 || selectedCity?.country || 'Ireland'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Temporary Interactive Position & Height Tuner Panel */}
      {isTunerOpen && (
        <div className="p-4 bg-slate-900 border-t border-b border-amber-500/30 space-y-3 animate-fade-in z-30">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
            <div className="flex items-center gap-2 text-amber-300">
              <Sliders className="w-4 h-4" />
              <span>3D Hero Card Tuner (Length, Height & Framing)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTunerOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Values Display & Copy Action */}
          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-cyan-300 truncate">
              {summaryString}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold shrink-0 transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Grid of Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Slider 1: Card Container Height */}
            <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Card Height</span>
                <span className="font-mono text-amber-400">{tuning.cardHeight}px</span>
              </div>
              <input
                type="range"
                min="240"
                max="500"
                step="10"
                value={tuning.cardHeight}
                onChange={(e) => updateTuning('cardHeight', parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>240px</span>
                <span>500px</span>
              </div>
            </div>

            {/* Slider 2: Couple X (Horizontal / Length) */}
            <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Couple Length (X)</span>
                <span className="font-mono text-amber-400">{tuning.coupleX.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.5"
                max="4.5"
                step="0.05"
                value={tuning.coupleX}
                onChange={(e) => updateTuning('coupleX', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Left (-2.5)</span>
                <span>Right (+4.5)</span>
              </div>
            </div>

            {/* Slider 3: Couple Y (Height / Vertical) */}
            <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Couple Height (Y)</span>
                <span className="font-mono text-amber-400">{tuning.coupleY.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="2.5"
                step="0.05"
                value={tuning.coupleY}
                onChange={(e) => updateTuning('coupleY', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Ground (-1.0)</span>
                <span>Up (+2.5)</span>
              </div>
            </div>

            {/* Slider 4: Camera Height (Framing) */}
            <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Camera Angle (Height Y)</span>
                <span className="font-mono text-amber-400">{tuning.cameraY.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.05"
                value={tuning.cameraY}
                onChange={(e) => updateTuning('cameraY', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Low Angle</span>
                <span>High Angle</span>
              </div>
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">
              Move sliders to see real-time updates. Click Copy to share your coordinates!
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* High/Low Bar & Daily Status Strip */}
      <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 font-mono font-bold text-slate-200">
            <span className="text-amber-400">&uarr;</span>
            <span>{maxTemp}°</span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-cyan-400">&darr;</span>
            <span>{minTemp}°</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <WeatherIcon iconName={rainInfo.icon} className="w-4 h-4 text-cyan-400" />
            <span className="truncate max-w-[130px] sm:max-w-none">
              {isCurrentlyRaining ? rainInfo.label : 'Dry Roads'}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          {todayDateStr}
        </div>
      </div>
    </div>
  );
}
