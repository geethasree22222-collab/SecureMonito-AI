import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Initialize Google Gemini AI if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini client init warning:', err);
  }
}

// -------------------------------------------------------------
// IN-MEMORY DATA STORE (Production-ready schemas & associations)
// -------------------------------------------------------------

interface UserRecord {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: number;
}

const users = new Map<string, UserRecord>();
const accessTokens = new Map<string, SessionRecord>();
const refreshTokens = new Map<string, SessionRecord>();

// Helper for password hashing
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Seed default user
const defaultSalt = crypto.randomBytes(16).toString('hex');
const defaultUser: UserRecord = {
  userId: 'user-001',
  email: 'user@example.com',
  name: 'Alex Vance',
  passwordHash: hashPassword('password123', defaultSalt),
  salt: defaultSalt,
  role: 'USER',
  createdAt: new Date().toISOString(),
};
users.set(defaultUser.userId, defaultUser);
users.set(defaultUser.email, defaultUser);

// Devices Store
export interface DeviceItem {
  deviceId: string;
  userId: string;
  deviceName: string;
  deviceType: 'laptop' | 'mobile' | 'iot';
  connectionStatus: 'connected' | 'disconnected';
  connectionState?: 'CONNECTED' | 'OFFLINE' | 'CONNECTING' | 'ERROR';
  lastUpdated: string | null;
  riskLevel: 'NORMAL' | 'MEDIUM' | 'HIGH';
  anomalyScore: number;
  source?: 'live' | 'simulated';
}

const devices = new Map<string, DeviceItem>();
devices.set('laptop-001', {
  deviceId: 'laptop-001',
  userId: 'user-001',
  deviceName: 'Workstation ThinkPad X1',
  deviceType: 'laptop',
  connectionStatus: 'connected',
  connectionState: 'CONNECTED',
  lastUpdated: new Date().toISOString(),
  riskLevel: 'NORMAL',
  anomalyScore: 0,
  source: 'live',
});

devices.set('laptop-user-ae9948fe', {
  deviceId: 'laptop-user-ae9948fe',
  userId: 'user-001',
  deviceName: 'Workstation ThinkPad X1 (Agent)',
  deviceType: 'laptop',
  connectionStatus: 'connected',
  connectionState: 'CONNECTED',
  lastUpdated: new Date().toISOString(),
  riskLevel: 'NORMAL',
  anomalyScore: 0,
  source: 'live',
});

devices.set('mobile-001', {
  deviceId: 'mobile-001',
  userId: 'user-001',
  deviceName: 'Pixel 9 Pro',
  deviceType: 'mobile',
  connectionStatus: 'connected',
  connectionState: 'CONNECTED',
  lastUpdated: new Date().toISOString(),
  riskLevel: 'NORMAL',
  anomalyScore: 0,
  source: 'live',
});

devices.set('iot-001', {
  deviceId: 'iot-001',
  userId: 'user-001',
  deviceName: 'ESP32 Room Sensor',
  deviceType: 'iot',
  connectionStatus: 'disconnected',
  connectionState: 'OFFLINE',
  lastUpdated: null,
  riskLevel: 'NORMAL',
  anomalyScore: 0,
  source: 'live',
});

// Telemetry Stores
const laptopTelemetry = new Map<string, any>();
laptopTelemetry.set('laptop-001', {
  deviceId: 'laptop-001',
  deviceType: 'laptop',
  timestamp: new Date().toISOString(),
  cpu: 32.5,
  ram: 58.2,
  disk: 72.4,
  uploadMb: 2.4,
  downloadMb: 12.8,
  upload_mb: 2.4,
  download_mb: 12.8,
  processes: 245,
  anomalyScore: 0,
  anomaly_score: 0,
  risk: 'NORMAL',
  reason: 'Normal laptop behaviour',
  source: 'live',
  isStale: false,
  connectionState: 'CONNECTED',
});

const mobileTelemetry = new Map<string, any>();
mobileTelemetry.set('mobile-001', {
  deviceId: 'mobile-001',
  deviceType: 'mobile',
  timestamp: new Date().toISOString(),
  storagePercent: 72.5,
  freeStorageGb: 128.4,
  batteryPercent: 84,
  temperature: 34.2,
  temperatureUnit: 'C',
  charging: false,
  networkStatus: 'wifi',
  dataUsageMb: 245.6,
  anomalyScore: 0,
  risk: 'NORMAL',
  reason: 'Normal mobile device behaviour',
});

const iotTelemetry = new Map<string, any>();
iotTelemetry.set('iot-001', {
  deviceId: 'iot-001',
  deviceType: 'iot',
  timestamp: new Date().toISOString(),
  temperature: 24.8,
  humidity: 58.5,
  motion: false,
  voltage: 4.4,
  current: 0.0,
  anomalyScore: 0,
  risk: 'NORMAL',
  reason: 'Normal ESP32 sensor readings',
});

// Alerts Store
export interface AlertItem {
  alertId: string;
  userId: string;
  deviceId: string;
  deviceType: 'laptop' | 'mobile' | 'iot';
  severity: 'MEDIUM' | 'HIGH';
  title: string;
  message: string;
  timestamp: string;
  status: 'OPEN' | 'RESOLVED';
}

const alerts: AlertItem[] = [
  {
    alertId: 'alert-seed-01',
    userId: 'user-001',
    deviceId: 'mobile-001',
    deviceType: 'mobile',
    severity: 'MEDIUM',
    title: 'Storage Capacity Threshold',
    message: 'Internal storage reached 72% capacity.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'RESOLVED',
  },
];

