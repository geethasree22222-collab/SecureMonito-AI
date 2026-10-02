import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Save, Check, Thermometer, Battery, HardDrive, Wifi, Cpu } from 'lucide-react';
import { NotificationSettings as SettingsType } from '../types';

interface NotificationSettingsProps {
  settings: SettingsType;
  onSave: (updated: Partial<SettingsType>) => Promise<void>;
  isLoading: boolean;
}

export const NotificationSettingsView: React.FC<NotificationSettingsProps> = ({
  settings,
  onSave,
  isLoading,
}) => {
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggle = (key: keyof SettingsType) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    await onSave(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Notification Preferences</h3>
            <p className="text-xs text-slate-400">Configure actionable alert delivery channels and event triggers</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-1.5 rounded-md border border-cyan-500/40 bg-cyan-950 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-colors disabled:opacity-50"
        >
          {savedSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-5 space-y-6">
        {/* Delivery Channels */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Delivery Channels</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Email Notifications</p>
                  <p className="text-[11px] text-slate-400">Receive security incident digest</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.emailNotifications}
                onChange={() => toggle('emailNotifications')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Push Notifications</p>
                  <p className="text-[11px] text-slate-400">Real-time mobile & browser alerts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.pushNotifications}
                onChange={() => toggle('pushNotifications')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Alert Triggers */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Monitored Event Triggers</h4>
          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <Thermometer className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">High Device Temperature</p>
                  <p className="text-[11px] text-slate-400">Notify when thermal envelope exceeds 40°C on mobile/laptop</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.temperatureAlerts}
                onChange={() => toggle('temperatureAlerts')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <Battery className="h-4 w-4 text-rose-400" />
                <div>
                  <p className="text-xs font-medium text-white">Low Battery</p>
                  <p className="text-[11px] text-slate-400">Notify when device battery discharges below 15% without charger</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.batteryAlerts}
                onChange={() => toggle('batteryAlerts')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <HardDrive className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">Storage Almost Full</p>
                  <p className="text-[11px] text-slate-400">Notify when local volume capacity exceeds 90% utilization</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.storageAlerts}
                onChange={() => toggle('storageAlerts')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <Wifi className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-medium text-white">Unusual Network Activity</p>
                  <p className="text-[11px] text-slate-400">Notify on unexpected outbound transmission or sustained throughput spikes</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.networkAlerts}
                onChange={() => toggle('networkAlerts')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-medium text-white">IoT Sensor Anomaly</p>
                  <p className="text-[11px] text-slate-400">Notify on ESP32 voltage fluctuation, abnormal moisture, or environmental heat</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.iotAlerts}
                onChange={() => toggle('iotAlerts')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
