import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DemoScenario } from '../services/demoData';

interface DemoBannerProps {
  currentScenario: DemoScenario;
  onSelectScenario: (scenario: DemoScenario) => void;
  onExitDemo: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentScenario,
  onSelectScenario,
  onExitDemo,
}) => {
  return (
    <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 px-4 py-2 text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:px-2">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/40">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>DEMO DATA ACTIVE</span>
          </span>
          <span className="hidden sm:inline text-slate-400">
            Showing simulated telemetry for preview and evaluation. Real backend telemetry is not affected.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-[11px]">Scenario:</span>
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-950/80 p-0.5">
            <button
              onClick={() => onSelectScenario('NORMAL')}
              className={`flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                currentScenario === 'NORMAL'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>NORMAL</span>
            </button>

            <button
              onClick={() => onSelectScenario('MEDIUM')}
              className={`flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                currentScenario === 'MEDIUM'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span>MEDIUM</span>
            </button>

            <button
              onClick={() => onSelectScenario('HIGH')}
              className={`flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                currentScenario === 'HIGH'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="h-3 w-3 text-rose-400" />
              <span>HIGH</span>
            </button>
          </div>

          <button
            onClick={onExitDemo}
            className="rounded px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white underline underline-offset-2 transition-colors ml-1"
          >
            Switch to Live API
          </button>
        </div>
      </div>
    </div>
  );
};