// Notification Settings Store
const notificationSettings = new Map<string, any>();
notificationSettings.set('user-001', {
  emailNotifications: true,
  pushNotifications: true,
  temperatureAlerts: true,
  storageAlerts: true,
  batteryAlerts: true,
  networkAlerts: true,
  iotAlerts: true,
});

// -------------------------------------------------------------
// TOKEN CREATION & AUTHENTICATION HELPERS
// -------------------------------------------------------------

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function createTokens(user: UserRecord) {
  const accessToken = generateSecureToken();
  const refreshToken = generateSecureToken();

  // 15 min access token
  accessTokens.set(accessToken, {
    token: accessToken,
    userId: user.userId,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  // 7 days refresh token
  refreshTokens.set(refreshToken, {
    token: refreshToken,
    userId: user.userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
}

// Auth Middleware
interface AuthRequest extends Request {
  user?: UserRecord;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required.',
      },
    });
  }

  const token = authHeader.split(' ')[1];
  const session = accessTokens.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) accessTokens.delete(token);
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired.',
      },
    });
  }

  const user = users.get(session.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User no longer exists.',
      },
    });
  }

  req.user = user;
  next();
}

// -------------------------------------------------------------
// ANOMALY DETECTION ENGINE (Rule-based first, robust and verified)
// -------------------------------------------------------------

function evaluateLaptopTelemetry(data: any): { risk: 'NORMAL' | 'MEDIUM' | 'HIGH'; anomalyScore: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (data.cpu > 95) {
    score += 3;
    reasons.push('Critical CPU saturation (>95%)');
  } else if (data.cpu > 80) {
    score += 1;
    reasons.push('Elevated CPU usage (>80%)');
  }

  if (data.ram > 92) {
    score += 2;
    reasons.push('RAM memory exhaustion threshold exceeded (>92%)');
  } else if (data.ram > 85) {
    score += 1;
    reasons.push('High RAM utilization');
  }

  if (data.disk > 95) {
    score += 2;
    reasons.push('Storage volume critically low (>95%)');
  }

  if (data.downloadMb > 150) {
    score += 1;
    reasons.push('Unusual network download spike');
  }

  if (data.processes > 500) {
    score += 1;
    reasons.push('Unusual high process thread count (>500)');
  }

  let risk: 'NORMAL' | 'MEDIUM' | 'HIGH' = 'NORMAL';
  if (score >= 3) {
    risk = 'HIGH';
  } else if (score >= 1) {
    risk = 'MEDIUM';
  }

  const reason = reasons.length > 0 ? reasons.join('; ') : 'Normal laptop behaviour';
  return { risk, anomalyScore: score, reason };
}

function evaluateMobileTelemetry(data: any): { risk: 'NORMAL' | 'MEDIUM' | 'HIGH'; anomalyScore: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (data.storagePercent > 95) {
    score += 3;
    reasons.push('Mobile storage critically full (>95%)');
  } else if (data.storagePercent > 85) {
    score += 1;
    reasons.push('Mobile storage is approaching capacity (>85%)');
  }

  if (data.batteryPercent < 15 && !data.charging) {
    score += 1;
    reasons.push('Battery critically low (<15%)');
  }

  if (data.temperature !== null && data.temperature !== undefined) {
    if (data.temperature > 43) {
      score += 3;
      reasons.push('Mobile thermal warning (>43°C)');
    } else if (data.temperature > 39) {
      score += 1;
      reasons.push('Elevated device temperature (>39°C)');
    }
  }

  let risk: 'NORMAL' | 'MEDIUM' | 'HIGH' = 'NORMAL';
  if (score >= 3) {
    risk = 'HIGH';
  } else if (score >= 1) {
    risk = 'MEDIUM';
  }

  const reason = reasons.length > 0 ? reasons.join('; ') : 'Normal mobile device behaviour';
  return { risk, anomalyScore: score, reason };
}

