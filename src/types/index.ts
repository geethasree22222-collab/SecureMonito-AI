export type DeviceType = 'laptop' | 'mobile' | 'iot';
export type ConnectionStatus = 'connected' | 'disconnected';
export type ConnectionState = 'CONNECTED' | 'OFFLINE' | 'CONNECTING' | 'ERROR';
export type RiskLevel = 'NORMAL' | 'MEDIUM' | 'HIGH';
export type AlertSeverity = 'MEDIUM' | 'HIGH';
export type AlertStatus = 'OPEN' | 'RESOLVED';
export type HardwareMode = 'software_only' | 'software_iot';

export interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  connectionStatus: ConnectionStatus;
  connectionState?: ConnectionState;
  lastUpdated: string | null;
  riskLevel: RiskLevel;
  anomalyScore: number;
  source?: 'live' | 'simulated';
}

export interface LaptopTelemetry {
  deviceId: string;
  deviceType: 'laptop';
  timestamp: string;
  cpu: number;
  ram: number;
  disk: number;
  uploadMb: number;
  downloadMb: number;
  upload_mb?: number;
  download_mb?: number;
  processes: number;
  anomalyScore: number;
  anomaly_score?: number;
  risk: RiskLevel;
  reason: string;
  source?: 'live' | 'simulated';
  isStale?: boolean;
  connectionState?: ConnectionState;
}

export interface MobileTelemetry {
  deviceId: string;
  deviceType: 'mobile';
  timestamp: string;
  storagePercent: number;
  freeStorageGb: number;
  batteryPercent: number;
  temperature: number | null;
  temperatureUnit?: string;
  charging: boolean;
  networkStatus: string;
  dataUsageMb: number;
  anomalyScore: number;
  risk: RiskLevel;
  reason: string;
}

export interface IoTTelemetry {
  deviceId: string;
  deviceType: 'iot';
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  motion: boolean | null;
  voltage: number | null;
  current: number | null;
  anomalyScore: number;
  risk: RiskLevel;
  reason: string;
}

export interface Alert {
  alertId: string;
  deviceId: string;
  deviceType: DeviceType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  status: AlertStatus;
}

export interface AIAssessment {
  deviceId: string;
  risk: RiskLevel;
  assessment: string;
  recommendedActions: string[];
  generatedAt: string;
}

export interface Recommendation {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  safe: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  temperatureAlerts: boolean;
  storageAlerts: boolean;
  batteryAlerts: boolean;
  networkAlerts: boolean;
  iotAlerts: boolean;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  user?: User;
  error?: {
    code: string;
    message: string;
  };
}
