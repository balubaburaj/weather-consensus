import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import Header from './components/Header';
import CurrentOverview from './components/CurrentOverview';
import WhatToWearCard from './components/WhatToWearCard';
import DaySelector from './components/DaySelector';
import HourlyMatrix from './components/HourlyMatrix';
import MobileWeatherView from './components/mobile/MobileWeatherView';

// Performance optimization: code-split heavy secondary tabs and modals
const HourlyChart = lazy(() => import('./components/HourlyChart'));
const AccuracyLeaderboard = lazy(() => import('./components/AccuracyLeaderboard'));
const HourDetailModal = lazy(() => import('./components/HourDetailModal'));
const ConsensusExplainerModal = lazy(() => import('./components/ConsensusExplainerModal'));
const ApiKeyModal = lazy(() => import('./components/ApiKeyModal'));

import { fetchMultiModelWeather, DEFAULT_CITIES } from './services/weatherApi';
import { computeHourlyConsensus, generateDailySummary } from './services/consensusEngine';
import { calculateModelAccuracy, saveForecastSnapshot } from './services/accuracyTracker';
import { PROVIDER_KEYS, WEATHER_PROVIDERS } from './constants/providers';
import { getSystemTimeFormatPreference } from './utils/units';
import { LayoutGrid, LineChart, Trophy, RefreshCw, AlertCircle, Compass } from 'lucide-react';

