import React, { useState, useRef } from 'react';
import {
  Menu,
  Search,
  Settings,
  RefreshCw,
  Monitor,
  MapPin,
  X,
  ChevronDown,
} from 'lucide-react';
import MobileHeroCard from './MobileHeroCard';
import MobileHourlyForecast from './MobileHourlyForecast';
import MobileDailyForecast from './MobileDailyForecast';
import MobilePrecipitationGraph from './MobilePrecipitationGraph';
import MobileWeatherGrid from './MobileWeatherGrid';
import MobileAirQualityCard from './MobileAirQualityCard';
import MobileSunMoonCard from './MobileSunMoonCard';
import MobileDetailedHourlyModal from './MobileDetailedHourlyModal';
import WeatherNarrativeCard from '../WeatherNarrativeCard';
import { DEFAULT_CITIES, searchLocations } from '../../services/weatherApi';

export default function MobileWeatherView({
  weatherData,
  selectedCity,
  onSelectCity,
  dailySummary,
  unit = 'C',
  onToggleUnit,
  timeFormat = '24h',
  onToggleTimeFormat,
  onRefresh,
  isRefreshing = false,
  refreshInterval = 30,
  onChangeRefreshInterval,
  onSwitchToDesktop,
}) {
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailedHourlyOpen, setIsDetailedHourlyOpen] = useState(false);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(null);
  const mouseStartY = useRef(null);

  if (!weatherData) return null;

  const { current, hours, dates, airQuality } = weatherData;
  const isCurrentlyRaining = current.precipitation > 0 || current.weatherCode >= 50;

  // Group hours by date
  const hoursByDate = {};
  hours.forEach((h) => {
    if (!hoursByDate[h.date]) hoursByDate[h.date] = [];
    hoursByDate[h.date].push(h);
  });

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchLocations(q);
      setSearchResults(res || []);
    } catch (e) {
      console.warn('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitySelect = (city) => {
    onSelectCity(city);
    setIsCitySearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Pull-to-refresh touch & mouse gesture handlers
  const handleTouchStart = (e) => {
    if (window.scrollY <= 5 && !isRefreshing) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null || isRefreshing) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && window.scrollY <= 5) {
      const pull = Math.min(diff * 0.42, 80);
      setPullY(pull);
      setIsPulling(true);
    } else {
      setPullY(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current !== null) {
      if (pullY >= 48 && !isRefreshing) {
        onRefresh();
      }
      touchStartY.current = null;
      setPullY(0);
      setIsPulling(false);
    }
  };

  const handleMouseDown = (e) => {
    if (window.scrollY <= 5 && !isRefreshing && e.button === 0) {
      mouseStartY.current = e.clientY;
    }
  };

  const handleMouseMove = (e) => {
    if (mouseStartY.current === null || isRefreshing) return;
    const diff = e.clientY - mouseStartY.current;
    if (diff > 0 && window.scrollY <= 5) {
      const pull = Math.min(diff * 0.42, 80);
      setPullY(pull);
      setIsPulling(true);
    }
  };

  const handleMouseUp = () => {
    if (mouseStartY.current !== null) {
      if (pullY >= 48 && !isRefreshing) {
        onRefresh();
      }
      mouseStartY.current = null;
      setPullY(0);
      setIsPulling(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Pull-To-Refresh Visual Indicator Pill */}
      {(isPulling || isRefreshing || pullY > 0) && (
        <div
          style={{
            transform: `translate(-50%, ${isRefreshing ? 14 : Math.min(pullY, 50)}px)`,
            opacity: pullY > 8 || isRefreshing ? 1 : 0,
          }}
          className="fixed top-2 left-1/2 z-50 pointer-events-none transition-transform duration-100 ease-out"
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md text-xs font-bold text-cyan-300">
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing || pullY >= 48 ? 'animate-spin text-cyan-400' : 'text-slate-400'
              }`}
            />
            <span>
              {isRefreshing
                ? 'Refreshing weather...'
                : pullY >= 48
                ? 'Release to refresh'
                : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Maximum mobile content width container (e.g. 480px) */}
      <div className="w-full max-w-md px-3.5 py-2.5 space-y-4 pb-12">
        
        {/* Quick Settings Modal Overlay */}
        {isSettingsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSettingsOpen(false);
            }}
          >
            <div className="w-full max-w-sm mt-12 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                <span>Mobile Preferences</span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Unit Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleUnit(unit === 'C' ? 'F' : 'C')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-semibold cursor-pointer hover:border-slate-700"
                >
                  <span className="text-slate-400">Unit</span>
                  <span className="text-cyan-400 font-bold">{unit === 'C' ? '°Celsius' : '°Fahrenheit'}</span>
                </button>

                {/* Time Format Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-semibold cursor-pointer hover:border-slate-700"
                >
                  <span className="text-slate-400">Clock</span>
                  <span className="text-amber-400 font-bold">{timeFormat}</span>
                </button>
              </div>

              {/* Auto-Refresh Setting (Options: 15m, 30m Default, 1h) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Auto-Refresh Interval</span>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {refreshInterval === 60 ? 'Every 1 hour' : (refreshInterval > 0 ? `Every ${refreshInterval}m` : 'Off')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '15 min', value: 15 },
                    { label: '30 min (Def)', value: 30 },
                    { label: '1 hour', value: 60 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChangeRefreshInterval && onChangeRefreshInterval(opt.value)}
                      className={`py-2 px-1 rounded-xl text-center text-xs font-semibold transition border cursor-pointer ${
                        refreshInterval === opt.value
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Switch to Desktop Button */}
              <button
                type="button"
                onClick={onSwitchToDesktop}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Switch to Full Desktop View</span>
              </button>
            </div>
          </div>
        )}

        {/* City Search Modal Overlay */}
        {isCitySearchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCitySearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }
            }}
          >
            <div className="w-full max-w-sm mt-12 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                <span>Select Location</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCitySearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search Irish or world city..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              {/* Default Quick Cities */}
              {searchQuery.trim().length === 0 ? (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 px-1">
                    Popular Hubs
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DEFAULT_CITIES.slice(0, 6).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleCitySelect(c)}
                        className={`p-2 rounded-xl text-xs font-semibold text-center border truncate transition cursor-pointer ${
                          selectedCity?.name === c.name
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                            : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((item) => (
                    <button
                      key={`${item.id}-${item.name}`}
                      type="button"
                      onClick={() => handleCitySelect(item)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[11px] text-slate-400">{item.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. Hero Card: 3D Scene Backdrop + Top Controls + Giant Temp */}
        <MobileHeroCard
          currentWeather={current}
          isCurrentlyRaining={isCurrentlyRaining}
          selectedCity={selectedCity}
          dailySummary={dailySummary}
          unit={unit}
          timeFormat={timeFormat}
          onOpenCitySearch={() => setIsCitySearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {/* 2. Live Day Story (Natural Weather Narrative Card) */}
        <WeatherNarrativeCard
          currentWeather={current}
          hourlyHours={hours}
          dailySummary={dailySummary}
          selectedCity={selectedCity}
          unit={unit}
          timeFormat={timeFormat}
          isMobile={true}
        />

        {/* 3. Hourly Forecast (Curve Graph with Temperature / Precipitation / Wind Pills) */}
        <MobileHourlyForecast
          hours={hours}
          dailySummary={dailySummary}
          unit={unit}
          timeFormat={timeFormat}
          onOpenDetailedHourly={() => setIsDetailedHourlyOpen(true)}
        />

        {/* 4. Daily Forecast (7-Day Vertical Range Bars) */}
        <MobileDailyForecast
          dates={dates}
          hoursByDate={hoursByDate}
          unit={unit}
        />

        {/* 5. Precipitation Timeline Graph */}
        <MobilePrecipitationGraph
          hours={hours}
          timeFormat={timeFormat}
        />

        {/* 6. Current Weather 3x3 Atmospheric Grid */}
        <MobileWeatherGrid
          currentWeather={current}
          unit={unit}
        />

        {/* 7. Air Quality Card */}
        <MobileAirQualityCard
          airQuality={airQuality}
        />

        {/* 8. Sun and Moon Arc Card */}
        <MobileSunMoonCard
          currentWeather={current}
          timeFormat={timeFormat}
        />

        {/* Bottom Footer Actions */}
        <div className="pt-4 text-center space-y-3">
          <button
            type="button"
            onClick={onSwitchToDesktop}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch to Desktop View</span>
          </button>

          <p className="text-[10px] text-slate-500">
            WeatherConsensus &bull; Multi-Model Consensus & Accuracy Engine &bull; Ireland Edition
          </p>
        </div>

        {/* Comprehensive 24h Detailed Hourly Modal (Weawow Reference Style) */}
        {isDetailedHourlyOpen && (
          <MobileDetailedHourlyModal
            hours={hours}
            selectedCity={selectedCity}
            unit={unit}
            timeFormat={timeFormat}
            onClose={() => setIsDetailedHourlyOpen(false)}
          />
        )}

      </div>
    </div>
  );
}