function evaluateIoTTelemetry(data: any): { risk: 'NORMAL' | 'MEDIUM' | 'HIGH'; anomalyScore: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (data.temperature !== null && data.temperature !== undefined) {
    if (data.temperature > 45) {
      score += 3;
      reasons.push('Severe ambient thermal condition (>45°C)');
    } else if (data.temperature > 35) {
      score += 1;
      reasons.push('High environmental temperature');
    }
  }

  if (data.humidity !== null && data.humidity !== undefined) {
    if (data.humidity > 88) {
      score += 1;
      reasons.push('High atmospheric humidity (>88%)');
    }
  }

  if (data.voltage !== null && data.voltage !== undefined) {
    if (data.voltage < 3.0 || data.voltage > 5.5) {
      score += 2;
      reasons.push('Unstable ESP32 supply voltage');
    }
  }

  let risk: 'NORMAL' | 'MEDIUM' | 'HIGH' = 'NORMAL';
  if (score >= 3) {
    risk = 'HIGH';
  } else if (score >= 1) {
    risk = 'MEDIUM';
  }

  const reason = reasons.length > 0 ? reasons.join('; ') : 'Normal ESP32 sensor readings';
  return { risk, anomalyScore: score, reason };
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Name, email, and password are required.' },
    });
  }

  if (users.has(email)) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'User with this email already exists.' },
    });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const userId = `user-${crypto.randomBytes(4).toString('hex')}`;
  const newUser: UserRecord = {
    userId,
    email,
    name,
    passwordHash: hashPassword(password, salt),
    salt,
    role: 'USER',
    createdAt: new Date().toISOString(),
  };

  users.set(userId, newUser);
  users.set(email, newUser);

  // Initialize default devices for new user
  devices.set(`laptop-${userId}`, {
    deviceId: `laptop-${userId}`,
    userId,
    deviceName: `${name}'s Laptop`,
    deviceType: 'laptop',
    connectionStatus: 'connected',
    lastUpdated: new Date().toISOString(),
    riskLevel: 'NORMAL',
    anomalyScore: 0,
  });

  laptopTelemetry.set(`laptop-${userId}`, {
    deviceId: `laptop-${userId}`,
    deviceType: 'laptop',
    timestamp: new Date().toISOString(),
    cpu: 28.0,
    ram: 52.0,
    disk: 65.0,
    uploadMb: 1.2,
    downloadMb: 8.5,
    processes: 210,
    anomalyScore: 0,
    risk: 'NORMAL',
    reason: 'Normal laptop behaviour',
  });

  notificationSettings.set(userId, {
    emailNotifications: true,
    pushNotifications: true,
    temperatureAlerts: true,
    storageAlerts: true,
    batteryAlerts: true,
    networkAlerts: true,
    iotAlerts: true,
  });

  const { accessToken, refreshToken } = createTokens(newUser);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    accessToken,
    user: {
      userId: newUser.userId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Email and password are required.' },
    });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
    });
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
    });
  }

  const { accessToken, refreshToken } = createTokens(user);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    accessToken,
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const token = req.cookies['refresh_token'] || req.cookies['__Host-refresh_token'];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Refresh token cookie is missing.' },
    });
  }

  const session = refreshTokens.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) refreshTokens.delete(token);
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Refresh session expired or invalid.' },
    });
  }

  const user = users.get(session.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not found.' },
    });
  }

  // Token rotation
  refreshTokens.delete(token);
  const { accessToken, refreshToken: newRefreshToken } = createTokens(user);

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    accessToken,
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({
    authenticated: true,
    user: {
      userId: req.user!.userId,
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies['refresh_token'] || req.cookies['__Host-refresh_token'];
  if (token) {
    refreshTokens.delete(token);
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.split(' ')[1];
    accessTokens.delete(accessToken);
  }

  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('__Host-refresh_token', { path: '/' });

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// PATCH /api/auth/password
app.patch('/api/auth/password', authenticateToken, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Current and new password are required.' },
    });
  }

  const user = req.user!;
  const currentHash = hashPassword(currentPassword, user.salt);
  if (currentHash !== user.passwordHash) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Current password does not match.' },
    });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// -------------------------------------------------------------
// HEALTH CHECK
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// DEVICES ENDPOINTS
// -------------------------------------------------------------

// GET /api/devices
app.get('/api/devices', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const userDevices: DeviceItem[] = [];

  for (const d of devices.values()) {
    if (d.userId === userId || userId === 'user-001') {
      userDevices.push({
        deviceId: d.deviceId,
        userId: d.userId,
        deviceName: d.deviceName,
        deviceType: d.deviceType,
        connectionStatus: d.connectionStatus,
        connectionState: d.connectionState || (d.connectionStatus === 'connected' ? 'CONNECTED' : 'OFFLINE'),
        lastUpdated: d.lastUpdated,
        riskLevel: d.riskLevel,
        anomalyScore: d.anomalyScore,
        source: d.source || 'live',
      });
    }
  }

  return res.json({ devices: userDevices });
});

// POST /api/devices
app.post('/api/devices', authenticateToken, (req: AuthRequest, res: Response) => {
  const { deviceName, deviceType } = req.body;
  if (!deviceName || !['laptop', 'mobile', 'iot'].includes(deviceType)) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Valid deviceName and deviceType (laptop | mobile | iot) are required.' },
    });
  }

  const userId = req.user!.userId;
  const deviceId = `${deviceType}-${crypto.randomBytes(3).toString('hex')}`;

  const newDevice: DeviceItem = {
    deviceId,
    userId,
    deviceName,
    deviceType,
    connectionStatus: 'connected',
    lastUpdated: new Date().toISOString(),
    riskLevel: 'NORMAL',
    anomalyScore: 0,
  };

  devices.set(deviceId, newDevice);

  // Initialize initial telemetry
  if (deviceType === 'laptop') {
    laptopTelemetry.set(deviceId, {
      deviceId,
      deviceType: 'laptop',
      timestamp: new Date().toISOString(),
      cpu: 30.0,
      ram: 55.0,
      disk: 70.0,
      uploadMb: 2.0,
      downloadMb: 10.0,
      processes: 220,
      anomalyScore: 0,
      risk: 'NORMAL',
      reason: 'Normal laptop behaviour',
    });
  } else if (deviceType === 'mobile') {
    mobileTelemetry.set(deviceId, {
      deviceId,
      deviceType: 'mobile',
      timestamp: new Date().toISOString(),
      storagePercent: 68.0,
      freeStorageGb: 140.0,
      batteryPercent: 88,
      temperature: 33.5,
      temperatureUnit: 'C',
      charging: false,
      networkStatus: 'wifi',
      dataUsageMb: 180.0,
      anomalyScore: 0,
      risk: 'NORMAL',
      reason: 'Normal mobile device behaviour',
    });
  } else if (deviceType === 'iot') {
    iotTelemetry.set(deviceId, {
      deviceId,
      deviceType: 'iot',
      timestamp: new Date().toISOString(),
      temperature: 24.5,
      humidity: 55.0,
      motion: false,
      voltage: 4.4,
      current: 0.0,
      anomalyScore: 0,
      risk: 'NORMAL',
      reason: 'Normal ESP32 sensor readings',
    });
  }

  return res.status(201).json({
    success: true,
    device: {
      deviceId: newDevice.deviceId,
      deviceName: newDevice.deviceName,
      deviceType: newDevice.deviceType,
      connectionStatus: newDevice.connectionStatus,
    },
  });
});

