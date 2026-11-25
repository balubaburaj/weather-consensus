import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Sun,
  CloudRain,
  Moon,
  Sparkles,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
  Users,
  Maximize2,
  Sliders,
  RotateCcw,
  Info
} from 'lucide-react';
import { createHouseNo121Scene } from './3d/houseNo121Scene';
import { WeatherIcon } from '../utils/weatherIcons';

export const WEATHER_SCENARIOS = [
  {
    id: 'summer',
    label: 'Summer',
    iconName: 'sun',
    temp: '24°C',
    weatherDesc: 'Sunny Warm Sky (> 20°C)',
    boyOutfit: 'Baseball Cap, Sunglasses & Light Summer Windbreaker over tee',
    girlOutfit: 'Chic Sunglasses & Soft Summer Dress',
    atmosphere: 'High Noon Warm Sun, Dry Sidewalk & Pavement',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'mild',
    label: 'Mild Day',
    iconName: 'partly-cloudy-day',
    temp: '18°C',
    weatherDesc: 'Partly Cloudy (16 - 20°C)',
    boyOutfit: 'Clear Glasses, Baseball Cap & Sport Track Jacket',
    girlOutfit: 'Denim / Bomber Jacket & Dress',
    atmosphere: 'Golden Afternoon Sunlight, Clear Roads',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'chilly',
    label: 'Chilly',
    iconName: 'cloudy',
    temp: '11°C',
    weatherDesc: 'Cool Overcast & Breezy (7 - 16°C)',
    boyOutfit: 'Clear Glasses, Knit Beanie & Hard Fleece Hoodie (Kangaroo Pocket)',
    girlOutfit: 'Cozy Cable Knit Scarf & Mauve Fleece Coat',
    atmosphere: 'Cool Diffuse Sky, Damp Sidewalk Sheen',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  {
    id: 'puffy_cold',
    label: 'Puffy Cold',
    iconName: 'snowflake',
    temp: '3°C',
    weatherDesc: 'Cold Crisp Air (< 7°C)',
    boyOutfit: 'Knit Beanie & Quilted 4-Baffle Puffy Down Jacket',
    girlOutfit: 'Cute Pom-Pom Beanie, Cable Scarf & Winter Coat',
    atmosphere: 'Pale Crisp Winter Sky, Cold Ground Bounce',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    id: 'snow',
    label: 'Winter Snow',
    iconName: 'snow-crystals',
    temp: '0°C',
    weatherDesc: 'Falling Snow Flurries',
    boyOutfit: 'Knit Beanie, Puffy Jacket & Clear Glasses',
    girlOutfit: 'Pom-Pom Beanie, Cozy Scarf & Winter Coat',
    atmosphere: '750 Soft Drifting Snowflakes & Frosted Sidewalk',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'light_rain',
    label: 'Light Rain',
    iconName: 'light-rain',
    temp: '12°C',
    weatherDesc: 'Gentle Pattering Rain',
    boyOutfit: 'Baseball Cap, Rain Jacket & Raised Rain Umbrella',
    girlOutfit: 'Classic Yellow Raincoat Under Umbrella',
    atmosphere: 'Falling Rain Droplets & Reflective Sidewalk Puddles',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'heavy_rain',
    label: 'Downpour',
    iconName: 'heavy-rain',
    temp: '10°C',
    weatherDesc: 'Heavy Soaking Rain',
    boyOutfit: 'Waterproof Rain Parka & Raised Umbrella',
    girlOutfit: 'Heavy Yellow Raincoat & Umbrella Protection',
    atmosphere: 'Dense Driving Rain & Large Spreading Puddles with Ripples',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'cold_deluge',
    label: 'Cold Deluge',
    iconName: 'rain-splashes',
    temp: '5°C',
    weatherDesc: 'Torrential Deluge & Squall',
    boyOutfit: 'Knit Beanie, Heavy Rain Jacket & Storm Umbrella',
    girlOutfit: 'Heavy Storm Coat, Pom-Pom Beanie & Scarf',
    atmosphere: 'Cloudburst Driving Rain, Deep Rippling Puddles & Lightning Flashes',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'clear_night',
    label: 'Clear Night',
    iconName: 'crescent-moon',
    temp: '9°C',
    weatherDesc: 'Calm Starlit Evening',
    boyOutfit: 'Baseball Cap & Casual Evening Jacket',
    girlOutfit: 'Evening Jacket & Dress',
    atmosphere: 'Deep Midnight Navy Sky, Lit Victorian Street Lantern & Glowing Windows',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'rain_night',
    label: 'Rain Night',
    iconName: 'night-rain-showers',
    temp: '8°C',
    weatherDesc: 'Nocturnal Rain Showers',
    boyOutfit: 'Rain Jacket & Raised Umbrella',
    girlOutfit: 'Yellow Raincoat Under Umbrella',
    atmosphere: 'Raindrops Glistening Through Street Lantern Light & Wet Puddles',
    badgeColor: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'live',
    label: 'Reset to Live',
    iconName: 'weather-refresh',
    temp: 'Live',
    weatherDesc: 'Real-time Synchronized Weather',
    boyOutfit: 'Smart Adaptive Wardrobe (Outer layer, Cap/Beanie, Umbrella)',
    girlOutfit: 'Smart Adaptive Outfit (Dress/Cardigan/Coat, Umbrella)',
    atmosphere: 'Live local atmospheric lighting, precipitation & puddles',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
];

/**
 * WeatherHouse3D Component
 * 
 * Embeds a procedural Three.js 3D model of House No. 121 and its stylized couple.
 * Adapts lighting, sky atmosphere, props, wardrobe, puddles, and precipitation in real-time.
 * Features an interactive Weather Scenario Studio to test every condition and wardrobe change.
 */
export default function WeatherHouse3D({
  currentWeather,
  isCurrentlyRaining = false,
  selectedCity,
  className = '',
  showControls = false,
  initialCamera = 'iso',
  playIntro = true,
  couplePosition,
  cameraSettings,
  onSceneReady,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const hasControlsQuery = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('studio') === '1' ||
    new URLSearchParams(window.location.search).get('controls') === '1'
  );
  const effectiveShowControls = showControls || hasControlsQuery;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeCam, setActiveCam] = useState('iso');
  const [activeScenario, setActiveScenario] = useState('live');
  const [isStudioOpen, setIsStudioOpen] = useState(true);
  const [isMotionActive, setIsMotionActive] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [controlHint, setControlHint] = useState(null);
  const hintTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const showControlHint = useCallback((hint) => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    setControlHint(hint);
    hintTimeoutRef.current = setTimeout(() => {
      setControlHint(null);
    }, 2200);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    mountRef.current.innerHTML = '';
    let sceneInstance = null;

    try {
      sceneInstance = createHouseNo121Scene(mountRef.current, {
        initialCamera,
        playIntro,
        onStepChange: (stepKey) => {
          setActiveCam(stepKey);
        },
        onControlHint: (hint) => showControlHint(hint),
        onLoaded: () => setIsLoaded(true),
        onToast: (msg) => showToast(msg),
      });

      sceneRef.current = sceneInstance;
      if (couplePosition && sceneInstance.setCouplePosition) {
        sceneInstance.setCouplePosition(couplePosition.x, couplePosition.y, couplePosition.z);
      }
      if (cameraSettings && sceneInstance.setCameraSettings) {
        sceneInstance.setCameraSettings(cameraSettings);
      }
      if (onSceneReady) {
        onSceneReady(sceneInstance);
      }
    } catch (err) {
      console.error('Failed to initialize House 121 3D scene:', err);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sceneRef.current) {
          sceneRef.current.setOffscreen(!entry.isIntersecting);
        }
      },
      { threshold: 0.05 }
    );

    if (mountRef.current) {
      observer.observe(mountRef.current);
    }

    return () => {
      observer.disconnect();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [showToast, initialCamera, playIntro]);

  // Dynamically update couple position when sliders change
  useEffect(() => {
    if (sceneRef.current && couplePosition && sceneRef.current.setCouplePosition) {
      sceneRef.current.setCouplePosition(couplePosition.x, couplePosition.y, couplePosition.z);
    }
  }, [couplePosition?.x, couplePosition?.y, couplePosition?.z]);

  // Dynamically update camera settings when sliders change
  useEffect(() => {
    if (sceneRef.current && cameraSettings && sceneRef.current.setCameraSettings) {
      sceneRef.current.setCameraSettings(cameraSettings);
    }
  }, [
    cameraSettings?.posX,
    cameraSettings?.posY,
    cameraSettings?.posZ,
    cameraSettings?.targetX,
    cameraSettings?.targetY,
    cameraSettings?.targetZ,
    cameraSettings?.fov,
  ]);

  // Sync live weather state when activeScenario === 'live'
  useEffect(() => {
    if (!sceneRef.current) return;

    if (activeScenario === 'live') {
      const isDay = currentWeather?.isDay !== undefined ? currentWeather.isDay : true;
      const precipitation = currentWeather?.precipitation ?? 0;
      const temperature = currentWeather?.temperature ?? 14;
      const weatherCode = currentWeather?.weatherCode ?? 0;
      const cloudCover = currentWeather?.cloudCover ?? null;
      sceneRef.current.setWeatherState({
        isDay,
        isRaining: isCurrentlyRaining,
        precipitation,
        temperature,
        weatherCode,
        cloudCover,
      });
    }
  }, [
    currentWeather?.isDay,
    currentWeather?.precipitation,
    currentWeather?.temperature,
    currentWeather?.weatherCode,
    currentWeather?.cloudCover,
    isCurrentlyRaining,
    activeScenario,
  ]);

  // Handle camera preset changes
  const handleCameraChange = (presetKey) => {
    setActiveCam(presetKey);
    if (sceneRef.current) {
      sceneRef.current.setCameraPreset(presetKey);
    }
  };

  // Handle weather scenario selection in test harness
  const handleScenarioSelect = (scenarioId) => {
    setActiveScenario(scenarioId);
    if (sceneRef.current) {
      sceneRef.current.setWeatherScenario(scenarioId);
    }
    const s = WEATHER_SCENARIOS.find((item) => item.id === scenarioId);
    if (s) {
      showToast(`${s.label}: ${s.boyOutfit}`);
    }
  };

  // Toggle motion / animation
  const handleToggleMotion = () => {
    if (!sceneRef.current) return;
    const newState = sceneRef.current.toggleAnimation();
    setIsMotionActive(newState);
  };

  // Trigger jump & wave interaction
  const handleSayHi = () => {
    if (sceneRef.current) {
      sceneRef.current.triggerWaveJump();
    }
    showToast('👋 Hello from No. 121 Sacre Coeur!');
  };

  const currentScenarioObj = WEATHER_SCENARIOS.find((s) => s.id === activeScenario) || WEATHER_SCENARIOS[0];

  return (
    <div className={`relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950/90 backdrop-blur-md shadow-xl overflow-hidden ${className}`}>
      
      {/* Top Header & Interactive Controls Bar (Hidden when showControls=false) */}
      {effectiveShowControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/50">
          
          {/* Title & Live Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm tracking-tight">
                  No. 121 Sacre Coeur
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentScenarioObj.badgeColor}`}>
                  {currentScenarioObj.label} &bull; {currentScenarioObj.temp}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive 3D Victorian Terraced House &bull; Adaptive Wardrobe & Weather Engine
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Say Hi Button */}
            <button
              onClick={handleSayHi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 border border-pink-500/40 text-pink-300 text-xs font-semibold transition shadow-sm active:scale-95"
              title="Tap the couple to wave and jump!"
            >
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/40" />
              <span>Say Hi!</span>
            </button>

            {/* Camera Presets */}
            <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => handleCameraChange('couple')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
                  activeCam === 'couple'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Couple close-up view"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Couple</span>
              </button>
              <button
                onClick={() => handleCameraChange('front')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
                  activeCam === 'front'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Full house front view"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Front</span>
              </button>
              <button
                onClick={() => handleCameraChange('iso')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
                  activeCam === 'iso'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Isometric street & neighborhood view"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Street</span>
              </button>
            </div>

            {/* Weather Studio Toggle */}
            <button
              onClick={() => setIsStudioOpen(!isStudioOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isStudioOpen
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Weather & Wardrobe Studio Testing Deck"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Studio</span>
            </button>

            {/* Motion Toggle */}
            <button
              onClick={handleToggleMotion}
              className={`p-1.5 rounded-xl border text-xs transition ${
                isMotionActive
                  ? 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
              title={isMotionActive ? 'Pause 3D animation' : 'Resume 3D animation'}
            >
              {isMotionActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title={isCollapsed ? 'Expand 3D view' : 'Collapse 3D view'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* WEATHER & WARDROBE STUDIO TEST HARNESS DECK (Hidden when showControls=false) */}
      {effectiveShowControls && isStudioOpen && !isCollapsed && (
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-5 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Weather & Wardrobe Studio</span>
              <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
                &bull; One-click testing for all weather scenarios, outfits, props & puddles
              </span>
            </div>
            {activeScenario !== 'live' && (
              <button
                onClick={() => handleScenarioSelect('live')}
                className="flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Live</span>
              </button>
            )}
          </div>

          {/* Scenario Buttons Grid / Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
            {WEATHER_SCENARIOS.map((s) => {
              const isSelected = activeScenario === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleScenarioSelect(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                  title={`${s.label} (${s.temp}): ${s.weatherDesc}`}
                >
                  <WeatherIcon iconName={s.iconName} className="w-6 h-6 shrink-0" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Wardrobe & Atmosphere Breakdown Card */}
          <div className="mt-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-start md:items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border shrink-0 ${currentScenarioObj.badgeColor}`}>
                {currentScenarioObj.temp}
              </span>
              <div className="leading-snug">
                <span className="font-bold text-white mr-1.5">Boy:</span>
                <span className="text-slate-300 mr-3">{currentScenarioObj.boyOutfit}</span>
                <span className="font-bold text-white mr-1.5">Girl:</span>
                <span className="text-slate-300">{currentScenarioObj.girlOutfit}</span>
              </div>
            </div>
            <div className="text-slate-400 text-[10px] flex items-center gap-1 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-800/60">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>{currentScenarioObj.atmosphere}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Canvas Body */}
      <div
        className={`relative w-full ${
          isCollapsed ? 'hidden' : 'h-[360px] sm:h-[420px] md:h-[460px]'
        }`}
      >
        {/* Loading Spinner */}
        {!isLoaded && !isCollapsed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
            <span className="text-xs font-semibold text-slate-300 tracking-wide">
              Rendering live 3D weather scene...
            </span>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
            <div className="px-4 py-2 rounded-full bg-slate-900/90 border border-pink-500/50 shadow-lg shadow-pink-500/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md">
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Floating Ctrl Gesture Helper Badge */}
        {controlHint && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in">
            <div className="px-4 py-2 rounded-full bg-slate-950/90 border border-cyan-500/50 shadow-xl shadow-cyan-500/20 text-cyan-200 text-xs font-semibold backdrop-blur-md flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Shortcut</span>
              <span>{controlHint}</span>
            </div>
          </div>
        )}

        {/* Three.js DOM Container */}
        <div ref={mountRef} className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none" />

        {/* Interactive Helper Banner at Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-400 font-medium whitespace-nowrap shadow-md flex items-center gap-1.5">
            <span className="hidden sm:inline">
              Hold <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">Ctrl</kbd> + drag to orbit &bull; <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">Ctrl</kbd> + scroll to zoom
            </span>
            <span className="sm:hidden">
              Use two fingers to rotate &bull; pinch to zoom
            </span>
            <span>&bull; Tap couple to wave</span>
          </div>
        </div>
      </div>
    </div>
  );
}
