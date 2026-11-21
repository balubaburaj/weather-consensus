import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import CurrentOverview from './components/CurrentOverview';
import DaySelector from './components/DaySelector';
import HourlyMatrix from './components/HourlyMatrix';
import HourlyChart from './components/HourlyChart';
import AccuracyLeaderboard from './components/AccuracyLeaderboard';
import HourDetailModal from './components/HourDetailModal';
import ConsensusExplainerModal from './components/ConsensusExplainerModal';
import ApiKeyModal from './components/ApiKeyModal';

import { fetchMultiModelWeather, DEFAULT_CITIES } from './services/weatherApi';
import { computeHourlyConsensus, generateDailySummary } from './services/consensusEngine';
import { calculateModelAccuracy, saveForecastSnapshot } from './services/accuracyTracker';
import { PROVIDER_KEYS, WEATHER_PROVIDERS } from './constants/providers';
import { LayoutGrid, LineChart, Trophy, RefreshCw, AlertCircle, Compass } from 'lucide-react';

export default function App() {
  // Default to Cork, Ireland (Munster)
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITIES[0]);
  const [rawWeatherData, setRawWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [unit, setUnit] = useState(() => localStorage.getItem('omni_weather_unit') || 'C');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [weightingStrategy, setWeightingStrategy] = useState('accuracy'); // 'accuracy' | 'benchmark' | 'equal'
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'chart' | 'accuracy'

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

  // Fetch weather data for selected city
  const loadWeatherData = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMultiModelWeather(city.latitude, city.longitude, city.timezone);
      setRawWeatherData(data);
      setLastUpdated(new Date());

      // Auto-select today from current observation time
      const todayDate = data.current?.time ? data.current.time.split('T')[0] : new Date().toISOString().split('T')[0];
      setSelectedDate(todayDate);
    } catch (err) {
      console.error(err);
      setError('Unable to load weather forecast models. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadWeatherData(selectedCity);
    }
  }, [selectedCity, loadWeatherData]);

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

  // Forward forecast dates: strictly starting from TODAY (todayDateStr) for 7 days!
  // Past days (yesterday, day -2) are kept exclusively for Truth Verification & Past Audit!
  const forecastDates = useMemo(() => {
    if (!processedWeatherData) return [];
    const allDates = processedWeatherData.dates;
    const todayIdx = allDates.indexOf(todayDateStr);
    if (todayIdx >= 0) {
      return allDates.slice(todayIdx, todayIdx + 7);
    }
    return allDates.slice(2, 9);
  }, [processedWeatherData, todayDateStr]);

  // Make sure selectedDate matches today if not already set or invalid
  useEffect(() => {
    if (todayDateStr && (!selectedDate || !forecastDates.includes(selectedDate))) {
      setSelectedDate(todayDateStr);
    }
  }, [todayDateStr, forecastDates, selectedDate]);

  // Hours for currently selected day
  const currentDayHours = useMemo(() => {
    return selectedDate ? hoursByDate[selectedDate] || [] : [];
  }, [selectedDate, hoursByDate]);

  // Daily summary for currently selected day
  const dailySummary = useMemo(() => {
    return generateDailySummary(currentDayHours, selectedDate);
  }, [currentDayHours, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Header & Search */}
      <Header
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        onRefresh={() => loadWeatherData(selectedCity)}
        loading={loading}
        lastUpdated={lastUpdated}
        onOpenExplainer={() => setShowExplainer(true)}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Loading State */}
        {loading && !processedWeatherData && (
          <div className="py-24 text-center">
            <div className="inline-flex p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">Aggregating Ireland & Global Meteorological Models...</h2>
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
            {/* Live Observation & 4 Pillars & TrueCast Consensus Card */}
            <CurrentOverview
              weatherData={processedWeatherData}
              selectedCity={selectedCity}
              dailySummary={dailySummary}
              accuracyReport={accuracyReport}
              unit={unit}
              onOpenExplainer={() => setShowExplainer(true)}
            />

            {/* Day Selector Pills (Strictly starts with Today!) */}
            <DaySelector
              dates={forecastDates}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
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

            {/* Tab 1: Side-by-Side Hourly Matrix */}
            {activeTab === 'matrix' && (
              <HourlyMatrix
                hours={currentDayHours}
                unit={unit}
                onSelectHour={(hour) => setSelectedHour(hour)}
                selectedHour={selectedHour}
                activeProviders={activeProviders}
              />
            )}

            {/* Tab 2: Interactive Chart */}
            {activeTab === 'chart' && (
              <HourlyChart
                hours={currentDayHours}
                unit={unit}
                activeProviders={activeProviders}
                onToggleProvider={handleToggleProvider}
                onSelectAllProviders={handleSelectAllProviders}
                onResetProviders={handleResetProviders}
              />
            )}

            {/* Tab 3: Accuracy Leaderboard & Truth Verification */}
            {activeTab === 'accuracy' && (
              <AccuracyLeaderboard
                accuracyReport={accuracyReport}
                unit={unit}
                onOpenExplainer={() => setShowExplainer(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">WeatherConsensus</span>
            <span>• Tailored for Ireland • Powered by TrueCast AI & Open-Meteo NWP Feeds</span>
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

      {/* Hourly Detail Modal */}
      {selectedHour && (
        <HourDetailModal
          hour={selectedHour}
          unit={unit}
          onClose={() => setSelectedHour(null)}
        />
      )}

      {/* Consensus Explainer Modal */}
      <ConsensusExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
        weightingStrategy={weightingStrategy}
        onSelectWeightingStrategy={(s) => setWeightingStrategy(s)}
      />

      {/* API Key & Feeds Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

    </div>
  );
}
