import React from 'react';
import {
  Laptop as LaptopIcon,
  Smartphone,
  Cpu,
  Wifi,
  WifiOff,
  Battery,
  HardDrive,
  Activity,
  Thermometer,
  Zap,
  Droplets,
  Radio,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Device, LaptopTelemetry, MobileTelemetry, IoTTelemetry, ConnectionState } from '../types';

interface DeviceCardProps {
  device: Device;
  isSelected: boolean;
  onSelect: () => void;
  laptopData?: LaptopTelemetry | null;
  mobileData?: MobileTelemetry | null;
  iotData?: IoTTelemetry | null;
  isLiveMode?: boolean;
  isSimulated?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSelected,
  onSelect,
  laptopData,
  mobileData,
  iotData,
  isLiveMode = true,
  isSimulated = false,
}) => {
  // Determine effective connection state
  const connState: ConnectionState =
    device.connectionState || (device.connectionStatus === 'connected' ? 'CONNECTED' : 'OFFLINE');

  const isConnected = connState === 'CONNECTED';
  const risk = device.riskLevel;

  // Format risk styling
  const riskBadgeClasses = {
    NORMAL: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    MEDIUM: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    HIGH: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
  }[risk];

  const getDeviceIcon = () => {
    switch (device.deviceType) {
      case 'laptop':
        return <LaptopIcon className="h-5 w-5 text-cyan-400" />;
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-cyan-400" />;
      case 'iot':
        return <Cpu className="h-5 w-5 text-cyan-400" />;
    }
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return 'Never';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  // Status badge config
  const getStatusBadge = () => {
    switch (connState) {
      case 'CONNECTED':
        return (
          <div className="flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border bg-emerald-950/60 border-emerald-500/40 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CONNECTED</span>
          </div>
        );
      case 'CONNECTING':
        return (
          <div className="flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border bg-cyan-950/60 border-cyan-500/40 text-cyan-300">
            <RefreshCw className="h-2.5 w-2.5 animate-spin text-cyan-400" />
            <span>CONNECTING</span>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border bg-rose-950/60 border-rose-500/40 text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span>ERROR</span>
          </div>
        );
      case 'OFFLINE':
      default:
        return (
          <div className="flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border bg-slate-800/60 border-slate-700 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span>OFFLINE</span>
          </div>
        );
    }
  };

  // Calculate laptop network throughput
  const laptopUpload = laptopData ? (laptopData.uploadMb ?? laptopData.upload_mb ?? 0) : 0;
  const laptopDownload = laptopData ? (laptopData.downloadMb ?? laptopData.download_mb ?? 0) : 0;
  const laptopNetworkTotal = (laptopUpload + laptopDownload).toFixed(1);

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
        isSelected
          ? 'border-cyan-500/80 bg-slate-900/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
          : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/70'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/70">
            {getDeviceIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">{device.deviceName}</h3>
              {device.deviceType === 'iot' && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300 border border-slate-700">
                  Optional
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[11px] text-slate-400 capitalize">
                {device.deviceType === 'iot' ? 'ESP32 Hardware' : device.deviceType}
              </span>
              {/* Live data badge or Demo badge */}
              {isSimulated ? (
                <span className="rounded bg-amber-950/70 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-800/60">
                  Demo / Simulated Data
                </span>
              ) : isLiveMode && isConnected ? (
                <span className="rounded bg-cyan-950/70 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300 border border-cyan-800/60 flex items-center space-x-1">
                  <span className="h-1 w-1 rounded-full bg-cyan-400" />
                  <span>Live data</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-end space-y-1.5">
          {getStatusBadge()}
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${riskBadgeClasses}`}>
            {risk}
          </span>
        </div>
      </div>

      {/* Metrics Summary based on type */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        {!isConnected ? (
          <div className="py-3 text-center">
            <p className="text-xs text-slate-400 italic">
              {device.deviceType === 'laptop' &&
                (isLiveMode
                  ? 'Live laptop telemetry is temporarily unavailable.'
                  : 'Connect the SecureMonitor desktop agent to start monitoring.')}
              {device.deviceType === 'mobile' && 'Install the SecureMonitor mobile app to start monitoring.'}
              {device.deviceType === 'iot' &&
                'IoT hardware is optional. Connect an ESP32 sensor device to enable hardware monitoring.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Laptop Metrics */}
            {device.deviceType === 'laptop' && laptopData && (
              <>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">CPU</span>
                  <span className="font-mono font-medium text-slate-200">{laptopData.cpu.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">RAM</span>
                  <span className="font-mono font-medium text-slate-200">{laptopData.ram.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Storage</span>
                  <span className="font-mono font-medium text-slate-200">{laptopData.disk.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Network</span>
                  <span className="font-mono font-medium text-slate-200">{laptopNetworkTotal} MB</span>
                </div>
              </>
            )}

            {/* Mobile Metrics */}
            {device.deviceType === 'mobile' && mobileData && (
              <>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Storage</span>
                  <span className="font-mono font-medium text-slate-200">{mobileData.storagePercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Battery</span>
                  <span className="font-mono font-medium text-slate-200">{mobileData.batteryPercent}%</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Temp</span>
                  <span className="font-mono font-medium text-slate-200">
                    {mobileData.temperature !== null ? `${mobileData.temperature.toFixed(1)}°C` : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Network</span>
                  <span className="font-mono font-medium uppercase text-slate-200">{mobileData.networkStatus}</span>
                </div>
              </>
            )}

            {/* IoT Metrics */}
            {device.deviceType === 'iot' && iotData && (
              <>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Temp</span>
                  <span className="font-mono font-medium text-slate-200">
                    {iotData.temperature !== null ? `${iotData.temperature.toFixed(1)}°C` : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Humidity</span>
                  <span className="font-mono font-medium text-slate-200">
                    {iotData.humidity !== null ? `${iotData.humidity.toFixed(0)}%` : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Voltage</span>
                  <span className="font-mono font-medium text-slate-200">
                    {iotData.voltage !== null ? `${iotData.voltage.toFixed(2)}V` : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950/40 px-2 py-1.5 border border-slate-800/40">
                  <span className="text-slate-400">Current</span>
                  <span className="font-mono font-medium text-slate-200">
                    {iotData.current !== null ? `${iotData.current.toFixed(2)}A` : 'Not available'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>Updated: {formatTime(device.lastUpdated)}</span>
        </div>
        <span className="font-mono">
          Anomaly: {laptopData ? (laptopData.anomalyScore ?? laptopData.anomaly_score ?? device.anomalyScore) : device.anomalyScore}
        </span>
      </div>

      {device.deviceType === 'iot' && (
        <div className="mt-2 text-center text-[10px] text-cyan-400/80 font-medium">
          Hardware is optional
        </div>
      )}
    </div>
  );
};
