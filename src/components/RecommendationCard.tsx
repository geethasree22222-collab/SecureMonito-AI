import React from 'react';
import { CheckCircle, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendations: Recommendation[];
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendations,
}) => {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-950/80 border border-blue-500/30 text-blue-400">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Recommended Actions</h3>
            <p className="text-[11px] text-slate-400">Safe, non-destructive user recommendations</p>
          </div>
        </div>

        <span className="flex items-center space-x-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-slate-700">
          <ShieldCheck className="h-3 w-3" />
          <span>User Controlled</span>
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {recommendations.length === 0 ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 text-center">
            <p className="text-xs text-slate-400">No active recommendations required. Nominal device baseline.</p>
          </div>
        ) : (
          recommendations.map(rec => (
            <div
              key={rec.id}
              className="flex items-start space-x-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 transition-colors hover:border-slate-700"
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  rec.priority === 'HIGH'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                    : rec.priority === 'MEDIUM'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                !
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-semibold text-white">{rec.title}</h4>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase font-semibold ${
                      rec.priority === 'HIGH'
                        ? 'bg-rose-950 text-rose-300'
                        : rec.priority === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{rec.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3.5 text-[11px] text-slate-400 text-right">
        SecureMonitor AI never executes automatic file purges, process kills, or system mutations.
      </div>
    </div>
  );
};
