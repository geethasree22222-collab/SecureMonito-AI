import React from 'react';
import { Cpu, Wifi, WifiOff, CheckCircle2, ShieldCheck, Power } from 'lucide-react';
import { Device, IoTTelemetry } from '../types';

interface HardwareStatusProps {
  iotDevice?: Device | null;
  iotTelemetry?: IoTTelemetry | null;
  onToggleConnection: () => void;
  isConnecting?: boolean;
}

export const HardwareStatus: React.FC<HardwareStatusProps> = ({
  iotDevice,
  iotTelemetry,
  onToggleConnection,
  isConnecting,
}) => {
  const isConnected = iotDevice?.connectionStatus === 'connected';

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold tracking-tight text-white">Optional IoT Hardware</h3>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-medium text-cyan-300 border border-slate-700">
                ESP32
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect an ESP32-based sensor device for additional environmental and electrical monitoring.
            </p>
          </div>
        </div>

        {/* Status & Toggle button */}
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <div
            className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}
            />
            <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
          </div>

          <button
            onClick={onToggleConnection}
            disabled={isConnecting}
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              isConnected
                ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border border-cyan-500/40 bg-cyan-950 text-cyan-300 hover:bg-cyan-900/60 shadow-sm'
            } disabled:opacity-50`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{isConnecting ? 'Updating...' : isConnected ? 'Disconnect Hardware' : 'Connect Hardware'}</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <span className="text-[11px] text-slate-400">Microcontroller Target</span>
          <p className="mt-1 font-mono font-medium text-slate-200">ESP-WROOM-32 / NodeMCU</p>
          <p className="mt-0.5 text-[10px] text-slate-400">WiFi 802.11 b/g/n / BLE 4.2</p>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <span className="text-[11px] text-slate-400">Telemetry Interface</span>
          <p className="mt-1 font-mono font-medium text-slate-200">POST /api/telemetry/iot</p>
          <p className="mt-0.5 text-[10px] text-slate-400">JSON payload via HTTPS or n8n Webhook</p>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <span className="text-[11px] text-slate-400">Deployment Status</span>
          <p className="mt-1 font-medium text-slate-200">
            {isConnected ? 'Active Telemetry Streaming' : 'Hardware Optional (Standby)'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Platform remains 100% operational without hardware.
          </p>
        </div>
      </div>
    </div>
  );
};
