```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { DeviceCard } from './components/DeviceCard';
import { RiskCard } from './components/RiskCard';
import { AIAssessmentCard } from './components/AIAssessmentCard';
import { DeviceHealth } from './components/DeviceHealth';
import { RecommendationCard } from './components/RecommendationCard';
import { AlertList } from './components/AlertList';
import { HardwareStatus } from './components/HardwareStatus';
import { NotificationSettingsView } from './components/NotificationSettings';
import { TelemetrySimulatorModal } from './components/TelemetrySimulator';
import { AuthModal } from './components/AuthModal';

import {
  Device,
  LaptopTelemetry,
  MobileTelemetry,
  IoTTelemetry,
  Alert,
  AIAssessment,
  Recommendation,
  NotificationSettings,
  User,
  HardwareMode,
} from './types';

import {
  getDevices,
  getLaptopMetrics,
  getLaptopAssessment,
  getMobileStatus,
  getIoTStatus,
  getAlerts,
  resolveAlert,
  getAIAssessment,
  getRecommendations,
  getNotificationSettings,
  updateNotificationSettings,
  checkBackendHealth,
  getCurrentUser,
  logout,
  login,
  registerDevice,
  setAuthStateListener,
  triggerN8nRelay,
} from './services/api';

import { DEMO_DATA_SETS, DemoScenario } from './services/demoData';
import { Radio, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'devices' | 'alerts' | 'settings'
  >('dashboard');

  const [hardwareMode, setHardwareMode] =
    useState<HardwareMode>('software_iot');

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoScenario, setDemoScenario] =
    useState<DemoScenario>('NORMAL');

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [showAuthModal, setShowAuthModal] =
    useState(false);

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [selectedDeviceId, setSelectedDeviceId] =
    useState('laptop-user-ae9948fe');

  const [laptopData, setLaptopData] =
    useState<LaptopTelemetry | null>(null);

  const [mobileData, setMobileData] =
    useState<MobileTelemetry | null>(null);

  const [iotData, setIoTData] =
    useState<IoTTelemetry | null>(null);

  const [aiAssessment, setAiAssessment] =
    useState<AIAssessment | null>(null);

  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);

  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [notificationSettings, setSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      pushNotifications: true,
      temperatureAlerts: true,
      storageAlerts: true,
      batteryAlerts: true,
      networkAlerts: true,
      iotAlerts: true,
    });

  const [isConnected, setIsConnected] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(new Date());

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isResolvingId, setIsResolvingId] =
    useState<string | null>(null);

  const [showSimulator, setShowSimulator] =
    useState(false);

  const [isTogglingHardware, setIsTogglingHardware] =
    useState(false);

  const [laptopFetchError, setLaptopFetchError] =
    useState<string | null>(null);

  const [isTriggeringN8n, setIsTriggeringN8n] =
    useState(false);

  useEffect(() => {
    const unsubscribe = setAuthStateListener(user => {
      if (user?.userId === 'demo-user-001') {
        setCurrentUser(user);
        setIsDemoMode(true);
        setShowAuthModal(false);
        setCurrentTab('dashboard');
        setSelectedDeviceId('laptop-001');
        return;
      }

      setCurrentUser(user);

      if (!user) {
        setShowAuthModal(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      return;
    }

    const initAuth = async () => {
      try {
        const user = await getCurrentUser();

        if (user) {
          setCurrentUser(user);
          setShowAuthModal(false);
          return;
        }

        setShowAuthModal(true);
      } catch {
        setShowAuthModal(true);
      }
    };

    initAuth();
  }, [isDemoMode]);

  const fetchLiveTelemetry = useCallback(async () => {
    if (isDemoMode || !currentUser) {
      return;
    }

    try {
      setIsRefreshing(true);
      setLaptopFetchError(null);

      await checkBackendHealth();
      setIsConnected(true);

      const devRes = await getDevices();

      setDevices(devRes.devices);

      const targetLaptop =
        devRes.devices.find(
          d => d.deviceType === 'laptop'
        ) || {
          deviceId: 'laptop-001',
        };

      const targetMobile =
        devRes.devices.find(
          d => d.deviceType === 'mobile'
        );

      const targetIoT =
        devRes.devices.find(
          d => d.deviceType === 'iot'
        );

      try {
        const lData = await getLaptopMetrics(
          targetLaptop.deviceId
        );

        setLaptopData(lData);

        if (lData) {
          setDevices(prev =>
            prev.map(d =>
              d.deviceType === 'laptop'
                ? {
                    ...d,
                    connectionStatus:
                      lData.isStale
                        ? 'disconnected'
                        : 'connected',
                    connectionState:
                      lData.connectionState ||
                      (lData.isStale
                        ? 'OFFLINE'
                        : 'CONNECTED'),
                    lastUpdated:
                      lData.timestamp ||
                      d.lastUpdated,
                    riskLevel:
                      lData.risk ||
                      d.riskLevel,
                    anomalyScore:
                      lData.anomalyScore ??
                      lData.anomaly_score ??
                      d.anomalyScore,
                    source: 'live',
                  }
                : d
            )
          );
        }
      } catch {
        setLaptopFetchError(
          'Live laptop telemetry is temporarily unavailable.'
        );

        setDevices(prev =>
          prev.map(d =>
            d.deviceType === 'laptop'
              ? {
                  ...d,
                  connectionStatus: 'disconnected',
                  connectionState: 'ERROR',
                }
              : d
          )
        );
      }

      if (targetMobile) {
        try {
          const mData = await getMobileStatus(
            targetMobile.deviceId
          );

          setMobileData(mData);
        } catch {}
      }

      if (targetIoT) {
        try {
          const iData = await getIoTStatus(
            targetIoT.deviceId
          );

          setIoTData(iData);
        } catch {}
      }

      const alertRes = await getAlerts();

      setAlerts(alertRes.alerts);

      const currentSelected =
        selectedDeviceId ||
        targetLaptop.deviceId ||
        'laptop-001';

      try {
        const recRes =
          await getRecommendations(
            currentSelected
          );

        setRecommendations(
          recRes.recommendations
        );
      } catch {}

      try {
        const aiRes =
          currentSelected.startsWith('laptop')
            ? await getLaptopAssessment(
                currentSelected
              )
            : await getAIAssessment(
                currentSelected
              );

        setAiAssessment(aiRes);
      } catch {
        setAiAssessment(null);
      }

      try {
        const setRes =
          await getNotificationSettings();

        setSettings(setRes);
      } catch {}

      setLastUpdated(new Date());
    } catch {
      setIsConnected(false);

      setLaptopFetchError(
        'Unable to retrieve live laptop telemetry.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isDemoMode,
    currentUser,
    selectedDeviceId,
  ]);

  useEffect(() => {
    if (isDemoMode || !currentUser) {
      return;
    }

    fetchLiveTelemetry();

    const interval = setInterval(() => {
      fetchLiveTelemetry();
    }, 30000);

    return () => clearInterval(interval);
  }, [
    fetchLiveTelemetry,
    isDemoMode,
    currentUser,
  ]);

  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    const demoData =
      DEMO_DATA_SETS[demoScenario];

    setDevices(
      demoData.devices.map(d => ({
        ...d,
        source: 'simulated',
        connectionState: 'CONNECTED',
      }))
    );

    setLaptopData({
      ...demoData.laptop,
      source: 'simulated',
      isStale: false,
      connectionState: 'CONNECTED',
    });

    setMobileData(demoData.mobile);
    setIoTData(demoData.iot);
    setAiAssessment(demoData.assessment);

    setRecommendations(
      demoData.recommendations
    );

    setAlerts(demoData.alerts);

    setIsConnected(true);
    setLaptopFetchError(null);

    setLastUpdated(
      new Date(demoData.laptop.timestamp)
    );

    const laptopDevice =
      demoData.devices.find(
        d => d.deviceType === 'laptop'
      );

    if (laptopDevice) {
      setSelectedDeviceId(
        laptopDevice.deviceId
      );
    }
  }, [
    isDemoMode,
    demoScenario,
  ]);

  const handleResolveAlert = async (
    alertId: string
  ) => {
    if (isDemoMode) {
      setAlerts(prev =>
        prev.map(a =>
          a.alertId === alertId
            ? {
                ...a,
                status: 'RESOLVED',
              }
            : a
        )
      );

      return;
    }

    try {
      setIsResolvingId(alertId);

      await resolveAlert(alertId);

      setAlerts(prev =>
        prev.map(a =>
          a.alertId === alertId
            ? {
                ...a,
                status: 'RESOLVED',
              }
            : a
        )
      );
    } catch (err) {
      console.error(
        'Failed to resolve alert:',
        err
      );
    } finally {
      setIsResolvingId(null);
    }
  };

  const handleToggleHardware = async () => {
    setIsTogglingHardware(true);

    const iotDevice =
      devices.find(
        d => d.deviceType === 'iot'
      );

    if (!iotDevice) {
      setIsTogglingHardware(false);
      return;
    }

    const nextStatus =
      iotDevice.connectionStatus ===
      'connected'
        ? 'disconnected'
        : 'connected';

    if (isDemoMode) {
      setDevices(prev =>
        prev.map(d =>
          d.deviceType === 'iot'
            ? {
                ...d,
                connectionStatus:
                  nextStatus,
              }
            : d
        )
      );

      setIsTogglingHardware(false);
      return;
    }

    setTimeout(() => {
      setDevices(prev =>
        prev.map(d =>
          d.deviceType === 'iot'
            ? {
                ...d,
                connectionStatus:
                  nextStatus,
              }
            : d
        )
      );

      setIsTogglingHardware(false);
    }, 600);
  };

  const handleSaveSettings = async (
    updated: Partial<NotificationSettings>
  ) => {
    if (isDemoMode) {
      setSettings(prev => ({
        ...prev,
        ...updated,
      }));

      return;
    }

    const saved =
      await updateNotificationSettings(
        updated
      );

    setSettings(saved);
  };

  const handleTriggerN8nTest = async () => {
    setIsTriggeringN8n(true);

    try {
      await triggerN8nRelay();

      await fetchLiveTelemetry();
    } catch (err) {
      console.warn(
        'n8n trigger error:',
        err
      );
    } finally {
      setIsTriggeringN8n(false);
    }
  };

  const handleDemoSuccess = (user: User) => {
    if (user.userId === 'demo-user-001') {
      setCurrentUser(user);
      setIsDemoMode(true);
      setShowAuthModal(false);
      setCurrentTab('dashboard');
      setSelectedDeviceId('laptop-001');
      setIsConnected(true);
      setLaptopFetchError(null);
      return;
    }

    setCurrentUser(user);
    setIsDemoMode(false);
    setShowAuthModal(false);

    setTimeout(() => {
      fetchLiveTelemetry();
    }, 0);
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      setCurrentUser(null);
      setIsDemoMode(false);
      setShowAuthModal(true);
      return;
    }

    try {
      await logout();
    } catch {}

    setCurrentUser(null);
    setShowAuthModal(true);
  };

  const selectedDevice =
    devices.find(
      d => d.deviceId === selectedDeviceId
    ) ||
    devices.find(
      d => d.deviceType === 'laptop'
    ) ||
    devices[0] || {
      deviceId: 'laptop-001',
      deviceName: 'Workstation ThinkPad X1',
      deviceType: 'laptop',
      connectionStatus: 'connected',
      connectionState: 'CONNECTED',
      lastUpdated:
        new Date().toISOString(),
      riskLevel: 'NORMAL',
      anomalyScore: 0,
      source: 'live',
    };

  const visibleDevices =
    devices.filter(d => {
      if (
        hardwareMode ===
          'software_only' &&
        d.deviceType === 'iot'
      ) {
        return false;
      }

      return true;
    });

  const openAlertsCount =
    alerts.filter(
      a => a.status === 'OPEN'
    ).length;

  const formatLastUpdated = (
    date: Date | null
  ) => {
    if (!date) {
      return 'Never';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const currentRiskLevel =
    selectedDevice.deviceType === 'laptop' &&
    laptopData
      ? laptopData.risk
      : selectedDevice.riskLevel;

  const currentAnomalyScore =
    selectedDevice.deviceType === 'laptop' &&
    laptopData
      ? laptopData.anomalyScore ??
        laptopData.anomaly_score ??
        0
      : selectedDevice.anomalyScore;

  const currentRiskReason =
    selectedDevice.deviceType === 'laptop'
      ? laptopData?.reason ||
        'No unusual behaviour detected.'
      : selectedDevice.deviceType === 'mobile'
      ? mobileData?.reason ||
        'No unusual behaviour detected.'
      : iotData?.reason ||
        'Normal ESP32 sensor readings.';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hardwareMode={hardwareMode}
        onChangeHardwareMode={
          setHardwareMode
        }
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => {
          if (isDemoMode) {
            setIsDemoMode(false);
            setCurrentUser(null);
            setShowAuthModal(true);
          } else {
            setCurrentUser({
              userId: 'demo-user-001',
              name: 'Demo User',
              email: 'demo@securemonitor.ai',
              role: 'USER',
            });
            setIsDemoMode(true);
            setShowAuthModal(false);
            setCurrentTab('dashboard');
            setSelectedDeviceId('laptop-001');
          }
        }}
        isConnected={isConnected}
        lastUpdatedText={formatLastUpdated(
          lastUpdated
        )}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSimulator={() =>
          setShowSimulator(true)
        }
        onRefresh={
          fetchLiveTelemetry
        }
        isRefreshing={isRefreshing}
        alertCount={openAlertsCount}
      />

      {isDemoMode && (
        <DemoBanner
          currentScenario={
            demoScenario
          }
          onSelectScenario={
            setDemoScenario
          }
          onExitDemo={() => {
            setIsDemoMode(false);
            setCurrentUser(null);
            setShowAuthModal(true);
          }}
        />
      )}

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {!isConnected &&
          !isDemoMode && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-300">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />

                <span>
                  <strong>
                    Connection unavailable:
                  </strong>{' '}
                  Unable to connect to
                  monitoring service.
                  Please check your
                  connection.
                </span>
              </div>

              <button
                onClick={
                  fetchLiveTelemetry
                }
                className="rounded bg-rose-900/60 px-2.5 py-1 font-semibold text-rose-200 hover:bg-rose-800 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}

        {laptopFetchError &&
          !isDemoMode && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-950/25 p-3.5 text-xs text-amber-200">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />

                <div>
                  <p className="font-semibold text-amber-300">
                    {laptopFetchError}
                  </p>

                  <p className="text-[11px] text-slate-300 mt-0.5">
                    The dashboard is awaiting telemetry from the Laptop Python Agent → n8n webhook.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={
                    handleTriggerN8nTest
                  }
                  disabled={
                    isTriggeringN8n
                  }
                  className="flex items-center space-x-1.5 rounded-md border border-cyan-500/50 bg-cyan-950/80 px-2.5 py-1 font-medium text-cyan-200 hover:bg-cyan-900 transition-colors disabled:opacity-50"
                >
                  <Radio className="h-3 w-3 text-cyan-400" />

                  <span>
                    {isTriggeringN8n
                      ? 'Dispatching...'
                      : 'Trigger n8n Test'}
                  </span>
                </button>

                <button
                  onClick={
                    fetchLiveTelemetry
                  }
                  className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Device Monitoring
                  </h1>

                  {!isDemoMode &&
                    isConnected && (
                      <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-800 flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>
                          Live data
                        </span>
                      </span>
                    )}

                  {isDemoMode && (
                    <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-800">
                      Demo / Simulated Data
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Last updated:{' '}
                  {formatLastUpdated(
                    lastUpdated
                  )}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Monitor device health,
                detect unusual
                conditions, and
                receive actionable
                alerts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDevices.map(
                dev => (
                  <DeviceCard
                    key={
                      dev.deviceId
                    }
                    device={dev}
                    isSelected={
                      selectedDevice.deviceId ===
                      dev.deviceId
                    }
                    onSelect={() =>
                      setSelectedDeviceId(
                        dev.deviceId
                      )
                    }
                    laptopData={
                      dev.deviceType ===
                      'laptop'
                        ? laptopData
                        : null
                    }
                    mobileData={
                      dev.deviceType ===
                      'mobile'
                        ? mobileData
                        : null
                    }
                    iotData={
                      dev.deviceType ===
                      'iot'
                        ? iotData
                        : null
                    }
                    isLiveMode={
                      !isDemoMode
                    }
                    isSimulated={
                      isDemoMode
                    }
                  />
                )
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <RiskCard
                  riskLevel={
                    currentRiskLevel
                  }
                  anomalyScore={
                    currentAnomalyScore
                  }
                  reason={
                    currentRiskReason
                  }
                  deviceName={
                    selectedDevice.deviceName
                  }
                />
              </div>

              <div>
                <AIAssessmentCard
                  assessment={
                    aiAssessment
                  }
                  isLoading={
                    isRefreshing &&
                    !aiAssessment
                  }
                />
              </div>
            </div>

            <DeviceHealth
              device={
                selectedDevice
              }
              laptopData={
                selectedDevice.deviceType ===
                'laptop'
                  ? laptopData
                  : null
              }
              mobileData={
                selectedDevice.deviceType ===
                'mobile'
                  ? mobileData
                  : null
              }
              iotData={
                selectedDevice.deviceType ===
                'iot'
                  ? iotData
                  : null
              }
              isLiveMode={
                !isDemoMode
              }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <RecommendationCard
                recommendations={
                  recommendations
                }
              />

              <AlertList
                alerts={alerts}
                onResolveAlert={
                  handleResolveAlert
                }
                isResolvingId={
                  isResolvingId
                }
              />
            </div>

            {hardwareMode ===
              'software_iot' && (
              <HardwareStatus
                iotDevice={
                  devices.find(
                    d =>
                      d.deviceType ===
                      'iot'
                  )
                }
                iotTelemetry={
                  iotData
                }
                onToggleConnection={
                  handleToggleHardware
                }
                isConnecting={
                  isTogglingHardware
                }
              />
            )}
          </div>
        )}

        {currentTab === 'devices' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Registered Devices
                </h1>

                <p className="mt-1 text-xs text-slate-400">
                  Manage active device agents and monitor hardware integrations.
                </p>
              </div>

              <button
                onClick={async () => {
                  if (isDemoMode) {
                    return;
                  }

                  const name =
                    prompt(
                      'Enter a name for the new device:',
                      'Backup Laptop'
                    );

                  if (name) {
                    await registerDevice(
                      name,
                      'laptop'
                    );

                    await fetchLiveTelemetry();
                  }
                }}
                disabled={isDemoMode}
                className="self-start sm:self-auto rounded-md border border-cyan-500/40 bg-cyan-950 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-colors disabled:opacity-50"
              >
                + Register New Device
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDevices.map(
                dev => (
                  <DeviceCard
                    key={
                      dev.deviceId
                    }
                    device={dev}
                    isSelected={
                      selectedDevice.deviceId ===
                      dev.deviceId
                    }
                    onSelect={() =>
                      setSelectedDeviceId(
                        dev.deviceId
                      )
                    }
                    laptopData={
                      dev.deviceType ===
                      'laptop'
                        ? laptopData
                        : null
                    }
                    mobileData={
                      dev.deviceType ===
                      'mobile'
                        ? mobileData
                        : null
                    }
                    iotData={
                      dev.deviceType ===
                      'iot'
                        ? iotData
                        : null
                    }
                    isLiveMode={
                      !isDemoMode
                    }
                    isSimulated={
                      isDemoMode
                    }
                  />
                )
              )}
            </div>

            <DeviceHealth
              device={
                selectedDevice
              }
              laptopData={
                selectedDevice.deviceType ===
                'laptop'
                  ? laptopData
                  : null
              }
              mobileData={
                selectedDevice.deviceType ===
                'mobile'
                  ? mobileData
                  : null
              }
              iotData={
                selectedDevice.deviceType ===
                'iot'
                  ? iotData
                  : null
              }
              isLiveMode={
                !isDemoMode
              }
            />

            {hardwareMode ===
              'software_iot' && (
              <HardwareStatus
                iotDevice={
                  devices.find(
                    d =>
                      d.deviceType ===
                      'iot'
                  )
                }
                iotTelemetry={
                  iotData
                }
                onToggleConnection={
                  handleToggleHardware
                }
                isConnecting={
                  isTogglingHardware
                }
              />
            )}
          </div>
        )}

        {currentTab === 'alerts' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Security & Operational Alerts
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                Audit trail of rule-based triggers and threshold advisories across all devices.
              </p>
            </div>

            <AlertList
              alerts={alerts}
              onResolveAlert={
                handleResolveAlert
              }
              isResolvingId={
                isResolvingId
              }
            />
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                System Settings
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                Manage alert delivery dispatching and automated security notifications.
              </p>
            </div>

            <NotificationSettingsView
              settings={
                notificationSettings
              }
              onSave={
                handleSaveSettings
              }
              isLoading={
                isRefreshing
              }
            />
          </div>
        )}
      </main>

      <TelemetrySimulatorModal
        isOpen={
          showSimulator
        }
        onClose={() =>
          setShowSimulator(false)
        }
        onTelemetrySent={() => {
          if (!isDemoMode) {
            fetchLiveTelemetry();
          }
        }}
        laptopId={
          devices.find(
            d =>
              d.deviceType ===
              'laptop'
          )?.deviceId ||
          'laptop-001'
        }
        mobileId={
          devices.find(
            d =>
              d.deviceType ===
              'mobile'
          )?.deviceId ||
          'mobile-001'
        }
        iotId={
          devices.find(
            d =>
              d.deviceType ===
              'iot'
          )?.deviceId ||
          'iot-001'
        }
      />

      <AuthModal
        isOpen={
          showAuthModal &&
          !currentUser
        }
        onSuccess={
          handleDemoSuccess
        }
        onClose={() =>
          setShowAuthModal(false)
        }
      />

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SecureMonitor AI • Professional Device Health & Threat Assessment
          </span>

          <span className="font-mono text-[11px] text-slate-400">
            Rule-Engine Anomaly Detection • Hardware Optional
          </span>
        </div>
      </footer>
    </div>
  );
}
```
