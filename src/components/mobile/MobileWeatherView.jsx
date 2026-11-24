import React, { useState } from 'react';
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
  onSwitchToDesktop,
}) {
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Maximum mobile content width container (e.g. 480px) */}
      <div className="w-full max-w-md px-3.5 py-3 space-y-4 pb-12">
        
        {/* Top App Bar (Section 1 of Reference Design) */}
        <div className="flex items-center justify-between py-1 px-1">
          {/* Quick city switch menu button */}
          <button
            type="button"
            onClick={() => setIsCitySearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-white shadow-sm active:scale-95 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[130px]">{selectedCity?.name || 'Cork'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Action Icons: Refresh, Search & Settings */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              className={`p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 ${
                isRefreshing ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Refresh weather"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsCitySearchOpen(true)}
              className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95"
              title="Search city"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95"
              title="Settings & Switch View"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Settings Drawer Overlay */}
        {isSettingsOpen && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
              <span>Mobile Preferences</span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Unit Toggle */}
              <button
                type="button"
                onClick={() => onToggleUnit(unit === 'C' ? 'F' : 'C')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-semibold"
              >
                <span className="text-slate-400">Unit</span>
                <span className="text-cyan-400 font-bold">{unit === 'C' ? '°Celsius' : '°Fahrenheit'}</span>
              </button>

              {/* Time Format Toggle */}
              <button
                type="button"
                onClick={() => onToggleTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-semibold"
              >
                <span className="text-slate-400">Clock</span>
                <span className="text-amber-400 font-bold">{timeFormat}</span>
              </button>
            </div>

            {/* Switch to Desktop Button */}
            <button
              type="button"
              onClick={onSwitchToDesktop}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
            >
              <Monitor className="w-4 h-4" />
              <span>Switch to Full Desktop View</span>
            </button>
          </div>
        )}

        {/* City Search Modal */}
        {isCitySearchOpen && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
              <span>Select Location</span>
              <button
                type="button"
                onClick={() => setIsCitySearchOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
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
                      className={`p-2 rounded-xl text-xs font-semibold text-center border truncate transition ${
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
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[11px] text-slate-400">{item.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 1. Hero Card: 3D Scene Backdrop + Giant Temp + Condition + High/Low Bar */}
        <MobileHeroCard
          currentWeather={current}
          isCurrentlyRaining={isCurrentlyRaining}
          selectedCity={selectedCity}
          dailySummary={dailySummary}
          unit={unit}
          timeFormat={timeFormat}
        />

        {/* 2. Live Day Story (Natural Weather Narrative Card) */}
        <WeatherNarrativeCard
          currentWeather={current}
          hourlyHours={hours}
          dailySummary={dailySummary}
          selectedCity={selectedCity}
          unit={unit}
          timeFormat={timeFormat}
        />

        {/* 3. Hourly Forecast (Curve Graph with Temperature / Precipitation / Wind Pills) */}
        <MobileHourlyForecast
          hours={hours}
          unit={unit}
          timeFormat={timeFormat}
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

      </div>
    </div>
  );
}