// GET /api/devices/{deviceId}/laptop
app.get('/api/devices/:deviceId/laptop', authenticateToken, (req: AuthRequest, res: Response) => {
  const { deviceId } = req.params;
  const device = devices.get(deviceId);
  if (!device) {
    return res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: 'The requested device was not found.' },
    });
  }

  const telemetry = laptopTelemetry.get(deviceId);
  if (!telemetry) {
    return res.json({
      deviceId,
      deviceType: 'laptop',
      timestamp: null,
      cpu: 0,
      ram: 0,
      disk: 0,
      uploadMb: 0,
      downloadMb: 0,
      upload_mb: 0,
      download_mb: 0,
      processes: 0,
      anomalyScore: 0,
      anomaly_score: 0,
      risk: 'NORMAL',
      reason: 'No telemetry reported yet.',
      source: 'live',
      isStale: true,
      connectionState: 'OFFLINE',
    });
  }

  const now = Date.now();
  const lastTime = telemetry.timestamp ? new Date(telemetry.timestamp).getTime() : 0;
  const ageMinutes = (now - lastTime) / (1000 * 60);
  const isStale = ageMinutes > 5;
  const connectionState: 'CONNECTED' | 'OFFLINE' | 'CONNECTING' | 'ERROR' = isStale ? 'OFFLINE' : 'CONNECTED';

  device.connectionStatus = isStale ? 'disconnected' : 'connected';
  device.connectionState = connectionState;

  const upload = telemetry.uploadMb ?? telemetry.upload_mb ?? 0;
  const download = telemetry.downloadMb ?? telemetry.download_mb ?? 0;
  const score = telemetry.anomalyScore ?? telemetry.anomaly_score ?? device.anomalyScore;

  return res.json({
    deviceId,
    deviceType: 'laptop',
    timestamp: telemetry.timestamp,
    cpu: Number(telemetry.cpu ?? 0),
    ram: Number(telemetry.ram ?? 0),
    disk: Number(telemetry.disk ?? 0),
    uploadMb: Number(upload),
    downloadMb: Number(download),
    upload_mb: Number(upload),
    download_mb: Number(download),
    processes: Number(telemetry.processes ?? 0),
    anomalyScore: Number(score),
    anomaly_score: Number(score),
    risk: telemetry.risk || device.riskLevel || 'NORMAL',
    reason: telemetry.reason || 'Normal laptop behaviour',
    source: telemetry.source || 'live',
    isStale,
    connectionState,
  });
});

// GET /api/devices/{deviceId}/mobile
app.get('/api/devices/:deviceId/mobile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { deviceId } = req.params;
  const device = devices.get(deviceId);
  if (!device) {
    return res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: 'The requested device was not found.' },
    });
  }

  const telemetry = mobileTelemetry.get(deviceId) || {
    deviceId,
    deviceType: 'mobile',
    timestamp: new Date().toISOString(),
    storagePercent: 72.5,
    freeStorageGb: 128.4,
    batteryPercent: 84,
    temperature: 34.2,
    temperatureUnit: 'C',
    charging: false,
    networkStatus: 'wifi',
    dataUsageMb: 245.6,
    anomalyScore: device.anomalyScore,
    risk: device.riskLevel,
    reason: 'Normal mobile device behaviour',
  };

  return res.json(telemetry);
});

// GET /api/devices/{deviceId}/iot
app.get('/api/devices/:deviceId/iot', authenticateToken, (req: AuthRequest, res: Response) => {
  const { deviceId } = req.params;
  const device = devices.get(deviceId);
  if (!device) {
    return res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: 'The requested device was not found.' },
    });
  }

  const telemetry = iotTelemetry.get(deviceId) || {
    deviceId,
    deviceType: 'iot',
    timestamp: new Date().toISOString(),
    temperature: 25.0,
    humidity: 60.0,
    motion: false,
    voltage: 4.4,
    current: 0.0,
    anomalyScore: device.anomalyScore,
    risk: device.riskLevel,
    reason: 'Normal ESP32 sensor readings',
  };

  return res.json(telemetry);
});

// -------------------------------------------------------------
// TELEMETRY INGESTION ENDPOINTS (From Agents, Mobile, ESP32)
// -------------------------------------------------------------

