import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskCardProps {
  riskLevel: RiskLevel;
  anomalyScore: number;
  reason: string;
  deviceName: string;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  riskLevel,
  anomalyScore,
  reason,
  deviceName,
}) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'NORMAL':
        return {
          icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
          containerClass: 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-900/40',
          title: 'NORMAL',
          description: 'No unusual behaviour detected.',
        };
      case 'MEDIUM':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
          containerClass: 'border-amber-500/40 bg-gradient-to-br from-amber-950/25 via-slate-900/60 to-slate-900/40',
          title: 'MEDIUM',
          description: 'Elevated resource usage or threshold drift detected.',
        };
      case 'HIGH':
        return {
          icon: <ShieldAlert className="h-6 w-6 text-rose-400" />,
          badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
          containerClass: 'border-rose-500/40 bg-gradient-to-br from-rose-950/25 via-slate-900/60 to-slate-900/40',
          title: 'HIGH',
          description: 'Critical operating threshold reached. Review recommended.',
        };
    }
  };

  const config = getRiskConfig();

  return (
    <div className={`rounded-xl border p-5 transition-all shadow-sm ${config.containerClass}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-800">
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Current Risk</h3>
            <p className="text-[11px] text-slate-400">Target: {deviceName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Risk Level:</span>
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold border tracking-wide ${config.badgeClass}`}>
            {config.title}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Anomaly Score */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">Anomaly Score</span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-white">{anomalyScore}</span>
            <span className="text-[11px] text-slate-400">/ 5 scale</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {anomalyScore === 0 ? 'Optimal' : anomalyScore < 3 ? 'Elevated' : 'Threshold exceeded'}
          </p>
        </div>

        {/* Reason */}
        <div className="md:col-span-2 rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 flex flex-col justify-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">Reason</span>
          <p className="mt-1 text-xs font-medium text-slate-200 leading-relaxed">
            {reason || config.description}
          </p>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Rule-based threshold evaluation. High metrics do not independently imply unauthorized access.
          </p>
        </div>
      </div>
    </div>
  );
};
