import React from 'react';
import {
  Cpu,
  Server,
  HardDrive,
  Activity,
  Battery,
  Thermometer,
  Zap,
  Droplets,
  Radio,
  Wifi,
  Layers,
  Flame,
} from 'lucide-react';
import { Device, LaptopTelemetry, MobileTelemetry, IoTTelemetry } from '../types';

interface DeviceHealthProps {
  device: Device;
  laptopData?: LaptopTelemetry | null;
  mobileData?: MobileTelemetry | null;
  iotData?: IoTTelemetry | null;
  isLiveMode?: boolean;
}

export const DeviceHealth: React.FC<DeviceHealthProps> = ({
  device,
  laptopData,
  mobileData,
  iotData,
  isLiveMode = true,
}) => {
  const isConnected = device.connectionStatus === 'connected';

  // Helper for progress bar color
  const getProgressColor = (percent: number) => {
    if (percent > 90) return 'bg-rose-500';
    if (percent > 75) return 'bg-amber-500';
    return 'bg-cyan-500';
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">Device Health</h3>
          <p className="text-xs text-slate-400">
            Selected: <span className="text-slate-200 font-medium">{device.deviceName}</span> ({device.deviceType})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {laptopData?.isStale && (
            <span className="rounded bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              Telemetry Stale
            </span>
          )}
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300">
            ID: {device.deviceId}
          </span>
        </div>
      </div>

      {!isConnected ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-300">
            {device.deviceType === 'laptop'
              ? 'Live laptop telemetry is temporarily unavailable.'
              : device.deviceType === 'iot'
              ? 'Hardware not connected'
              : `${device.deviceName} is currently offline.`}
          </p>
          <p className="text-xs text-slate-400 mt-1 italic">
            {device.deviceType === 'laptop' && 'Connect the SecureMonitor desktop agent to start monitoring.'}
            {device.deviceType === 'mobile' && 'Install the SecureMonitor mobile app to start monitoring.'}
            {device.deviceType === 'iot' && 'IoT hardware is optional. Connect an ESP32 sensor device to enable hardware monitoring.'}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {/* LAPTOP HEALTH */}
          {device.deviceType === 'laptop' && laptopData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* CPU Usage */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    <span>CPU Usage</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {laptopData.cpu.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(laptopData.cpu)}`}
                    style={{ width: `${Math.min(100, Math.max(0, laptopData.cpu))}%` }}
                  />
                </div>
              </div>

              {/* RAM Usage */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Server className="h-3.5 w-3.5 text-cyan-400" />
                    <span>RAM Usage</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {laptopData.ram.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(laptopData.ram)}`}
                    style={{ width: `${Math.min(100, Math.max(0, laptopData.ram))}%` }}
                  />
                </div>
              </div>

              {/* Storage */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Storage</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {laptopData.disk.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(laptopData.disk)}`}
                    style={{ width: `${Math.min(100, Math.max(0, laptopData.disk))}%` }}
                  />
                </div>
              </div>

              {/* Network Activity */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Network Activity</span>
                  </span>
                  <span className="font-mono text-xs text-slate-200">
                    ↓ {laptopData.downloadMb.toFixed(1)} MB / ↑ {laptopData.uploadMb.toFixed(1)} MB
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Total throughput: {(laptopData.downloadMb + laptopData.uploadMb).toFixed(1)} MB
                </p>
              </div>

              {/* Running Processes */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Running Processes</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {laptopData.processes}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Thread supervisor state: {laptopData.processes > 400 ? 'Elevated count' : 'Nominal task pool'}
                </p>
              </div>
            </div>
          )}

          {/* MOBILE HEALTH */}
          {device.deviceType === 'mobile' && mobileData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Storage */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Storage</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {mobileData.storagePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(mobileData.storagePercent)}`}
                    style={{ width: `${Math.min(100, Math.max(0, mobileData.storagePercent))}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 font-mono">
                  {mobileData.freeStorageGb.toFixed(1)} GB free
                </p>
              </div>

              {/* Battery */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Battery className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Battery</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {mobileData.batteryPercent}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      mobileData.batteryPercent < 20 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, mobileData.batteryPercent))}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Status: {mobileData.charging ? 'Charging via adapter' : 'Discharging on battery'}
                </p>
              </div>

              {/* Temperature */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Temperature</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {mobileData.temperature !== null ? `${mobileData.temperature.toFixed(1)}°C` : 'Not available'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  {mobileData.temperature === null
                    ? 'Sensor not supported by Android hardware'
                    : mobileData.temperature > 40
                    ? 'Thermal threshold elevated'
                    : 'Safe operating temperature'}
                </p>
              </div>

              {/* Charging Status */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Charging Status</span>
                  </span>
                  <span className="font-mono text-xs font-medium text-slate-200">
                    {mobileData.charging ? 'Active' : 'Unplugged'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Power supply line: {mobileData.charging ? 'AC Connected' : 'Battery isolated'}
                </p>
              </div>

              {/* Network Status */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Wifi className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Network Status</span>
                  </span>
                  <span className="font-mono text-xs font-semibold uppercase text-cyan-300">
                    {mobileData.networkStatus}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400 font-mono">
                  Cycle usage: {mobileData.dataUsageMb.toFixed(1)} MB
                </p>
              </div>
            </div>
          )}

          {/* IOT HEALTH */}
          {device.deviceType === 'iot' && iotData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Temperature */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Temperature</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {iotData.temperature !== null ? `${iotData.temperature.toFixed(1)}°C` : 'Not available'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Ambient thermal measurement from ESP32 DHT/TMP sensor.
                </p>
              </div>

              {/* Humidity */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Humidity</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {iotData.humidity !== null ? `${iotData.humidity.toFixed(0)}%` : 'Not available'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Relative atmospheric moisture level.
                </p>
              </div>

              {/* Motion */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Radio className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Motion</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-white">
                    {iotData.motion === null
                      ? 'Not available'
                      : iotData.motion
                      ? 'Motion Detected'
                      : 'Clear / Inactive'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  PIR infrared sensor input.
                </p>
              </div>

              {/* Voltage */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Voltage</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {iotData.voltage !== null ? `${iotData.voltage.toFixed(2)} V` : 'Not available'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  ESP32 3.3V / 5.0V bus line level.
                </p>
              </div>

              {/* Current */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Current</span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {iotData.current !== null ? `${iotData.current.toFixed(2)} A` : 'Not available'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  INA219 or ACS712 shunt current monitor.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
