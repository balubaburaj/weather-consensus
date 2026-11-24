import React, { useState, useMemo } from 'react';
import {
  Sliders,
  X,
  Copy,
  Check,
  RotateCcw,
  Compass,
  Eye,
  Maximize,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { formatTemp, formatTime } from '../../utils/units';
import { WeatherIcon } from '../../utils/weatherIcons';
import { resolveSmartWeatherInfo, getRainHumanType } from '../../constants/providers';
import WeatherHouse3D from '../WeatherHouse3D';

const TUNING_VERSION = 'v2_user_coords';
const DEFAULT_TUNING = {
  cardHeight: 390,
  coupleX: 1.45,
  coupleY: 0.00,
  coupleZ: 1.05,
  cameraAngleX: 0.20, // Camera orbit angle: < 0 looks from left, > 0 looks from right
  cameraPanX: 0.30,   // Camera lateral shift: moves both camera and target left/right
  cameraY: 2.00,      // Camera vertical height
  cameraZ: 7.00,      // Camera distance / zoom
  cameraFov: 61,      // Camera lens angle width (FOV)
};

export default function MobileHeroCard({
  currentWeather,
  isCurrentlyRaining,
  selectedCity,
  dailySummary,
  unit = 'C',
  timeFormat = '24h',
  onOpenCitySearch,
  onOpenSettings,
  onRefresh,
  isRefreshing = false,
}) {
  const [tuning, setTuning] = useState(() => {
    try {
      const v = localStorage.getItem('omni_hero_tuning_ver');
      if (v === TUNING_VERSION) {
        const saved = localStorage.getItem('omni_hero_card_tuning');
        if (saved) return { ...DEFAULT_TUNING, ...JSON.parse(saved) };
      } else {
        localStorage.setItem('omni_hero_tuning_ver', TUNING_VERSION);
        localStorage.setItem('omni_hero_card_tuning', JSON.stringify(DEFAULT_TUNING));
      }
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

  const applyPreset = (preset) => {
    setTuning((prev) => {
      const next = { ...prev, ...preset };
      try {
        localStorage.setItem('omni_hero_card_tuning', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const summaryString = useMemo(() => {
    return `Couple: X=${tuning.coupleX.toFixed(2)}, Y=${tuning.coupleY.toFixed(2)}, Z=${tuning.coupleZ.toFixed(2)} | Card Height=${tuning.cardHeight}px | Camera: AngleX=${tuning.cameraAngleX.toFixed(2)}, PanX=${tuning.cameraPanX.toFixed(2)}, Y=${tuning.cameraY.toFixed(2)}, Z=${tuning.cameraZ.toFixed(2)}, FOV=${tuning.cameraFov}°`;
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
            posX: tuning.cameraPanX + tuning.cameraAngleX,
            posY: tuning.cameraY,
            posZ: tuning.cameraZ,
            targetX: tuning.cameraPanX,
            targetY: tuning.cameraY - 0.6,
            targetZ: 0.0,
            fov: tuning.cameraFov,
          }}
          className="w-full h-full border-none rounded-none"
        />

        {/* Gradient shadow overlay for crystal-clear readability */}
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-20 pointer-events-none bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent" />

        {/* Top Controls Overlay inside the 3D card (City Selection, Refresh, Search, Settings) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
          {/* Quick city switch menu button */}
          <button
            type="button"
            onClick={onOpenCitySearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 backdrop-blur-md text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[125px]">{selectedCity?.name || 'Cork'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Action Icons: Refresh, Search & Settings */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              className={`p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 backdrop-blur-md text-slate-300 hover:text-white transition active:scale-95 shadow-md cursor-pointer ${
                isRefreshing ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Refresh weather"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCitySearch}
              className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 backdrop-blur-md text-slate-300 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
              title="Search city"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 backdrop-blur-md text-slate-300 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
              title="Settings & Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
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

            {/* Feels Like - Below current temp with distinct warm color & enlarged presence */}
            <div className="flex items-center gap-1.5 -mt-0.5 mb-2">
              <span className="text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm drop-shadow-md">
                Feels like {feels}°{unit === 'F' ? 'F' : 'C'}
              </span>
            </div>

            {/* Condition with ENLARGED Weather Icon */}
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                <WeatherIcon
                  iconName={weatherInfo.icon}
                  isNight={currentWeather?.isDay === false || currentWeather?.isDay === 0}
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

      {/* Temporary Interactive Position & Perspective Tuner Panel */}
      {isTunerOpen && (
        <div className="p-4 bg-slate-900 border-t border-b border-amber-500/30 space-y-3 animate-fade-in z-30 max-h-[460px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
            <div className="flex items-center gap-2 text-amber-300">
              <Sliders className="w-4 h-4" />
              <span>3D Hero Card Tuner (Perspective, Width, Height & Couple)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTunerOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Perspective Presets */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block">
              Quick Perspective Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cameraAngleX: 0.25,
                    cameraPanX: 0.0,
                    cameraY: 2.05,
                    cameraZ: 8.2,
                    cameraFov: 45,
                  })
                }
                className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 font-semibold text-center truncate transition"
              >
                📐 Front View
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cameraAngleX: -3.6,
                    cameraPanX: 0.6,
                    cameraY: 2.3,
                    cameraZ: 8.6,
                    cameraFov: 46,
                  })
                }
                className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 font-semibold text-center truncate transition"
              >
                🏙️ Left 3/4 Angle
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cameraAngleX: 3.6,
                    cameraPanX: -0.6,
                    cameraY: 2.3,
                    cameraZ: 8.6,
                    cameraFov: 46,
                  })
                }
                className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 font-semibold text-center truncate transition"
              >
                🏡 Right 3/4 Angle
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    cameraAngleX: 1.8,
                    cameraPanX: 1.8,
                    cameraY: 1.35,
                    cameraZ: 5.2,
                    cameraFov: 42,
                    coupleX: 2.4,
                    coupleY: 0.0,
                  })
                }
                className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 font-semibold text-center truncate transition"
              >
                🔍 Couple Close-Up
              </button>
            </div>
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

          {/* Camera Perspective & Angle Section */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
              1. Camera Perspective, Angle & Width
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Slider A: Camera Perspective (Left ↔ Right Orbit Angle) */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Perspective Angle (Left ↔ Right)</span>
                  <span className="font-mono text-amber-400">{tuning.cameraAngleX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-6.0"
                  max="6.0"
                  step="0.1"
                  value={tuning.cameraAngleX}
                  onChange={(e) => updateTuning('cameraAngleX', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>← Left Perspective</span>
                  <span>Front (0)</span>
                  <span>Right Perspective →</span>
                </div>
              </div>

              {/* Slider B: Camera Lens Width / Angle Width (FOV) */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Camera Lens Width (FOV)</span>
                  <span className="font-mono text-amber-400">{tuning.cameraFov}°</span>
                </div>
                <input
                  type="range"
                  min="28"
                  max="75"
                  step="1"
                  value={tuning.cameraFov}
                  onChange={(e) => updateTuning('cameraFov', parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Narrow (28°)</span>
                  <span>Normal (45°)</span>
                  <span>Wide Angle (75°)</span>
                </div>
              </div>

              {/* Slider C: Camera Horizontal Pan (Shift Left / Right) */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Horizontal Pan Shift</span>
                  <span className="font-mono text-amber-400">{tuning.cameraPanX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-4.0"
                  max="4.0"
                  step="0.1"
                  value={tuning.cameraPanX}
                  onChange={(e) => updateTuning('cameraPanX', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Shift Left (-4)</span>
                  <span>Center (0)</span>
                  <span>Shift Right (+4)</span>
                </div>
              </div>

              {/* Slider D: Camera Distance / Zoom (Z) */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Camera Distance (Zoom)</span>
                  <span className="font-mono text-amber-400">{tuning.cameraZ.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="13.0"
                  step="0.1"
                  value={tuning.cameraZ}
                  onChange={(e) => updateTuning('cameraZ', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Close (4.5)</span>
                  <span>Far (13.0)</span>
                </div>
              </div>

              {/* Slider E: Camera Height (Angle Y) */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Camera Height (Vertical Angle)</span>
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
                  <span>Ground Angle (0.8)</span>
                  <span>High Angle (4.0)</span>
                </div>
              </div>

              {/* Slider F: Card Container Height */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Card Container Height</span>
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
                  <span>Compact (240px)</span>
                  <span>Tall (500px)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Couple Position Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase text-cyan-400 tracking-wider">
              2. Couple Position (X, Y & Depth)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Slider 1: Couple X */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Horizontal (X)</span>
                  <span className="font-mono text-cyan-300">{tuning.coupleX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="4.5"
                  step="0.05"
                  value={tuning.coupleX}
                  onChange={(e) => updateTuning('coupleX', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Left (-3.0)</span>
                  <span>Right (+4.5)</span>
                </div>
              </div>

              {/* Slider 2: Couple Y */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Vertical (Y)</span>
                  <span className="font-mono text-cyan-300">{tuning.coupleY.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="2.5"
                  step="0.05"
                  value={tuning.coupleY}
                  onChange={(e) => updateTuning('coupleY', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Ground (-1.0)</span>
                  <span>Up (+2.5)</span>
                </div>
              </div>

              {/* Slider 3: Couple Z */}
              <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Depth from Wall (Z)</span>
                  <span className="font-mono text-cyan-300">{tuning.coupleZ.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={tuning.coupleZ}
                  onChange={(e) => updateTuning('coupleZ', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Close (0.2)</span>
                  <span>Pavement (2.5)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">
              Drag sliders to view in real-time. Copy when satisfied!
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
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
            <WeatherIcon
              iconName={rainInfo.icon}
              isNight={currentWeather?.isDay === false || currentWeather?.isDay === 0}
              className="w-4 h-4 text-cyan-400"
            />
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