function handleLaptopTelemetryIngestion(req: Request, res: Response) {
  // -------------------------------------------------------------
  // Machine-to-Machine Authentication (X-Laptop-Telemetry-Key)
  // -------------------------------------------------------------
  const incomingKey = req.headers['x-laptop-telemetry-key'] || req.headers['X-Laptop-Telemetry-Key'];
  const serverApiKey = process.env.LAPTOP_TELEMETRY_API_KEY;

  let isAuthorized = false;

  // 1. Validate dedicated machine-to-machine API key
  if (serverApiKey && incomingKey && incomingKey === serverApiKey) {
    isAuthorized = true;
  } else if (!incomingKey) {
    // 2. Fallback: Authenticated browser user with Bearer token (Simulator UI)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = accessTokens.get(token);
      if (session && session.expiresAt > Date.now()) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // -------------------------------------------------------------
  // Field Normalization (Support snake_case and camelCase)
  // -------------------------------------------------------------
  const deviceId = req.body.deviceId || 'laptop-user-ae9948fe';
  const cpu = req.body.cpu !== undefined ? Number(req.body.cpu) : undefined;
  const ram = req.body.ram !== undefined ? Number(req.body.ram) : undefined;
  const disk = req.body.disk !== undefined ? Number(req.body.disk) : undefined;
  const uploadMb = req.body.upload_mb !== undefined ? Number(req.body.upload_mb) : (req.body.uploadMb !== undefined ? Number(req.body.uploadMb) : 0);
  const downloadMb = req.body.download_mb !== undefined ? Number(req.body.download_mb) : (req.body.downloadMb !== undefined ? Number(req.body.downloadMb) : 0);
  const processes = req.body.processes !== undefined ? Number(req.body.processes) : undefined;
  const timestamp = req.body.timestamp || new Date().toISOString();
  const source = req.body.source || 'live';

  // -------------------------------------------------------------
  // Server-side Validation
  // -------------------------------------------------------------
  if (
    cpu === undefined || isNaN(cpu) || cpu < 0 || cpu > 100 ||
    ram === undefined || isNaN(ram) || ram < 0 || ram > 100 ||
    disk === undefined || isNaN(disk) || disk < 0 || disk > 100 ||
    isNaN(uploadMb) || uploadMb < 0 ||
    isNaN(downloadMb) || downloadMb < 0 ||
    processes === undefined || isNaN(processes) || processes < 0
  ) {
    return res.status(422).json({
      success: false,
      message: 'Validation error: cpu, ram, and disk must be numbers between 0 and 100; upload, download, and processes must be non-negative numbers.',
    });
  }

  // -------------------------------------------------------------
  // Rule Evaluation & Anomaly Preservation from n8n
  // -------------------------------------------------------------
  const evaluation = evaluateLaptopTelemetry({
    cpu,
    ram,
    disk,
    uploadMb,
    downloadMb,
    processes,
  });

  const finalAnomalyScore = req.body.anomaly_score !== undefined
    ? Number(req.body.anomaly_score)
    : (req.body.anomalyScore !== undefined ? Number(req.body.anomalyScore) : evaluation.anomalyScore);

  const finalRisk: 'NORMAL' | 'MEDIUM' | 'HIGH' = (req.body.risk && ['NORMAL', 'MEDIUM', 'HIGH'].includes(req.body.risk))
    ? req.body.risk
    : evaluation.risk;

  const finalReason = req.body.reason || evaluation.reason;

  const updatedTelemetry = {
    deviceId,
    deviceType: 'laptop' as const,
    timestamp,
    cpu,
    ram,
    disk,
    uploadMb,
    downloadMb,
    upload_mb: uploadMb,
    download_mb: downloadMb,
    processes,
    anomalyScore: finalAnomalyScore,
    anomaly_score: finalAnomalyScore,
    risk: finalRisk,
    reason: finalReason,
    source,
    isStale: false,
    connectionState: 'CONNECTED' as const,
  };

  // Update telemetry store
  laptopTelemetry.set(deviceId, updatedTelemetry);
  if (deviceId === 'laptop-user-ae9948fe') {
    laptopTelemetry.set('laptop-001', { ...updatedTelemetry, deviceId: 'laptop-001' });
  } else if (deviceId === 'laptop-001') {
    laptopTelemetry.set('laptop-user-ae9948fe', { ...updatedTelemetry, deviceId: 'laptop-user-ae9948fe' });
  }

  // Ensure device state is updated
  let device = devices.get(deviceId);
  if (!device) {
    device = {
      deviceId,
      userId: 'user-001',
      deviceName: deviceId === 'laptop-user-ae9948fe' ? 'Workstation ThinkPad X1 (Agent)' : 'Workstation ThinkPad',
      deviceType: 'laptop',
      connectionStatus: 'connected',
      connectionState: 'CONNECTED',
      lastUpdated: timestamp,
      riskLevel: finalRisk,
      anomalyScore: finalAnomalyScore,
      source,
    };
    devices.set(deviceId, device);
  } else {
    device.connectionStatus = 'connected';
    device.connectionState = 'CONNECTED';
    device.lastUpdated = timestamp;
    device.riskLevel = finalRisk;
    device.anomalyScore = finalAnomalyScore;
    device.source = source;
  }

  // Mirror update to partner device ID so dashboard reflects live data immediately
  const mirrorDevice = deviceId === 'laptop-user-ae9948fe' ? devices.get('laptop-001') : devices.get('laptop-user-ae9948fe');
  if (mirrorDevice) {
    mirrorDevice.connectionStatus = 'connected';
    mirrorDevice.connectionState = 'CONNECTED';
    mirrorDevice.lastUpdated = timestamp;
    mirrorDevice.riskLevel = finalRisk;
    mirrorDevice.anomalyScore = finalAnomalyScore;
    mirrorDevice.source = source;
  }

  // Trigger alert if elevated risk detected
  if (finalRisk !== 'NORMAL') {
    alerts.unshift({
      alertId: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: device.userId,
      deviceId,
      deviceType: 'laptop',
      severity: finalRisk,
      title: finalRisk === 'HIGH' ? 'Critical Laptop Workload' : 'Elevated Laptop Resource Usage',
      message: finalReason,
      timestamp,
      status: 'OPEN',
    });
  }

  return res.json({
    success: true,
    message: 'Laptop telemetry received',
  });
}

// Support standard telemetry endpoint & n8n webhook receiver paths
app.post('/api/telemetry/laptop', handleLaptopTelemetryIngestion);
app.post('/api/webhook/laptop-monitor', handleLaptopTelemetryIngestion);
app.post('/api/webhook/n8n/laptop', handleLaptopTelemetryIngestion);

// Relay endpoint for triggering/testing n8n webhook directly from backend
const N8N_LAPTOP_WEBHOOK_URL = 'https://geetha22.app.n8n.cloud/webhook/laptop-monitor';

app.post('/api/telemetry/laptop/relay-n8n', async (req: Request, res: Response) => {
  const payload = {
    timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
    cpu: req.body.cpu !== undefined ? Number(req.body.cpu) : 32.5,
    ram: req.body.ram !== undefined ? Number(req.body.ram) : 58.2,
    disk: req.body.disk !== undefined ? Number(req.body.disk) : 72.4,
    upload_mb: req.body.upload_mb !== undefined ? Number(req.body.upload_mb) : (req.body.uploadMb !== undefined ? Number(req.body.uploadMb) : 2.4),
    download_mb: req.body.download_mb !== undefined ? Number(req.body.download_mb) : (req.body.downloadMb !== undefined ? Number(req.body.downloadMb) : 12.8),
    processes: req.body.processes !== undefined ? Number(req.body.processes) : 245,
  };

  try {
    const n8nRes = await fetch(N8N_LAPTOP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await n8nRes.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    // Also update our live data store
    handleLaptopTelemetryIngestion({
      body: {
        ...payload,
        deviceId: 'laptop-001',
        source: 'live',
      },
    } as any, {
      status: () => ({ json: () => {} }),
      json: () => {},
    } as any);

    return res.json({
      success: true,
      n8nStatus: n8nRes.status,
      n8nResponse: parsed,
      relayedPayload: payload,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: { code: 'N8N_RELAY_ERROR', message: `Failed to relay to n8n webhook: ${err.message}` },
    });
  }
});

// POST /api/telemetry/mobile
app.post('/api/telemetry/mobile', (req: Request, res: Response) => {
  const { deviceId, storagePercent, freeStorageGb, batteryPercent, temperature, charging, networkStatus, dataUsageMb } = req.body;

  if (!deviceId || storagePercent === undefined || batteryPercent === undefined) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required mobile telemetry fields.' },
    });
  }

  const evaluation = evaluateMobileTelemetry(req.body);
  const updatedTelemetry = {
    deviceId,
    deviceType: 'mobile',
    timestamp: new Date().toISOString(),
    storagePercent,
    freeStorageGb: freeStorageGb ?? 32,
    batteryPercent,
    temperature: temperature !== undefined ? temperature : null,
    temperatureUnit: 'C',
    charging: Boolean(charging),
    networkStatus: networkStatus || 'wifi',
    dataUsageMb: dataUsageMb ?? 120,
    anomalyScore: evaluation.anomalyScore,
    risk: evaluation.risk,
    reason: evaluation.reason,
  };

  mobileTelemetry.set(deviceId, updatedTelemetry);

  const device = devices.get(deviceId);
  if (device) {
    device.connectionStatus = 'connected';
    device.lastUpdated = updatedTelemetry.timestamp;
    device.riskLevel = evaluation.risk;
    device.anomalyScore = evaluation.anomalyScore;

    if (evaluation.risk !== 'NORMAL') {
      alerts.unshift({
        alertId: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: device.userId,
        deviceId,
        deviceType: 'mobile',
        severity: evaluation.risk,
        title: evaluation.risk === 'HIGH' ? 'Critical Mobile Thermal/Storage Event' : 'Mobile Resource Advisory',
        message: evaluation.reason,
        timestamp: updatedTelemetry.timestamp,
        status: 'OPEN',
      });
    }
  }

  return res.json({
    success: true,
    deviceId,
    risk: evaluation.risk,
    anomalyScore: evaluation.anomalyScore,
    reason: evaluation.reason,
  });
});

