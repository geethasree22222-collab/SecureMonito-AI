import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Layers,
  Bell,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  User as UserIcon,
  LogOut,
  Sliders,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { HardwareMode, User } from '../types';

interface HeaderProps {
  currentTab: 'dashboard' | 'devices' | 'alerts' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'devices' | 'alerts' | 'settings') => void;
  hardwareMode: HardwareMode;
  onChangeHardwareMode: (mode: HardwareMode) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  isConnected: boolean;
  lastUpdatedText: string;
  currentUser: User | null;
  onLogout: () => void;
  onOpenSimulator: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  hardwareMode,
  onChangeHardwareMode,
  isDemoMode,
  onToggleDemoMode,
  isConnected,
  lastUpdatedText,
  currentUser,
  onLogout,
  onOpenSimulator,
  onRefresh,
  isRefreshing,
  alertCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex cursor-pointer items-center space-x-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-950">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold tracking-tight text-white">
                  SecureMonitor<span className="text-cyan-400"> AI</span>
                </span>
                <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase text-slate-400 border border-slate-700/60">
                  v1.0
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('devices')}
              className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentTab === 'devices'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Devices</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`relative flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentTab === 'alerts'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-[10px] font-semibold text-amber-300 border border-amber-500/40">
                  {alertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentTab === 'settings'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          {/* Hardware Configuration Mode */}
          <div className="hidden lg:flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs">
            <button
              onClick={() => onChangeHardwareMode('software_only')}
              className={`rounded px-2.5 py-1 font-medium transition-all ${
                hardwareMode === 'software_only'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Laptop & Mobile monitoring only"
            >
              Software Only
            </button>
            <button
              onClick={() => onChangeHardwareMode('software_iot')}
              className={`flex items-center space-x-1 rounded px-2.5 py-1 font-medium transition-all ${
                hardwareMode === 'software_iot'
                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Laptop, Mobile + ESP32 Hardware"
            >
              <Cpu className="h-3 w-3" />
              <span>+ IoT Hardware</span>
            </button>
          </div>

          {/* Mode Switcher: Real vs Demo */}
          <button
            onClick={onToggleDemoMode}
            className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all border ${
              isDemoMode
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle between Live Connected API and Preview Demo Data"
          >
            <Sliders className="h-3 w-3" />
            <span>{isDemoMode ? 'Demo Mode' : 'Live Mode'}</span>
          </button>

          {/* Telemetry Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            className="hidden sm:flex items-center space-x-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors"
            title="Test sending simulated laptop, mobile, or IoT agent telemetry"
          >
            <Activity className="h-3 w-3 text-cyan-400" />
            <span>Simulate Telemetry</span>
          </button>

          {/* Connection Status Indicator */}
          <div
            className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
              isConnected
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/40 text-rose-300'
            }`}
            title={`Last updated: ${lastUpdatedText}`}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-rose-400" />
                <span className="hidden sm:inline">Connection unavailable</span>
              </>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh device telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/60 hover:text-white transition-colors"
              title={currentUser?.email || 'User Account'}
            >
              <UserIcon className="h-4 w-4" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-900/95 p-2 shadow-xl backdrop-blur-md z-40"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="border-b border-slate-800 px-2 py-1.5 mb-1">
                  <p className="text-xs font-medium text-white truncate">{currentUser?.name || 'Administrator'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'user@example.com'}</p>
                  <span className="inline-block mt-1 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase text-cyan-300">
                    {currentUser?.role || 'USER'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onSelectTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <SettingsIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span>Notification Settings</span>
                </button>

                <button
                  onClick={onLogout}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 justify-around text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            currentTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>
        <button
          onClick={() => onSelectTab('devices')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            currentTab === 'devices' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Devices</span>
        </button>
        <button
          onClick={() => onSelectTab('alerts')}
          className={`relative flex flex-col items-center py-1 px-3 rounded ${
            currentTab === 'alerts' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Alerts</span>
          {alertCount > 0 && (
            <span className="absolute top-0 right-3 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-slate-950">
              {alertCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            currentTab === 'settings' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </div>
    </header>
  );
};
