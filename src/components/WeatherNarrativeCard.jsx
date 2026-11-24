import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { generateWeatherNarrative } from '../services/weatherNarrativeEngine';

export default function WeatherNarrativeCard({
  currentWeather,
  hourlyHours,
  dailySummary,
  selectedCity,
  unit = 'C',
  timeFormat = '24h',
  isMobile = false,
}) {
  const [activeStyle, setActiveStyle] = useState(() => {
    return localStorage.getItem('omni_narrative_style') || 'natural';
  });

  const handleStyleChange = (style) => {
    setActiveStyle(style);
    localStorage.setItem('omni_narrative_style', style);
  };

  const narrative = generateWeatherNarrative({
    current: currentWeather,
    hourlyHours,
    dailySummary,
    selectedCity,
    unit,
    timeFormat,
  });

  if (!narrative) return null;

  if (isMobile) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md">
        {/* Hero Narrative Headline */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-3 shadow-inner">
          <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-medium tracking-wide">
            {narrative.naturalHero}
          </p>
        </div>

        {/* 3 Full-Width Vertically Stacked Micro-Cards: NOW, LATER, HEADS-UP */}
        <div className="flex flex-col gap-2.5">
          {/* Slot A: NOW */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Now
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                {narrative.microFields.now}
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Observed condition</span>
              <span className="font-semibold text-cyan-300">{narrative.temperature}</span>
            </div>
          </div>

          {/* Slot B: LATER */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Later
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                {narrative.microFields.later}
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Rest of day shift</span>
              <span className="font-semibold text-amber-300">
                {narrative.nextShiftMeta.time ? `@ ${narrative.nextShiftMeta.time}` : 'Tonight'}
              </span>
            </div>
          </div>

          {/* Slot C: HEADS-UP */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Heads-up
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                {narrative.microFields.headsUp}
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Practical advice</span>
              <span className="font-semibold text-emerald-300">Next 12-14 hrs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-indigo-950/20 to-slate-950/95 border border-slate-700/60 p-5 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-72 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with tag and Style Switcher buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-cyan-400">
                Live Day Story
              </span>
              <span className="text-[11px] text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-300">
                {narrative.cityName} (Now through Tonight)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Natural consensus forecast looking out the window
            </p>
          </div>
        </div>

        {/* Style Selector Pills: Option 1 (Natural), Option 3 (Irish), Option 2 (Commuter) */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleStyleChange('natural')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeStyle === 'natural'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Natural & Practical heads-up like stepping outside"
          >
            Natural
          </button>
          <button
            type="button"
            onClick={() => handleStyleChange('irish')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeStyle === 'irish'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Irish-flavoured local composite expressions"
          >
            ☘️ Irish Flair
          </button>
          <button
            type="button"
            onClick={() => handleStyleChange('commuter')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeStyle === 'commuter'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="3-Second punchy commuter glance"
          >
            Commuter
          </button>
        </div>
      </div>

      {/* Hero Narrative Display (Option 1, 2, or 3 based on activeStyle) */}
      <div className="mb-5">
        {activeStyle === 'natural' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
            <p className="text-base sm:text-lg leading-relaxed text-slate-100 font-medium tracking-wide">
              {narrative.naturalHero}
            </p>
          </div>
        )}

        {activeStyle === 'irish' && (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold uppercase tracking-wider">
                ☘️ {narrative.irishTitle}
              </span>
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-emerald-50 font-medium tracking-wide">
              {narrative.irishNarrative}
            </p>
          </div>
        )}

        {activeStyle === 'commuter' && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                ⚡ 3-Second Glance
              </span>
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-amber-50 font-medium tracking-wide font-mono">
              {narrative.commuterGlance}
            </p>
          </div>
        )}
      </div>

      {/* Option 4: Split "Now / Later / Gear" Micro-Copy Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Slot A: NOW */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Now
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-snug">
              {narrative.microFields.now}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Observed condition</span>
            <span className="font-semibold text-cyan-300">{narrative.temperature}</span>
          </div>
        </div>

        {/* Slot B: LATER / NEXT SHIFT */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Later
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-snug">
              {narrative.microFields.later}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Rest of day shift</span>
            <span className="font-semibold text-amber-300">
              {narrative.nextShiftMeta.time ? `@ ${narrative.nextShiftMeta.time}` : 'Tonight'}
            </span>
          </div>
        </div>

        {/* Slot C: HEADS-UP / GEAR ACTION */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Heads-up
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-snug">
              {narrative.microFields.headsUp}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Practical rule</span>
            <span className="font-semibold text-emerald-300">Gear & Safety</span>
          </div>
        </div>
      </div>
    </div>
  );
}