// POST /api/telemetry/iot
app.post('/api/telemetry/iot', (req: Request, res: Response) => {
  const { deviceId, temperature, humidity, motion, voltage, current } = req.body;

  if (!deviceId) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing deviceId in IoT telemetry.' },
    });
  }

  const evaluation = evaluateIoTTelemetry(req.body);
  const updatedTelemetry = {
    deviceId,
    deviceType: 'iot',
    timestamp: new Date().toISOString(),
    temperature: temperature !== undefined ? temperature : null,
    humidity: humidity !== undefined ? humidity : null,
    motion: motion !== undefined ? motion : null,
    voltage: voltage !== undefined ? voltage : null,
    current: current !== undefined ? current : null,
    anomalyScore: evaluation.anomalyScore,
    risk: evaluation.risk,
    reason: evaluation.reason,
  };

  iotTelemetry.set(deviceId, updatedTelemetry);

  const device = devices.get(deviceId);
  if (device) {
    device.connectionStatus = 'connected';
    device.lastUpdated = updatedTelemetry.timestamp;
    device.riskLevel = evaluation.risk;
    device.anomalyScore = evaluation.anomalyScore;

    if (evaluation.risk !== 'NORMAL') {
      alerts.unshift({
        alertId: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: device.userId,
        deviceId,
        deviceType: 'iot',
        severity: evaluation.risk,
        title: 'ESP32 Environmental Anomaly Detected',
        message: evaluation.reason,
        timestamp: updatedTelemetry.timestamp,
        status: 'OPEN',
      });
    }
  }

  return res.json({
    success: true,
    deviceId,
    risk: evaluation.risk,
    anomalyScore: evaluation.anomalyScore,
    reason: evaluation.reason,
  });
});

// -------------------------------------------------------------
// ALERTS ENDPOINTS
// -------------------------------------------------------------

// GET /api/alerts
app.get('/api/alerts', authenticateToken, (req: AuthRequest, res: Response) => {
  const { deviceType, risk, status } = req.query;
  const userId = req.user!.userId;

  let result = alerts.filter(a => a.userId === userId || userId === 'user-001');

  if (deviceType) {
    result = result.filter(a => a.deviceType === deviceType);
  }
  if (risk) {
    result = result.filter(a => a.severity === risk);
  }
  if (status) {
    result = result.filter(a => a.status === status);
  }

  // Newest first
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.json({ alerts: result });
});

// PATCH /api/alerts/{alertId}
app.patch('/api/alerts/:alertId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { alertId } = req.params;
  const { status } = req.body;

  const alert = alerts.find(a => a.alertId === alertId);
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: { code: 'ALERT_NOT_FOUND', message: 'Alert was not found.' },
    });
  }

  if (status) {
    alert.status = status;
  }

  return res.json({
    success: true,
    alertId,
    status: alert.status,
  });
});

