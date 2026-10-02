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
} from '../types';

const PRODUCTION_BACKEND_URL = 'https://ais-pre-bbvk7a6urp7kuuxvosso4k-998137428727.asia-southeast1.run.app';

// In production on Vercel or external hosts, route requests to the Cloud Run backend
export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Route to Cloud Run backend if deployed on Vercel or external domain
    if (hostname.includes('vercel.app') || (!hostname.includes('localhost') && !hostname.includes('run.app'))) {
      return PRODUCTION_BACKEND_URL;
    }
  }
  return '';
}

const API_BASE_URL = getApiBaseUrl();

// Access token stored in-memory (per security requirements)
let currentAccessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let authStateListener: ((user: User | null) => void) | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAuthStateListener(listener: ((user: User | null) => void) | null) {
  authStateListener = listener;
}

// Single token refresh execution lock (handles multi-request/tab coordination)
async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Includes HttpOnly cookie
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.accessToken) {
            setAccessToken(data.accessToken);
            return true;
          }
        }
      }
      // If refresh fails, clear token and notify
      setAccessToken(null);
      if (authStateListener) authStateListener(null);
      return false;
    } catch {
      setAccessToken(null);
      if (authStateListener) authStateListener(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Centralized API Request handler with Bearer token & 401 refresh flow
export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (netErr: any) {
    console.warn(`[SecureMonitor AI] Network error fetching ${baseUrl}${path}:`, netErr);
    throw new Error('Connection unavailable');
  }

  // Handle 401 with one-time refresh retry
  if (response.status === 401 && !path.includes('/api/auth/login') && !path.includes('/api/auth/refresh')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set('Content-Type', 'application/json');
      retryHeaders.set('Authorization', `Bearer ${getAccessToken()}`);

      try {
        response = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        });
      } catch {
        throw new Error('Connection unavailable');
      }
    } else {
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Safely parse JSON or handle HTML/text response (e.g. from Vercel proxy or error page)
  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    // Non-JSON response (e.g. HTML 404/502 from proxy or hosting platform)
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText || 'Backend route unavailable'}`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Received unexpected non-JSON response from backend. Verify backend URL.`);
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// -------------------------------------------------------------
// EXPLICIT SERVICE LAYER FUNCTIONS (CONTRACT MATCH)
// -------------------------------------------------------------

export async function checkBackendHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest<{ status: string; timestamp: string }>('/api/health');
}

export async function login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
  const data = await apiRequest<{ success: boolean; user: User; accessToken: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.accessToken);
  if (authStateListener) authStateListener(data.user);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<{ user: User; accessToken: string }> {
  const data = await apiRequest<{ success: boolean; user: User; accessToken: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setAccessToken(data.accessToken);
  if (authStateListener) authStateListener(data.user);
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await apiRequest<{ authenticated: boolean; user: User }>('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
    if (authStateListener) authStateListener(null);
  }
}

export async function getDevices(): Promise<{ devices: Device[] }> {
  return apiRequest<{ devices: Device[] }>('/api/devices');
}

export async function registerDevice(deviceName: string, deviceType: 'laptop' | 'mobile' | 'iot'): Promise<any> {
  return apiRequest('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ deviceName, deviceType }),
  });
}

export async function getLaptopStatus(deviceId: string = 'laptop-001'): Promise<LaptopTelemetry> {
  return apiRequest<LaptopTelemetry>(`/api/devices/${deviceId}/laptop`);
}

export async function getLaptopMetrics(deviceId: string = 'laptop-001'): Promise<LaptopTelemetry> {
  return getLaptopStatus(deviceId);
}

export async function getLaptopAssessment(deviceId: string = 'laptop-001'): Promise<AIAssessment> {
  return getAIAssessment(deviceId);
}

export async function triggerN8nRelay(payload?: {
  cpu?: number;
  ram?: number;
  disk?: number;
  upload_mb?: number;
  download_mb?: number;
  processes?: number;
}): Promise<{ success: boolean; n8nStatus: number; n8nResponse: any; relayedPayload: any }> {
  return apiRequest('/api/telemetry/laptop/relay-n8n', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function getMobileStatus(deviceId: string): Promise<MobileTelemetry> {
  return apiRequest<MobileTelemetry>(`/api/devices/${deviceId}/mobile`);
}

export async function getIoTStatus(deviceId: string): Promise<IoTTelemetry> {
  return apiRequest<IoTTelemetry>(`/api/devices/${deviceId}/iot`);
}

export async function sendLaptopTelemetry(data: {
  deviceId: string;
  timestamp?: string;
  cpu: number;
  ram: number;
  disk: number;
  uploadMb?: number;
  downloadMb?: number;
  processes?: number;
}): Promise<any> {
  return apiRequest('/api/telemetry/laptop', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });
}

export async function sendMobileTelemetry(data: {
  deviceId: string;
  timestamp?: string;
  storagePercent: number;
  freeStorageGb?: number;
  batteryPercent: number;
  temperature?: number | null;
  charging?: boolean;
  networkStatus?: string;
  dataUsageMb?: number;
}): Promise<any> {
  return apiRequest('/api/telemetry/mobile', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });
}

export async function sendIoTTelemetry(data: {
  deviceId: string;
  timestamp?: string;
  temperature?: number | null;
  humidity?: number | null;
  motion?: boolean | null;
  voltage?: number | null;
  current?: number | null;
}): Promise<any> {
  return apiRequest('/api/telemetry/iot', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    }),
  });
}

export async function getAlerts(filters?: {
  deviceType?: string;
  risk?: string;
  status?: string;
}): Promise<{ alerts: Alert[] }> {
  const query = new URLSearchParams();
  if (filters?.deviceType) query.set('deviceType', filters.deviceType);
  if (filters?.risk) query.set('risk', filters.risk);
  if (filters?.status) query.set('status', filters.status);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<{ alerts: Alert[] }>(`/api/alerts${qStr}`);
}

export async function resolveAlert(alertId: string): Promise<{ success: boolean; alertId: string; status: string }> {
  return apiRequest(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'RESOLVED' }),
  });
}

export async function getAIAssessment(deviceId: string): Promise<AIAssessment> {
  return apiRequest<AIAssessment>(`/api/devices/${deviceId}/assessment`);
}

export async function getRecommendations(deviceId: string): Promise<{ deviceId: string; recommendations: Recommendation[] }> {
  return apiRequest<{ deviceId: string; recommendations: Recommendation[] }>(`/api/devices/${deviceId}/recommendations`);
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return apiRequest<NotificationSettings>('/api/settings/notifications');
}

export async function updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
  return apiRequest<NotificationSettings>('/api/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
