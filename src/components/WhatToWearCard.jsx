import React, { useState } from 'react';
import {
  Shirt,
  Sparkles,
  Shield,
  Sun,
  Wind,
  Umbrella,
  Layers,
  ChevronDown,
  ChevronUp,
  Glasses,
  CheckCircle,
  HelpCircle,
  Compass
} from 'lucide-react';
import { getClothingSuggestions } from '../services/clothingEngine';

export default function WhatToWearCard({
  current,
  dailySummary,
  selectedDayHours,
  unit,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [mode, setMode] = useState('casual'); // 'casual' | 'commute' | 'active'

  if (!current) return null;

  const suggestions = getClothingSuggestions({
    temp: current.temperature,
    apparentTemp: current.apparentTemperature,
    windSpeed: current.windSpeed,
    rainType: dailySummary?.peakRainType || { type: 'dry', intensity: 'Dry' },
    weatherCode: current.weatherCode,
    isDay: current.isDay,
    mode,
  });

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-indigo-950/40 border border-slate-700/80 shadow-xl overflow-hidden backdrop-blur-md mb-8">
      
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shrink-0">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                What to Wear &amp; Thermal Comfort Guide
              </h2>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${suggestions.thermalBadge}`}>
                {suggestions.thermalTitle}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Smart layering advice tailored for the true cold and Atlantic wind chill (not just rain!)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mode switch */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-700/70 p-0.5 text-xs">
            <button
              onClick={() => setMode('casual')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'casual' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Everyday
            </button>
            <button
              onClick={() => setMode('commute')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'commute' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Commute / Work
            </button>
            <button
              onClick={() => setMode('active')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'active' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Outdoor / Active
            </button>
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse Outfit Guide' : 'Expand Outfit Guide'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          
          {/* The Sunny Deception / Wind Chill Reality Banner */}
          {suggestions.sunRealityCheck && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 leading-relaxed ${
              suggestions.sunRealityCheck.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
            }`}>
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>{suggestions.sunRealityCheck.title}</span>
                </div>
                <p className="mt-1 text-xs opacity-90">
                  {suggestions.sunRealityCheck.message}
                </p>
              </div>
            </div>
          )}

          {/* 4-Column Layer-by-Layer Outfit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. Outerwear */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">1. Outer Layer</span>
                  <span className="text-base">🧥</span>
                </div>
                <div className="font-extrabold text-white text-sm">
                  {suggestions.outerwear.name}
                </div>
                <p className="text-slate-400 text-[11px] mt-1.5 leading-normal">
                  {suggestions.outerwear.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-semibold text-indigo-300">
                {suggestions.layeringSummary}
              </div>
            </div>

            {/* 2. Mid / Base Layer */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">2. Mid / Base Layer</span>
                  <span className="text-base">🧶</span>
                </div>
                <div className="font-extrabold text-white text-sm">
                  {suggestions.midLayer.name}
                </div>
                <p className="text-slate-400 text-[11px] mt-1.5 leading-normal">
                  {suggestions.midLayer.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-medium">
                Breathable heat retention
              </div>
            </div>

            {/* 3. Bottoms */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">3. Pants / Bottoms</span>
                  <span className="text-base">👖</span>
                </div>
                <div className="font-extrabold text-white text-sm">
                  {suggestions.bottoms.name}
                </div>
                <p className="text-slate-400 text-[11px] mt-1.5 leading-normal">
                  {suggestions.bottoms.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-medium">
                Draft &amp; splash resistance
              </div>
            </div>

            {/* 4. Footwear */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">4. Footwear &amp; Socks</span>
                  <span className="text-base">🥾</span>
                </div>
                <div className="font-extrabold text-white text-sm">
                  {suggestions.footwear.name}
                </div>
                <p className="text-slate-400 text-[11px] mt-1.5 leading-normal">
                  {suggestions.footwear.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-medium">
                Ground cold &amp; moisture barrier
              </div>
            </div>

          </div>

          {/* Accessories & Gear Pills Bar */}
          {suggestions.accessories.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-slate-400">
                  Recommended Gear &amp; Accessories:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {suggestions.accessories.map((acc) => (
                    <div
                      key={acc.item}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
                      title={acc.reason}
                    >
                      <span>{acc.icon}</span>
                      <span>{acc.item}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline font-normal">({acc.reason})</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 italic">
                💡 Tip: Low winter sun produces harsh eye glare even in cold weather.
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