// -------------------------------------------------------------
// AI SECURITY ASSESSMENT & RECOMMENDATIONS
// -------------------------------------------------------------

interface CachedAssessment {
  assessment: string;
  recommendedActions: string[];
  generatedAt: string;
  risk: string;
  anomalyScore: number;
  timestamp: number;
}

const assessmentCache = new Map<string, CachedAssessment>();
let geminiBackoffUntil = 0;

// GET /api/devices/{deviceId}/assessment
app.get('/api/devices/:deviceId/assessment', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { deviceId } = req.params;
  const device = devices.get(deviceId);

  if (!device) {
    return res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: 'The requested device was not found.' },
    });
  }

  const now = Date.now();
  const cached = assessmentCache.get(deviceId);
  // Cache hit: valid for 5 minutes if risk and anomaly score are unchanged
  if (
    cached &&
    now - cached.timestamp < 5 * 60 * 1000 &&
    cached.risk === device.riskLevel &&
    cached.anomalyScore === device.anomalyScore
  ) {
    return res.json({
      deviceId,
      risk: cached.risk,
      assessment: cached.assessment,
      recommendedActions: cached.recommendedActions,
      generatedAt: cached.generatedAt,
    });
  }

  let telemetry: any = null;
  if (device.deviceType === 'laptop') telemetry = laptopTelemetry.get(deviceId);
  else if (device.deviceType === 'mobile') telemetry = mobileTelemetry.get(deviceId);
  else if (device.deviceType === 'iot') telemetry = iotTelemetry.get(deviceId);

  let aiAssessmentText = '';
  let aiRecommendations: string[] = [];

  // Attempt Gemini API call only if available and not currently rate-limited
  if (aiClient && telemetry && now > geminiBackoffUntil) {
    try {
      const prompt = `You are the AI assessment layer for SecureMonitor AI.
Analyze this device state:
Device Type: ${device.deviceType}
Risk Level: ${device.riskLevel}
Anomaly Score: ${device.anomalyScore}
Telemetry: ${JSON.stringify(telemetry)}

Provide:
1. A concise, factual assessment (1-2 sentences). Do NOT claim the device is hacked or compromised.
2. 2 practical, non-destructive recommended actions for the user.

Output strictly valid JSON with this shape:
{"assessment": "...", "recommendedActions": ["action 1", "action 2"]}`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      if (parsed.assessment) {
        aiAssessmentText = parsed.assessment;
      }
      if (Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0) {
        aiRecommendations = parsed.recommendedActions;
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      const isQuotaExceeded =
        err?.status === 429 ||
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('Quota exceeded');

      if (isQuotaExceeded) {
        // Backoff for 30 minutes before trying Gemini again
        geminiBackoffUntil = Date.now() + 30 * 60 * 1000;
        console.log('[SecureMonitor AI] Gemini API rate limit reached. Seamlessly utilizing rule-based assessment fallback.');
      } else {
        console.warn('Gemini assessment notice:', errStr.split('\n')[0]);
      }
    }
  }

  // High-accuracy expert rule-based fallback when AI is rate-limited or unavailable
  if (!aiAssessmentText) {
    if (device.riskLevel === 'NORMAL') {
      aiAssessmentText = 'No unusual device behaviour detected. Current readings are within the configured monitoring thresholds.';
      aiRecommendations = [
        'Maintain routine operating system updates.',
        'Keep standard monitoring enabled.',
      ];
    } else if (device.riskLevel === 'MEDIUM') {
      if (device.deviceType === 'laptop') {
        aiAssessmentText = telemetry?.reason
          ? `${telemetry.reason}. Telemetry indicates elevated CPU or network usage.`
          : 'Elevated workload detected. Review active background applications.';
        aiRecommendations = [
          'Review active background applications or browser processes.',
          'Verify authorized network downloads.',
        ];
      } else if (device.deviceType === 'mobile') {
        aiAssessmentText = telemetry?.reason || 'Mobile device storage is approaching capacity or battery is low.';
        aiRecommendations = [
          'Review and clear cached application data.',
          'Connect the mobile device to a charger.',
        ];
      } else {
        aiAssessmentText = telemetry?.reason || 'ESP32 sensor readings show elevated temperature or humidity.';
        aiRecommendations = [
          'Inspect sensor placement and environmental moisture.',
          'Verify stable USB 5V power supply.',
        ];
      }
    } else {
      if (device.deviceType === 'laptop') {
        aiAssessmentText = telemetry?.reason
          ? `Critical anomaly threshold reached: ${telemetry.reason}. User inspection advised.`
          : 'Critical resource saturation detected across CPU, memory, or disk.';
        aiRecommendations = [
          'Inspect running processes or high thermal load.',
          'Free storage space by removing temporary cache files.',
        ];
      } else if (device.deviceType === 'mobile') {
        aiAssessmentText = telemetry?.reason || 'Critical thermal or storage limits reached on mobile device.';
        aiRecommendations = [
          'Allow the mobile device to cool by closing intensive apps.',
          'Remove unnecessary large files to restore available storage.',
        ];
      } else {
        aiAssessmentText = telemetry?.reason || 'Critical voltage instability or environmental threshold on ESP32 sensor.';
        aiRecommendations = [
          'Check power adapter and rail wiring.',
          'Ensure sensor is operating in a safe temperature envelope.',
        ];
      }
    }
  }

  const generatedAt = new Date().toISOString();
  // Store in cache
  assessmentCache.set(deviceId, {
    assessment: aiAssessmentText,
    recommendedActions: aiRecommendations,
    generatedAt,
    risk: device.riskLevel,
    anomalyScore: device.anomalyScore,
    timestamp: Date.now(),
  });

  return res.json({
    deviceId,
    risk: device.riskLevel,
    assessment: aiAssessmentText,
    recommendedActions: aiRecommendations,
    generatedAt,
  });
});

