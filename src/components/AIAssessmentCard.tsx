import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { AIAssessment } from '../types';

interface AIAssessmentCardProps {
  assessment: AIAssessment | null;
  isLoading: boolean;
}

export const AIAssessmentCard: React.FC<AIAssessmentCardProps> = ({
  assessment,
  isLoading,
}) => {
  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/20 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center space-x-1.5">
              <span>AI Security Assessment</span>
              <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] font-mono font-medium text-cyan-300 border border-cyan-800">
                Gemini
              </span>
            </h3>
          </div>
        </div>

        {assessment?.generatedAt && (
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(assessment.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="mt-3.5">
        {isLoading ? (
          <div className="flex items-center space-x-2 py-3 text-xs text-slate-400">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Analyzing device telemetry...</span>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-slate-200">
            {assessment?.assessment ||
              'No unusual device behaviour detected. Current readings are within the configured monitoring thresholds.'}
          </p>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="mt-3.5 flex items-start space-x-1.5 rounded-md border border-slate-800/80 bg-slate-950/60 p-2.5 text-[11px] text-slate-400">
        <Info className="h-3.5 w-3.5 text-cyan-400/80 shrink-0 mt-0.5" />
        <p className="leading-tight">
          AI provides an additional assessment layer. Rule-based anomaly detection determines the primary risk classification.
        </p>
      </div>
    </div>
  );
};
