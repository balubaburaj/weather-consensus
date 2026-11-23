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
  Maximize2
} from 'lucide-react';
import { createHouseNo121Scene } from './3d/houseNo121Scene';

/**
 * WeatherHouse3D Component
 * 
 * Embeds a procedural Three.js 3D model of House No. 121 and its stylized couple.
 * Adapts lighting, sky atmosphere, and falling precipitation in real-time to the current weather.
 */
export default function WeatherHouse3D({
  currentWeather,
  isCurrentlyRaining = false,
  selectedCity,
  className = '',
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeCam, setActiveCam] = useState('couple');
  const [lightingMode, setLightingMode] = useState('auto'); // 'auto' | 'noon' | 'afternoon' | 'rainy' | 'dusk'
  const [isMotionActive, setIsMotionActive] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Clean any prior children (StrictMode safe)
    mountRef.current.innerHTML = '';

    let sceneInstance = null;

    try {
      sceneInstance = createHouseNo121Scene(mountRef.current, {
        initialCamera: 'couple',
        onLoaded: () => setIsLoaded(true),
        onToast: (msg) => showToast(msg),
      });

      sceneRef.current = sceneInstance;
    } catch (err) {
      console.error('Failed to initialize House 121 3D scene:', err);
    }

    // IntersectionObserver to pause rendering when scrolled out of view
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
  }, [showToast]);

  // Sync weather state to 3D scene
  useEffect(() => {
    if (!sceneRef.current) return;

    if (lightingMode === 'auto') {
      const isDay = currentWeather?.isDay !== undefined ? currentWeather.isDay : true;
      const precipitation = currentWeather?.precipitation || 0;
      sceneRef.current.setWeatherState({
        isDay,
        isRaining: isCurrentlyRaining,
        precipitation,
      });
    } else {
      sceneRef.current.setLightingPreset(lightingMode);
    }
  }, [currentWeather?.isDay, currentWeather?.precipitation, isCurrentlyRaining, lightingMode]);

  // Handle camera preset changes
  const handleCameraChange = (presetKey) => {
    setActiveCam(presetKey);
    if (sceneRef.current) {
      sceneRef.current.setCameraPreset(presetKey);
    }
  };

  // Handle lighting preset changes
  const handleLightingChange = (modeKey) => {
    setLightingMode(modeKey);
    if (!sceneRef.current) return;

    if (modeKey === 'auto') {
      const isDay = currentWeather?.isDay !== undefined ? currentWeather.isDay : true;
      sceneRef.current.setWeatherState({
        isDay,
        isRaining: isCurrentlyRaining,
        precipitation: currentWeather?.precipitation || 0,
      });
    } else {
      sceneRef.current.setLightingPreset(modeKey);
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

  // Weather status description label
  const getWeatherBadge = () => {
    if (lightingMode === 'auto') {
      if (isCurrentlyRaining) return { text: 'Live: Rainy Day', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      if (!currentWeather?.isDay) return { text: 'Live: Cozy Night', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      return { text: 'Live: Sunny Day', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    const map = {
      noon: { text: 'Mode: High Noon', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
      afternoon: { text: 'Mode: Golden Afternoon', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      rainy: { text: 'Mode: Overcast Rain', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      dusk: { text: 'Mode: Cozy Dusk / Night', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    };
    return map[lightingMode] || { text: '3D Active', color: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  const badge = getWeatherBadge();

  return (
    <div className={`relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950/90 backdrop-blur-md shadow-xl overflow-hidden ${className}`}>
      
      {/* Top Header & Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
        
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
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.text}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive 3D Victorian Terraced House &bull; Live Atmosphere
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

          {/* Lighting Mode Selector */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => handleLightingChange('auto')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
                lightingMode === 'auto'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Sync atmosphere dynamically to live local weather"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Live</span>
            </button>
            <button
              onClick={() => handleLightingChange('afternoon')}
              className={`p-1.5 rounded-lg font-medium transition ${
                lightingMode === 'afternoon'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Warm afternoon sun"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleLightingChange('rainy')}
              className={`p-1.5 rounded-lg font-medium transition ${
                lightingMode === 'rainy'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Rainy overcast atmosphere"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleLightingChange('dusk')}
              className={`p-1.5 rounded-lg font-medium transition ${
                lightingMode === 'dusk'
                  ? 'bg-purple-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cozy dusk & glowing windows"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

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
              Rendering No. 121 Sacre Coeur...
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

        {/* Three.js DOM Container */}
        <div ref={mountRef} className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none" />

        {/* Interactive Helper Banner at Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-400 font-medium whitespace-nowrap shadow-md">
            Drag to orbit &bull; Pinch/Scroll to zoom &bull; Tap couple to wave
          </div>
        </div>
      </div>
    </div>
  );
}