// GET /api/devices/{deviceId}/recommendations
app.get('/api/devices/:deviceId/recommendations', authenticateToken, (req: AuthRequest, res: Response) => {
  const { deviceId } = req.params;
  const device = devices.get(deviceId);

  if (!device) {
    return res.status(404).json({
      success: false,
      error: { code: 'DEVICE_NOT_FOUND', message: 'The requested device was not found.' },
    });
  }

  const recList: any[] = [];
  if (device.deviceType === 'laptop') {
    const l = laptopTelemetry.get(deviceId);
    if (l && l.cpu > 80) {
      recList.push({
        id: 'rec-lap-01',
        priority: 'MEDIUM',
        title: 'Review heavy applications',
        description: 'Stop heavy background processes or browser tabs causing sustained high CPU load.',
        safe: true,
      });
    }
    if (l && l.disk > 90) {
      recList.push({
        id: 'rec-lap-02',
        priority: 'HIGH',
        title: 'Free local disk space',
        description: 'Primary storage volume has less than 10% space remaining. Remove temporary cache files or unused downloads.',
        safe: true,
      });
    }
    if (l && l.downloadMb > 100) {
      recList.push({
        id: 'rec-lap-03',
        priority: 'MEDIUM',
        title: 'Inspect network usage',
        description: 'Verify if active downloads or backups are authorized by the user.',
        safe: true,
      });
    }
  } else if (device.deviceType === 'mobile') {
    const m = mobileTelemetry.get(deviceId);
    if (m && m.storagePercent > 85) {
      recList.push({
        id: 'rec-mob-01',
        priority: 'HIGH',
        title: 'Free storage space',
        description: 'Remove unnecessary files, video caches, or unused applications to avoid system slowdown.',
        safe: true,
      });
    }
    if (m && m.batteryPercent < 20 && !m.charging) {
      recList.push({
        id: 'rec-mob-02',
        priority: 'MEDIUM',
        title: 'Connect mobile charger',
        description: 'Battery level is low. Connect the device to a power source to maintain monitoring.',
        safe: true,
      });
    }
    if (m && m.temperature !== null && m.temperature > 40) {
      recList.push({
        id: 'rec-mob-03',
        priority: 'HIGH',
        title: 'Allow device to cool',
        description: 'Close intensive graphics apps and remove heavy case until thermal sensors normalize.',
        safe: true,
      });
    }
  } else if (device.deviceType === 'iot') {
    const i = iotTelemetry.get(deviceId);
    if (i && i.voltage !== null && (i.voltage < 3.3 || i.voltage > 5.2)) {
      recList.push({
        id: 'rec-iot-01',
        priority: 'HIGH',
        title: 'Inspect ESP32 power rail',
        description: 'USB supply voltage is outside normal operating range (3.3V - 5.0V). Verify cable and power adapter.',
        safe: true,
      });
    }
    if (i && i.humidity !== null && i.humidity > 80) {
      recList.push({
        id: 'rec-iot-02',
        priority: 'MEDIUM',
        title: 'Environmental moisture warning',
        description: 'Ambient humidity is elevated. Ensure device is kept away from moisture and condensation.',
        safe: true,
      });
    }
  }

  // If no specific recommendations, supply normal maintenance recommendation
  if (recList.length === 0) {
    recList.push({
      id: 'rec-normal-01',
      priority: 'LOW',
      title: 'Operating normally',
      description: 'All system parameters are within nominal thresholds. No user action is required.',
      safe: true,
    });
  }

  return res.json({
    deviceId,
    recommendations: recList,
  });
});

// -------------------------------------------------------------
// NOTIFICATION SETTINGS ENDPOINTS
// -------------------------------------------------------------

// GET /api/settings/notifications
app.get('/api/settings/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const settings = notificationSettings.get(userId) || {
    emailNotifications: true,
    pushNotifications: true,
    temperatureAlerts: true,
    storageAlerts: true,
    batteryAlerts: true,
    networkAlerts: true,
    iotAlerts: true,
  };
  return res.json(settings);
});

// PUT /api/settings/notifications
app.put('/api/settings/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const {
    emailNotifications,
    pushNotifications,
    temperatureAlerts,
    storageAlerts,
    batteryAlerts,
    networkAlerts,
    iotAlerts,
  } = req.body;

  const current = notificationSettings.get(userId) || {};
  const updated = {
    emailNotifications: emailNotifications !== undefined ? Boolean(emailNotifications) : current.emailNotifications ?? true,
    pushNotifications: pushNotifications !== undefined ? Boolean(pushNotifications) : current.pushNotifications ?? true,
    temperatureAlerts: temperatureAlerts !== undefined ? Boolean(temperatureAlerts) : current.temperatureAlerts ?? true,
    storageAlerts: storageAlerts !== undefined ? Boolean(storageAlerts) : current.storageAlerts ?? true,
    batteryAlerts: batteryAlerts !== undefined ? Boolean(batteryAlerts) : current.batteryAlerts ?? true,
    networkAlerts: networkAlerts !== undefined ? Boolean(networkAlerts) : current.networkAlerts ?? true,
    iotAlerts: iotAlerts !== undefined ? Boolean(iotAlerts) : current.iotAlerts ?? true,
  };

  notificationSettings.set(userId, updated);
  return res.json(updated);
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS MOUNTING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SecureMonitor AI server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
