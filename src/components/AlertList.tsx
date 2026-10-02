import React, { useState } from 'react';
import { Bell, Check, Filter, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Alert, AlertStatus, DeviceType } from '../types';

interface AlertListProps {
  alerts: Alert[];
  onResolveAlert: (alertId: string) => void;
  isResolvingId?: string | null;
}

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  onResolveAlert,
  isResolvingId,
}) => {
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filterDevice !== 'all' && a.deviceType !== filterDevice) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Recent Alerts</h3>
            <p className="text-[11px] text-slate-400">Newest first timeline of security & operational events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1 rounded-md border border-slate-800 bg-slate-950/80 p-0.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`rounded px-2 py-0.5 font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('OPEN')}
              className={`rounded px-2 py-0.5 font-medium transition-colors ${
                filterStatus === 'OPEN' ? 'bg-amber-950/80 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`rounded px-2 py-0.5 font-medium transition-colors ${
                filterStatus === 'RESOLVED' ? 'bg-emerald-950/80 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>

          <select
            value={filterDevice}
            onChange={e => setFilterDevice(e.target.value)}
            className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Devices</option>
            <option value="laptop">Laptop</option>
            <option value="mobile">Mobile</option>
            <option value="iot">ESP32 IoT</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="mt-4 space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-950/30 p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No active alerts</p>
            <p className="text-xs text-slate-400 mt-0.5">All monitored metrics are currently within safety limits.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.alertId}
              className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3.5 transition-all gap-2 ${
                alert.status === 'RESOLVED'
                  ? 'border-slate-800/50 bg-slate-950/30 opacity-70'
                  : alert.severity === 'HIGH'
                  ? 'border-rose-900/40 bg-rose-950/15'
                  : 'border-amber-900/40 bg-amber-950/15'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {alert.severity === 'HIGH' ? (
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold capitalize text-slate-200">
                      {alert.deviceType}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-xs font-medium text-white">{alert.title}</span>
                    <span className="text-slate-600">|</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase ${
                        alert.severity === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="font-mono text-xs text-slate-400">{formatTime(alert.timestamp)}</span>
                    <span className="text-slate-600">|</span>
                    <span
                      className={`text-[11px] font-medium ${
                        alert.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {alert.status === 'RESOLVED' ? 'Resolved' : 'Open'}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-300">{alert.message}</p>
                </div>
              </div>

              {/* Action */}
              {alert.status === 'OPEN' && (
                <button
                  onClick={() => onResolveAlert(alert.alertId)}
                  disabled={isResolvingId === alert.alertId}
                  className="self-end sm:self-center flex items-center space-x-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 shrink-0"
                >
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>{isResolvingId === alert.alertId ? 'Resolving...' : 'Resolve'}</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
