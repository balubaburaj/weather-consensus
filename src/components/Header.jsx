import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, RefreshCw, Sparkles, Key, Settings, X, Thermometer, Clock } from 'lucide-react';
import { searchLocations, DEFAULT_CITIES } from '../services/weatherApi';
import { formatTime } from '../utils/units';

export default function Header({
  selectedCity,
  onSelectCity,
  unit,
  onToggleUnit,
  timeFormat = '24h',
  onToggleTimeFormat,
  onRefresh,
  loading,
  lastUpdated,
  refreshInterval = 10,
  onChangeRefreshInterval,
  onOpenExplainer,
  onOpenApiKeyModal,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  // Time-ago ticker: updates relative timestamp display every 30 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeAgo = (date) => {
    if (!date) return 'Syncing...';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  // Close dropdown or settings on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(query);
      setSuggestions(results);
      setIsSearching(false);
      setShowDropdown(true);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city) => {
    onSelectCity(city);
    setQuery('');
    setShowDropdown(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectCity({
          name: 'Current Location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          country: 'GPS Detected',
          timezone: 'Europe/Dublin',
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not access current location. Please check your browser permissions.');
      }
    );
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-black text-xl">
              <span>🌤️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  WeatherConsensus
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  TrueCast AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Model Aggregator & Accuracy Engine • Ireland Edition
              </p>
            </div>
          </div>

          {/* Search bar & Controls */}
          <div className="flex flex-1 max-w-xl items-center gap-2" ref={dropdownRef}>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Search any town, city, or place (e.g. Cork, Galway, Dublin, Kinsale)..."
                className="w-full pl-10 pr-10 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-inner"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
                  {suggestions.map((item) => (
                    <button
                      key={`${item.id}-${item.latitude}-${item.longitude}`}
                      onClick={() => handleSelect(item)}
                      className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {item.name}
                            {item.admin1 ? <span className="text-xs text-slate-400 font-normal">, {item.admin1}</span> : null}
                          </div>
                          <div className="text-xs text-slate-400">{item.country}</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Locate Button */}
            <button
              onClick={handleUseLocation}
              title="Use Current Location"
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-400 transition-all"
            >
              <Navigation className="w-4 h-4" />
            </button>

            {/* Quick Actions: Manual Refresh & Settings Gear */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Manual Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={loading}
                title={`Manual Refresh • Last updated: ${lastUpdated ? formatTime(lastUpdated, timeFormat) : 'Never'}`}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm group"
                aria-label="Refresh All Forecasts"
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform ${loading ? 'animate-spin text-cyan-400' : 'group-hover:rotate-180 text-slate-400'}`} />
                <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                  {formatTimeAgo(lastUpdated)}
                </span>
              </button>

              {/* Settings Gear Popover Menu Trigger */}
              <div className="relative" ref={settingsRef}>
                <button
                  type="button"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className={`px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    showSettings
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                  title="Preferences & Settings"
                  aria-label="Settings"
                >
                  <Settings className={`w-4 h-4 transition-transform duration-300 ${showSettings ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">Settings</span>
                  <span className="hidden md:inline text-[10px] font-mono text-cyan-400/90 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                    {unit === 'C' ? '°C' : '°F'} • {timeFormat}
                  </span>
                </button>

                {/* Comprehensive Settings Flyout */}
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-xs backdrop-blur-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">Preferences &amp; Settings</div>
                          <div className="text-[10px] text-slate-400">Personalize weather units &amp; data sync</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="Close Settings"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* SECTION 1: Units & Display */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Units &amp; Display
                      </div>

                      {/* Temperature Unit */}
                      <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-medium text-xs">Temperature</span>
                        </div>
                        <div className="flex rounded-lg bg-slate-900 border border-slate-700/80 p-0.5">
                          <button
                            type="button"
                            onClick={() => onToggleUnit('C')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              unit === 'C' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            °C Celsius
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleUnit('F')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              unit === 'F' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            °F Fahrenheit
                          </button>
                        </div>
                      </div>

                      {/* Time Format */}
                      <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-medium text-xs">Time Format</span>
                        </div>
                        <div className="flex rounded-lg bg-slate-900 border border-slate-700/80 p-0.5">
                          <button
                            type="button"
                            onClick={() => onToggleTimeFormat && onToggleTimeFormat('24h')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              timeFormat === '24h' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            24h (13:00)
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleTimeFormat && onToggleTimeFormat('12h')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              timeFormat === '12h' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            12h AM/PM
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Auto-Sync & Refresh Interval */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Background Auto-Refresh
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          {refreshInterval > 0 ? `Every ${refreshInterval}m` : 'Off'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: '5 min', value: 5 },
                          { label: '10 min (Rec.)', value: 10 },
                          { label: '15 min', value: 15 },
                          { label: '30 min', value: 30 },
                          { label: 'Manual Only', value: 0 },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChangeRefreshInterval && onChangeRefreshInterval(opt.value)}
                            className={`px-2 py-1.5 rounded-xl text-center text-xs font-semibold transition-all cursor-pointer border ${
                              refreshInterval === opt.value
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm font-bold'
                                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                            } ${opt.value === 0 ? 'col-span-2' : ''}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        • Pauses when tab is hidden. Syncs on return if away 5+ mins.
                      </p>
                    </div>

                    {/* SECTION 3: Models & Feeds Setup */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Models &amp; Data Feeds
                      </div>

                      {/* Consensus Model Weighting Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettings(false);
                          if (onOpenExplainer) onOpenExplainer();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                              Consensus Model &amp; AI Weights
                            </div>
                            <div className="text-[10px] text-slate-400">
                              View 8 NWP model blending &amp; weights
                            </div>
                          </div>
                        </div>
                        <span className="text-slate-400 group-hover:text-white transition-colors text-xs font-bold">→</span>
                      </button>

                      {/* API Keys & Providers Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettings(false);
                          if (onOpenApiKeyModal) onOpenApiKeyModal();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                            <Key className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300 transition-colors">
                              API Keys &amp; Data Status
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Free feeds active • Configure provider keys
                            </div>
                          </div>
                        </div>
                        <span className="text-slate-400 group-hover:text-white transition-colors text-xs font-bold">→</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preset Cities Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 text-xs no-scrollbar">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mr-1 shrink-0">
            Quick Cities:
          </span>
          {DEFAULT_CITIES.map((city) => {
            const isSelected = selectedCity?.name === city.name && selectedCity?.country === city.country;
            return (
              <button
                key={`${city.name}-${city.country}`}
                onClick={() => handleSelect(city)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all shrink-0 border flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm font-semibold'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                {city.countryCode === 'IE' ? '🇮🇪' : ''}
                <span>{city.name}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
