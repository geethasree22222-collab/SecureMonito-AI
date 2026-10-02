import React, { useState } from 'react';
import { X, Send, Laptop, Smartphone, Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Radio, ExternalLink } from 'lucide-react';
import {
  sendLaptopTelemetry,
  sendMobileTelemetry,
  sendIoTTelemetry,
  triggerN8nRelay,
} from '../services/api';

interface TelemetrySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onTelemetrySent: () => void;
  laptopId: string;
  mobileId: string;
  iotId: string;
}

export const TelemetrySimulatorModal: React.FC<TelemetrySimulatorProps> = ({
  isOpen,
  onClose,
  onTelemetrySent,
  laptopId,
  mobileId,
  iotId,
}) => {
  if (!isOpen) return null;

  const [deviceType, setDeviceType] = useState<'laptop' | 'mobile' | 'iot'>('laptop');
  const [isSending, setIsSending] = useState(false);
  const [isRelayingN8n, setIsRelayingN8n] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  // Quick preset payloads
  const sendPreset = async (preset: 'normal' | 'medium' | 'high') => {
    setIsSending(true);
    setResultMsg(null);

    try {
      if (deviceType === 'laptop') {
        const payload = {
          normal: { cpu: 32.0, ram: 54.0, disk: 68.0, uploadMb: 2.1, downloadMb: 11.4, processes: 215 },
          medium: { cpu: 84.5, ram: 88.0, disk: 82.0, uploadMb: 6.5, downloadMb: 140.0, processes: 390 },
          high: { cpu: 98.2, ram: 96.0, disk: 97.4, uploadMb: 25.0, downloadMb: 320.0, processes: 540 },
        }[preset];

        await sendLaptopTelemetry({
          deviceId: laptopId,
          ...payload,
        });
      } else if (deviceType === 'mobile') {
        const payload = {
          normal: { storagePercent: 62.0, freeStorageGb: 88.0, batteryPercent: 82, temperature: 33.2, charging: false },
          medium: { storagePercent: 88.0, freeStorageGb: 14.2, batteryPercent: 17, temperature: 38.8, charging: false },
          high: { storagePercent: 97.5, freeStorageGb: 2.8, batteryPercent: 8, temperature: 44.2, charging: false },
        }[preset];

        await sendMobileTelemetry({
          deviceId: mobileId,
          ...payload,
        });
      } else {
        const payload = {
          normal: { temperature: 24.5, humidity: 55.0, motion: false, voltage: 4.8, current: 0.12 },
          medium: { temperature: 36.5, humidity: 82.0, motion: true, voltage: 4.2, current: 0.28 },
          high: { temperature: 47.0, humidity: 91.0, motion: true, voltage: 2.9, current: 0.85 },
        }[preset];

        await sendIoTTelemetry({
          deviceId: iotId,
          ...payload,
        });
      }

      setResultMsg(`Successfully transmitted ${preset.toUpperCase()} telemetry packet to /api/telemetry/${deviceType}`);
      onTelemetrySent();
      setTimeout(() => setResultMsg(null), 4000);
    } catch (err: any) {
      setResultMsg(`Transmission error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Trigger test payload to real n8n webhook
  const handleTriggerN8n = async () => {
    setIsRelayingN8n(true);
    setResultMsg(null);
    try {
      const res = await triggerN8nRelay({
        cpu: 32.5,
        ram: 58.2,
        disk: 72.4,
        upload_mb: 2.4,
        download_mb: 12.8,
        processes: 245,
      });
      setResultMsg(`n8n webhook triggered! Response: ${JSON.stringify(res.n8nResponse)} (Status: ${res.n8nStatus})`);
      onTelemetrySent();
    } catch (err: any) {
      setResultMsg(`n8n trigger error: ${err.message}`);
    } finally {
      setIsRelayingN8n(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Agent Telemetry Simulator</h3>
            <p className="text-xs text-slate-400">
              Test ingestion pipeline (Agent / Webhook → Backend Rule Engine → Gemini AI)
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Device selector */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Endpoint</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => setDeviceType('laptop')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                deviceType === 'laptop'
                  ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="h-4 w-4" />
              <span>Laptop</span>
            </button>

            <button
              onClick={() => setDeviceType('mobile')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                deviceType === 'mobile'
                  ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Mobile</span>
            </button>

            <button
              onClick={() => setDeviceType('iot')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                deviceType === 'iot'
                  ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>ESP32 IoT</span>
            </button>
          </div>
        </div>

        {/* Payload Presets */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Simulate Telemetry Condition
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            <button
              onClick={() => sendPreset('normal')}
              disabled={isSending}
              className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 hover:bg-emerald-950/40 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-1" />
              <span className="text-xs font-semibold text-emerald-300">Normal Baseline</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Anomaly Score: 0</span>
            </button>

            <button
              onClick={() => sendPreset('medium')}
              disabled={isSending}
              className="flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 hover:bg-amber-950/40 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="h-5 w-5 text-amber-400 mb-1" />
              <span className="text-xs font-semibold text-amber-300">Elevated Usage</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Anomaly Score: 1-2</span>
            </button>

            <button
              onClick={() => sendPreset('high')}
              disabled={isSending}
              className="flex flex-col items-center justify-center rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 hover:bg-rose-950/40 transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="h-5 w-5 text-rose-400 mb-1" />
              <span className="text-xs font-semibold text-rose-300">Critical Anomaly</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Anomaly Score: 3-4</span>
            </button>
          </div>
        </div>

        {/* Real n8n Webhook Test trigger */}
        {deviceType === 'laptop' && (
          <div className="mt-4 rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-300 flex items-center space-x-1">
                  <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  <span>Real n8n Webhook Flow</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  POST payload to <code className="text-cyan-400">https://geetha22.app.n8n.cloud/webhook/laptop-monitor</code>
                </p>
              </div>

              <button
                onClick={handleTriggerN8n}
                disabled={isRelayingN8n}
                className="flex items-center space-x-1.5 rounded-md border border-cyan-500/50 bg-cyan-900/60 px-2.5 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-800 transition-colors disabled:opacity-50 shrink-0"
              >
                <span>{isRelayingN8n ? 'Dispatching...' : 'Trigger n8n Test'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live confirmation */}
        {resultMsg && (
          <div className="mt-4 rounded-lg border border-cyan-800/60 bg-cyan-950/30 p-2.5 text-xs text-cyan-200">
            {resultMsg}
          </div>
        )}

        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">Direct Agent Endpoint:</p>
          <code className="text-cyan-400 block mt-1">
            POST /api/telemetry/{deviceType}
          </code>
          <p className="mt-1">
            Accepts JSON telemetry matching the REST schema specified in the n8n / Agent contract.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
