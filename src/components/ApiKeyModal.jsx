import React, { useState } from 'react';
import { X, Key, CheckCircle, Shield, ExternalLink, Zap, Info } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [openWeatherKey, setOpenWeatherKey] = useState(() => localStorage.getItem('omni_owm_key') || '');
  const [weatherApiKey, setWeatherApiKey] = useState(() => localStorage.getItem('omni_weatherapi_key') || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('omni_owm_key', openWeatherKey.trim());
    localStorage.setItem('omni_weatherapi_key', weatherApiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                API Keys & Provider Status
              </h2>
              <p className="text-xs text-slate-400">
                Manage data feeds and commercial weather connections
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Active Free Tier Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Good News: No API Key Required to Use This App!</span>
            </div>
            <p className="text-emerald-300/80 leading-relaxed text-xs">
              WeatherConsensus is connected to <strong>8 world-class national weather models</strong> (ECMWF, MET Norway/Yr.no, UK Met Office, DWD ICON, Météo-France, NOAA GFS, GEM, and JMA). 
              All of these operate completely <strong>free with zero sign-in, zero credit card, and zero rate limits</strong> for standard use.
            </p>
          </div>

          {/* Ireland Specialty Info */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Tailored for Ireland & Cork</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              For Cork and Ireland, your forecasts are powered by the <strong>UK Met Office</strong> (Irish Sea & British Isles marine radar), <strong>MET Norway / Yr.no</strong> (the most respected rain/front model in Ireland), <strong>ECMWF</strong> (European Centre), and <strong>Météo-France</strong> (Atlantic lows).
            </p>
          </div>

          {/* Optional Commercial Keys */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Optional: Custom Commercial API Keys
              </span>
              <span className="text-[10px] text-slate-400">Leave blank if not using</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                OpenWeatherMap API Key (Optional)
              </label>
              <input
                type="password"
                value={openWeatherKey}
                onChange={(e) => setOpenWeatherKey(e.target.value)}
                placeholder="e.g. 8f4a2b91c..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                WeatherAPI.com Key (Optional)
              </label>
              <input
                type="password"
                value={weatherApiKey}
                onChange={(e) => setWeatherApiKey(e.target.value)}
                placeholder="e.g. 5d1f8e..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="text-[11px] text-slate-400">
                Keys are stored safely in your browser localStorage.
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
              >
                {saved ? 'Saved Successfully!' : 'Save Settings'}
              </button>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
