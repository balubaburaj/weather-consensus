import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, RefreshCw, Sparkles, Key } from 'lucide-react';
import { searchLocations, DEFAULT_CITIES } from '../services/weatherApi';

export default function Header({
  selectedCity,
  onSelectCity,
  unit,
  onToggleUnit,
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
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const dropdownRef = useRef(null);
  const refreshMenuRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (refreshMenuRef.current && !refreshMenuRef.current.contains(e.target)) {
        setShowRefreshMenu(false);
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

            {/* Unit Toggle */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-700/80 p-0.5">
              <button
                onClick={() => onToggleUnit('C')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  unit === 'C' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => onToggleUnit('F')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  unit === 'F' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>

            {/* Refresh & Auto-Sync Control */}
            <div className="relative" ref={refreshMenuRef}>
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 shadow-sm">
                
                {/* Manual Refresh Button */}
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  title={`Manual Refresh (Last updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'})`}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-all disabled:opacity-50 cursor-pointer"
                  aria-label="Refresh All Forecasts"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                {/* Auto-Sync Badge / Menu Trigger */}
                <button
                  type="button"
                  onClick={() => setShowRefreshMenu((prev) => !prev)}
                  title={`Auto-refresh interval: ${refreshInterval > 0 ? `every ${refreshInterval}m` : 'Off'}. Click to adjust.`}
                  className="px-2 py-1 flex items-center gap-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer border-l border-slate-800"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      refreshInterval > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                    {formatTimeAgo(lastUpdated)}
                  </span>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {refreshInterval > 0 ? `${refreshInterval}m` : 'Off'}
                  </span>
                </button>
              </div>

              {/* Auto-Refresh Options Dropdown */}
              {showRefreshMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Auto-Refresh Interval
                  </div>
                  <div className="mt-1 space-y-1">
                    {[
                      { label: '5 minutes', value: 5, badge: 'High frequency' },
                      { label: '10 minutes', value: 10, badge: 'Recommended' },
                      { label: '15 minutes', value: 15, badge: 'Light bandwidth' },
                      { label: '30 minutes', value: 30, badge: 'Conservative' },
                      { label: 'Manual Only', value: 0, badge: 'No background calls' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (onChangeRefreshInterval) onChangeRefreshInterval(opt.value);
                          setShowRefreshMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          refreshInterval === opt.value
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-xs">{opt.label}</div>
                          <div className="text-[9px] text-slate-400">{opt.badge}</div>
                        </div>
                        {refreshInterval === opt.value && <span className="text-cyan-400 font-bold text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 px-2 text-[10px] text-slate-400 leading-tight">
                    Pauses automatically when tab is hidden or offline. Rate-limit protected.
                  </div>
                </div>
              )}
            </div>

            {/* API Keys Modal */}
            <button
              onClick={onOpenApiKeyModal}
              title="API Keys & Data Status"
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-1.5"
            >
              <Key className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-medium">Free Feeds Active</span>
            </button>

            {/* How it Works / Consensus Settings */}
            <button
              onClick={onOpenExplainer}
              title="How TrueCast Consensus Works"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-cyan-400 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Consensus Model</span>
            </button>
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