export default function App() {
  // Default to Cork, Ireland (Munster)
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITIES[0]);
  const [rawWeatherData, setRawWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [unit, setUnit] = useState(() => localStorage.getItem('omni_weather_unit') || 'C');

  // Time format preference ('12h' or '24h') - Defaults to user's system setting via Intl API
  const [timeFormat, setTimeFormat] = useState(() => {
    const saved = localStorage.getItem('omni_time_format');
    if (saved === '12h' || saved === '24h') return saved;
    return getSystemTimeFormatPreference();
  });

  const handleToggleTimeFormat = (newFormat) => {
    setTimeFormat(newFormat);
    localStorage.setItem('omni_time_format', newFormat);
  };
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [jumpNowTrigger, setJumpNowTrigger] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [weightingStrategy, setWeightingStrategy] = useState('accuracy'); // 'accuracy' | 'benchmark' | 'equal'
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'chart' | 'accuracy'

  // View Mode: 'auto' (viewport < 768px -> mobile), 'mobile', or 'desktop'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('omni_view_mode') || 'auto';
  });

  const [isNarrowScreen, setIsNarrowScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileLayout = viewMode === 'mobile' || (viewMode === 'auto' && isNarrowScreen);

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('omni_view_mode', mode);
  };

  // Auto-refresh interval (in minutes): 5, 10 (recommended default), 15, 30, or 0 (manual only)
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('omni_refresh_interval');
    return saved !== null ? Number(saved) : 10;
  });

  const handleSetRefreshInterval = (mins) => {
    setRefreshInterval(mins);
    localStorage.setItem('omni_refresh_interval', mins);
  };

  // Provider visibility toggle
  const [activeProviders, setActiveProviders] = useState(() => {
    const initial = {};
    PROVIDER_KEYS.forEach((k) => (initial[k] = true));
    return initial;
  });

  const handleToggleUnit = (newUnit) => {
    setUnit(newUnit);
    localStorage.setItem('omni_weather_unit', newUnit);
  };

  const handleToggleProvider = (key) => {
    setActiveProviders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAllProviders = () => {
    const next = {};
    PROVIDER_KEYS.forEach((k) => (next[k] = true));
    setActiveProviders(next);
  };

  const handleResetProviders = () => {
    handleSelectAllProviders();
  };

  // Fetch weather data for selected city with cache & background refresh support
  const loadWeatherData = useCallback(async (city, forceRefresh = false, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchMultiModelWeather(city.latitude, city.longitude, city.timezone, forceRefresh);
      setRawWeatherData(data);
      setLastUpdated(new Date());

      // Auto-select today from current observation time if not already chosen
      const todayDate = data.current?.time ? data.current.time.split('T')[0] : new Date().toISOString().split('T')[0];
      setSelectedDate((prev) => prev || todayDate);
    } catch (err) {
      console.error(err);
      if (!isBackground) {
        setError('Unable to load weather forecast models. Please check your network connection.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load when city changes
  useEffect(() => {
    if (selectedCity) {
      loadWeatherData(selectedCity, false, false);
    }
  }, [selectedCity, loadWeatherData]);

  const isRefreshingRef = useRef(false);

  // Smart Window-Active Periodic Refresh & Instant Resume on Return
  useEffect(() => {
    if (!selectedCity) return;

    // Threshold when user returns to tab: if data is 5+ minutes old, refresh then and there!
    const RETURN_STALE_THRESHOLD_MS = 5 * 60 * 1000;
    const intervalMs = refreshInterval > 0 ? refreshInterval * 60 * 1000 : null;

    // 1. Instant sync when user comes back to the application (tab or window becomes active)
    const checkAndSyncOnActive = (reason = 'tab_resume') => {
      // Guard: must be visible and online
      if (document.visibilityState === 'hidden' || document.hidden || !navigator.onLine) {
        return;
      }

      // Check age of current weather data
      const timeSinceLast = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;

      // If user was away and returned with data 5+ mins old, refresh immediately!
      if (timeSinceLast >= RETURN_STALE_THRESHOLD_MS && !isRefreshingRef.current) {
        console.log(`[Sync on Return] User returned (${reason}). Data is ${Math.round(timeSinceLast / 60000)}m old (threshold: 5m). Refreshing immediately.`);
        isRefreshingRef.current = true;
        loadWeatherData(selectedCity, true, true).finally(() => {
          setTimeout(() => {
            isRefreshingRef.current = false;
          }, 1500);
        });
      }
    };

    // 2. Periodic background refresh: STRICTLY only runs while window is actively visible
    let intervalId = null;
    if (intervalMs) {
      intervalId = setInterval(() => {
        // STRICT GUARD: If window/tab is hidden or minimized, DO NOT refresh (saves API limits & battery)
        if (document.visibilityState === 'hidden' || document.hidden) {
          return;
        }
        if (!navigator.onLine) {
          return;
        }

        console.log(`[Active Window Sync] Periodic refresh firing (${refreshInterval}m interval)`);
        loadWeatherData(selectedCity, false, true);
      }, intervalMs);
    }

    // Event listeners for window becoming active again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndSyncOnActive('visibilitychange');
      }
    };

    const handleWindowFocus = () => {
      checkAndSyncOnActive('window_focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [selectedCity, refreshInterval, lastUpdated, loadWeatherData]);

  // Compute accuracy report from ground truth & past hours
  const accuracyReport = useMemo(() => {
    if (!rawWeatherData || !rawWeatherData.hours) return null;
    return calculateModelAccuracy(rawWeatherData.hours);
  }, [rawWeatherData]);

  // Save snapshot for historical verification
  useEffect(() => {
    if (rawWeatherData && selectedCity) {
      saveForecastSnapshot(selectedCity.name, rawWeatherData.hours);
    }
  }, [rawWeatherData, selectedCity]);

  // Determine dynamic weights based on weighting strategy
  const customWeights = useMemo(() => {
    if (weightingStrategy === 'equal') {
      const w = {};
      PROVIDER_KEYS.forEach((k) => (w[k] = 1.0));
      return w;
    }
    if (weightingStrategy === 'benchmark') {
      return {
        ukmo_seamless: 1.6,
        metno_seamless: 1.5,
        ecmwf_ifs025: 1.5,
        icon_seamless: 1.3,
        meteofrance_seamless: 1.1,
        gfs_seamless: 1.0,
        gem_seamless: 0.9,
        jma_seamless: 0.8,
      };
    }
    // Default: 'accuracy'
    return accuracyReport?.dynamicWeights || null;
  }, [weightingStrategy, accuracyReport]);

  // Recompute consensus with weights
  const processedWeatherData = useMemo(() => {
    if (!rawWeatherData) return null;
    const computedHours = computeHourlyConsensus(rawWeatherData.hours, customWeights);

    return {
      ...rawWeatherData,
      hours: computedHours,
    };
  }, [rawWeatherData, customWeights]);

  // Group hours by date
  const hoursByDate = useMemo(() => {
    if (!processedWeatherData) return {};
    const map = {};
    processedWeatherData.hours.forEach((h) => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [processedWeatherData]);

  // Current local date in target location
  const todayDateStr = useMemo(() => {
    if (processedWeatherData?.current?.time) {
      return processedWeatherData.current.time.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, [processedWeatherData]);

  // Comprehensive Timeline Dates: Past 2 Days (Thu 19, Fri 20) + Today + Next 6 Days
  const allTimelineDates = useMemo(() => {
    if (!processedWeatherData) return [];
    return processedWeatherData.dates.slice(0, 9);
  }, [processedWeatherData]);

  // Make sure selectedDate matches today by default
  useEffect(() => {
    if (todayDateStr && !selectedDate) {
      setSelectedDate(todayDateStr);
    }
  }, [todayDateStr, selectedDate]);

  // Hours for currently selected day
  const currentDayHours = useMemo(() => {
    return selectedDate ? hoursByDate[selectedDate] || [] : [];
  }, [selectedDate, hoursByDate]);

  // Daily summary for currently selected day
  const dailySummary = useMemo(() => {
    return generateDailySummary(currentDayHours, selectedDate, timeFormat);
  }, [currentDayHours, selectedDate, timeFormat]);

  // If Mobile Layout is active, render the dedicated mobile feed
  if (isMobileLayout && processedWeatherData) {
    return (
      <MobileWeatherView
        weatherData={processedWeatherData}
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        dailySummary={dailySummary}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        timeFormat={timeFormat}
        onToggleTimeFormat={handleToggleTimeFormat}
        onRefresh={() => loadWeatherData(selectedCity, true, false)}
        isRefreshing={loading}
        onSwitchToDesktop={() => handleSetViewMode('desktop')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Header & Search */}
      <Header
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        timeFormat={timeFormat}
        onToggleTimeFormat={handleToggleTimeFormat}
        onRefresh={() => loadWeatherData(selectedCity, true, false)}
        loading={loading}
        lastUpdated={lastUpdated}
        refreshInterval={refreshInterval}
        onChangeRefreshInterval={handleSetRefreshInterval}
        onOpenExplainer={() => setShowExplainer(true)}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onSwitchToMobile={() => handleSetViewMode('mobile')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Loading State */}
        {loading && !processedWeatherData && (
          <div className="py-24 text-center">
            <div className="inline-flex p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">Aggregating Ireland &amp; Global Meteorological Models...</h2>
            <p className="text-xs text-slate-400 mt-1">
              Synchronizing UK Met Office, MET Norway (Yr.no), ECMWF, DWD ICON, Météo-France, NOAA GFS, GEM, and JMA.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadWeatherData(selectedCity)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {processedWeatherData && (
          <>
            {/* Live Observation, 4 Core Pillars Hero Bar & Modest Quick Wear Checklist */}
            <CurrentOverview
              weatherData={processedWeatherData}
              selectedCity={selectedCity}
              dailySummary={dailySummary}
              accuracyReport={accuracyReport}
              unit={unit}
              timeFormat={timeFormat}
              onOpenExplainer={() => setShowExplainer(true)}
            />

            {/* Day Selector Timeline (Includes Past 2 Days + Today + Next 6 Days) */}
            <DaySelector
              dates={allTimelineDates}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                if (date === todayDateStr) {
                  setJumpNowTrigger((prev) => prev + 1);
                }
                if (activeTab === 'accuracy') setActiveTab('matrix');
              }}
              hoursByDate={hoursByDate}
              unit={unit}
              onSelectAuditMode={() => setActiveTab('accuracy')}
              isAuditMode={activeTab === 'accuracy'}
            />

            {/* View Mode Tabs (Matrix / Chart / Accuracy Leaderboard) */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'matrix'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Side-by-Side Matrix</span>
                </button>

                <button
                  onClick={() => setActiveTab('chart')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'chart'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  <span>Interactive Curve Chart</span>
                </button>

                <button
                  onClick={() => setActiveTab('accuracy')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'accuracy'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Accuracy Leaderboard</span>
                </button>
              </div>

              {/* Status info */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>8 Operational Models Live • Cork Ground Truth Verified</span>
              </div>
            </div>

            {/* Tab 1: Side-by-Side Hourly Matrix (Endless Horizontal Multi-Day Timeline) */}
            {activeTab === 'matrix' && (
              <HourlyMatrix
                allHours={processedWeatherData.hours}
                unit={unit}
                timeFormat={timeFormat}
                onSelectHour={(hour) => setSelectedHour(hour)}
                selectedHour={selectedHour}
                activeProviders={activeProviders}
                selectedDate={selectedDate}
                todayDateStr={todayDateStr}
                onDateChange={(date) => setSelectedDate(date)}
                jumpNowTrigger={jumpNowTrigger}
              />
            )}

            {/* Tab 2: Interactive Chart (Lazy loaded) */}
            {activeTab === 'chart' && (
              <Suspense fallback={
                <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse">
                  Loading multi-model interactive chart...
                </div>
              }>
                <HourlyChart
                  hours={currentDayHours}
                  unit={unit}
                  timeFormat={timeFormat}
                  activeProviders={activeProviders}
                  onToggleProvider={handleToggleProvider}
                  onSelectAllProviders={handleSelectAllProviders}
                  onResetProviders={handleResetProviders}
                />
              </Suspense>
            )}

            {/* Tab 3: Accuracy Leaderboard & Truth Verification (Lazy loaded) */}
            {activeTab === 'accuracy' && (
              <Suspense fallback={
                <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse">
                  Loading accuracy leaderboard &amp; truth audit...
                </div>
              }>
                <AccuracyLeaderboard
                  accuracyReport={accuracyReport}
                  unit={unit}
                  timeFormat={timeFormat}
                  onOpenExplainer={() => setShowExplainer(true)}
                />
              </Suspense>
            )}

            {/* Detailed What to Wear & Thermal Comfort Stylist Guide (Placed at the bottom below comparison) */}
            <div className="mt-8 pt-4 border-t border-slate-800/80">
              <WhatToWearCard
                current={processedWeatherData.current}
                dailySummary={dailySummary}
                selectedDayHours={currentDayHours}
                unit={unit}
              />
            </div>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">WeatherConsensus</span>
            <span>• Tailored for Ireland • Powered by TrueCast AI &amp; Open-Meteo NWP Feeds</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>UK Met Office</span>
            <span>MET Norway (Yr.no)</span>
            <span>ECMWF IFS</span>
            <span>DWD ICON-EU</span>
            <span>Météo-France</span>
            <span>NOAA GFS</span>
            <span>GEM</span>
            <span>JMA</span>
          </div>
        </div>
      </footer>

      {/* Lazy Modals with Suspense */}
      <Suspense fallback={null}>
        {/* Hourly Detail Modal */}
        {selectedHour && (
          <HourDetailModal
            hour={selectedHour}
            unit={unit}
            timeFormat={timeFormat}
            onClose={() => setSelectedHour(null)}
          />
        )}

        {/* Consensus Explainer Modal */}
        {showExplainer && (
          <ConsensusExplainerModal
            isOpen={showExplainer}
            onClose={() => setShowExplainer(false)}
            weightingStrategy={weightingStrategy}
            onSelectWeightingStrategy={(s) => setWeightingStrategy(s)}
          />
        )}

        {/* API Key & Feeds Modal */}
        {showApiKeyModal && (
          <ApiKeyModal
            isOpen={showApiKeyModal}
            onClose={() => setShowApiKeyModal(false)}
          />
        )}
      </Suspense>

    </div>
  );
}
