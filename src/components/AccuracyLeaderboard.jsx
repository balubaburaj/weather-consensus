import React, { useState } from 'react';
import {
  Award,
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { WEATHER_PROVIDERS } from '../constants/providers';
import { formatTemp, formatPrecip, formatTime } from '../utils/units';
import { WeatherIcon } from '../utils/weatherIcons';

export default function AccuracyLeaderboard({
  accuracyReport,
  unit,
  timeFormat = '24h',
  onOpenExplainer,
}) {
  const [showTruthAudit, setShowTruthAudit] = useState(false);

  if (!accuracyReport || !accuracyReport.rankings) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-850">
        Evaluating provider forecast accuracy...
      </div>
    );
  }

  const { rankings, evaluatedHoursCount, pastHoursSample } = accuracyReport;
  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 backdrop-blur-sm mb-8">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Forecast Accuracy Audit
            </span>
            <span className="text-xs text-slate-400">
              Evaluated over past {evaluatedHoursCount} hours of ground truth
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Who is the Most Reliable Weather Predictor?
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            All APIs predict tomorrow. Near the time, they adapt to reality. By auditing what each provider forecasted hours earlier against recorded ground truth observations, here is who actually got it right.
          </p>
        </div>

        <button
          onClick={onOpenExplainer}
          className="self-start md:self-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>How TrueCast Blends the Best</span>
        </button>
      </div>

      {/* Podium Cards for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Rank 2 (Silver) */}
        {top2 && (
          <div className="order-2 md:order-1 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700 p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl">🥈</span>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  #2 Runner Up
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {top2.provider.name}
                </h3>
                <p className="text-xs text-slate-400">{top2.provider.organization}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-200">{top2.overallScore}%</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Reliability</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Avg Temp Error</div>
                <div className="font-semibold text-slate-200">±{top2.mae}°C</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Rain Hit Rate</div>
                <div className="font-semibold text-emerald-400">{top2.hitRate}%</div>
              </div>
            </div>
            
            <div className="mt-3 text-[11px] text-cyan-300 font-medium bg-slate-950/40 px-2 py-1 rounded-lg">
              {top2.highlight}
            </div>
          </div>
        )}

        {/* Rank 1 (Gold Winner) */}
        {top1 && (
          <div className="order-1 md:order-2 rounded-2xl bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-2 border-amber-500/50 p-5 relative overflow-hidden shadow-xl shadow-amber-500/5 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-3xl">🥇</span>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  #1 Best Predictor
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  {top1.provider.name}
                </h3>
                <p className="text-xs text-slate-300">{top1.provider.organization}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-amber-400">{top1.overallScore}%</div>
                <div className="text-[10px] text-amber-400/80 uppercase font-bold">Reliability</div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Avg Temp Error (MAE)</div>
                <div className="text-sm font-bold text-emerald-400">±{top1.mae}°C</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Rain Hit Rate</div>
                <div className="text-sm font-bold text-emerald-400">{top1.hitRate}%</div>
              </div>
            </div>

            <div className="mt-3.5 text-xs text-amber-200 font-bold bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span>{top1.highlight}</span>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top3 && (
          <div className="order-3 md:order-3 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700 p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl">🥉</span>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                  #3 Third Place
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {top3.provider.name}
                </h3>
                <p className="text-xs text-slate-400">{top3.provider.organization}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-200">{top3.overallScore}%</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Reliability</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Avg Temp Error</div>
                <div className="font-semibold text-slate-200">±{top3.mae}°C</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Rain Hit Rate</div>
                <div className="font-semibold text-emerald-400">{top3.hitRate}%</div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-cyan-300 font-medium bg-slate-950/40 px-2 py-1 rounded-lg">
              {top3.highlight}
            </div>
          </div>
        )}

      </div>

      {/* Comprehensive Full Ranking Scorecard Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
              <th className="p-3">Rank</th>
              <th className="p-3">Provider / Model</th>
              <th className="p-3">Reliability Index</th>
              <th className="p-3">Avg Temp Error (MAE)</th>
              <th className="p-3">Temp Bias</th>
              <th className="p-3">Rain Hit Rate</th>
              <th className="p-3">False Alarms</th>
              <th className="p-3">Model Specialty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rankings.map((r) => (
              <tr key={r.providerId} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-bold font-mono">
                  {r.rank === 1 ? '🥇 #1' : r.rank === 2 ? '🥈 #2' : r.rank === 3 ? '🥉 #3' : `#${r.rank}`}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.provider.color }} />
                    <div>
                      <div className="font-bold text-slate-100">{r.provider.name}</div>
                      <div className="text-[10px] text-slate-400">{r.provider.origin}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          r.overallScore >= 90 ? 'bg-emerald-500' : r.overallScore >= 80 ? 'bg-cyan-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${r.overallScore}%` }}
                      />
                    </div>
                    <span className="font-bold font-mono text-slate-200">{r.overallScore}%</span>
                  </div>
                </td>
                <td className="p-3 font-mono font-semibold text-slate-200">
                  ±{r.mae}°C
                </td>
                <td className="p-3 font-mono text-slate-400">
                  {r.bias > 0 ? `+${r.bias}°C warm` : r.bias < 0 ? `${r.bias}°C cool` : '0.0° neutral'}
                </td>
                <td className="p-3 font-mono text-emerald-400 font-semibold">
                  {r.hitRate}%
                </td>
                <td className="p-3 font-mono text-slate-400">
                  {r.falseAlarmRate}%
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium">
                    {r.highlight}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Collapsible Truth Audit Detail: Hour-by-Hour Actual vs Prediction */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <button
          onClick={() => setShowTruthAudit(!showTruthAudit)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Inspect Ground Truth Audit (Hour-by-Hour Verification Log)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                See exactly what each model forecasted vs what actually happened at that hour.
              </p>
            </div>
          </div>
          {showTruthAudit ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showTruthAudit && (
          <div className="p-4 border-t border-slate-800 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 bg-slate-900/60">
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5 text-emerald-400 font-bold bg-emerald-950/20">Ground Truth Actual</th>
                  {rankings.slice(0, 4).map((r) => (
                    <th key={r.providerId} className="p-2.5">
                      {r.provider.shortName} Forecast
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {pastHoursSample.map((h) => {
                  const act = h.actual;

                  return (
                    <tr key={h.timeIso} className="hover:bg-slate-900/40">
                      <td className="p-2 font-mono font-medium text-slate-300">
                        {h.date.slice(5)} {formatTime(h.hourLabel, timeFormat)}
                      </td>
                      <td className="p-2 bg-emerald-950/15 font-bold text-emerald-300 font-mono">
                        {formatTemp(act.temperature, unit)} • {act.precipitation > 0 ? `${act.precipitation}mm rain` : 'Dry'}
                      </td>
                      {rankings.slice(0, 4).map((r) => {
                        const pred = h.providers[r.providerId];
                        if (!pred || pred.temperature === null) {
                          return <td key={r.providerId} className="p-2 text-slate-400">--</td>;
                        }
                        const err = Math.round((pred.temperature - act.temperature) * 10) / 10;
                        const isClose = Math.abs(err) <= 0.8;

                        return (
                          <td key={r.providerId} className="p-2 font-mono">
                            <span className="font-semibold text-slate-200">
                              {formatTemp(pred.temperature, unit)}
                            </span>{' '}
                            <span className={`text-[10px] ${isClose ? 'text-emerald-400' : 'text-amber-400'}`}>
                              ({err >= 0 ? `+${err}` : `${err}`}°)
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
