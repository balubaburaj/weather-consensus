import React from 'react';
import { X, Sparkles, CheckCircle2, Shield, Brain, Sliders, BarChart3, Database } from 'lucide-react';
import { WEATHER_PROVIDERS } from '../constants/providers';

export default function ConsensusExplainerModal({
  isOpen,
  onClose,
  weightingStrategy,
  onSelectWeightingStrategy,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                How TrueCast Aggregates & Verifies Weather
              </h2>
              <p className="text-xs text-slate-400">
                Solving the multi-app dilemma with empirical consensus and ground-truth verification
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
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          
          {/* The Dilemma & The Solution */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              The Multi-Provider Problem & The Solution
            </h3>
            <p>
              Different weather apps use different underlying Numerical Weather Prediction (NWP) models (e.g., Apple Weather uses ECMWF, Carrot often uses Tomorrow.io or GFS, Dark Sky used radar nowcasting). 
              Looking across multiple apps causes confusion: which one is going to be right?
            </p>
            <p>
              TrueCast solves this by pulling <strong>7 global and regional operational models directly from national meteorological centers</strong> into a unified window, cross-verifying them against actual recorded weather, and generating a self-calibrating ensemble consensus.
            </p>
          </div>

          {/* 4 Pillars of our Ensemble */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold mb-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                1. Ground-Truth Verification
              </div>
              <p className="text-slate-400">
                Near the time of the event, real weather happens. We continuously grade each model's past 48-hour forecasts against observed ground truth to compute empirical Mean Absolute Error (MAE) and rain hit rates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold mb-1.5 text-xs">
                <Sliders className="w-4 h-4 text-cyan-400" />
                2. Dynamic Accuracy Weighting
              </div>
              <p className="text-slate-400">
                Instead of a simple unweighted average, models that perform best in your current region are automatically given higher voting weight in our consensus calculation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold mb-1.5 text-xs">
                <Shield className="w-4 h-4 text-blue-400" />
                3. Outlier Glitch Elimination
              </div>
              <p className="text-slate-400">
                Single models occasionally suffer from localized grid convective blow-ups (e.g. predicting 12mm rain when 6 other models predict 0mm). Trimmed median algorithms filter out isolated phantom storms.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold mb-1.5 text-xs">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                4. Model Agreement & Divergence Alerts
              </div>
              <p className="text-slate-400">
                When all models agree (e.g. 95% consensus), you can plan with certainty. When models diverge, TrueCast explicitly flags the exact conflicting models and time windows.
              </p>
            </div>

          </div>

          {/* Weighting Strategy Selector */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Choose Ensemble Strategy:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onSelectWeightingStrategy('accuracy')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  weightingStrategy === 'accuracy'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-cyan-300">TrueCast AI (Adaptive)</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dynamically weighted based on past 48h ground-truth accuracy leaderboard.
                </div>
              </button>

              <button
                onClick={() => onSelectWeightingStrategy('benchmark')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  weightingStrategy === 'benchmark'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">ECMWF & ICON Benchmark</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Prioritizes European Centre 25km IFS and German DWD ICON models.
                </div>
              </button>

              <button
                onClick={() => onSelectWeightingStrategy('equal')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  weightingStrategy === 'equal'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">Equal Weight Ensemble</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  All 7 models receive identical 14.3% voting weight.
                </div>
              </button>
            </div>
          </div>

          {/* NWP Providers List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Integrated Operational Weather Models:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {Object.values(WEATHER_PROVIDERS).map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: p.color }} />
                  <div>
                    <div className="font-bold text-slate-200">{p.name} ({p.origin})</div>
                    <div className="text-slate-400">{p.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
          >
            Got it, Let's Compare
          </button>
        </div>

      </div>
    </div>
  );
}
