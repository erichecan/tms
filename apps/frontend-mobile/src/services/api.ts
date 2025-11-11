// 2025-11-11T15:34:56Z Added by Assistant: Mobile API client with auth support
import axios from 'axios';
import { LoginPayload, AuthResponseData } from '../types';

export const TOKEN_STORAGE_KEY = 'mobile_jwt_token';
export const DRIVER_STORAGE_KEY = 'mobile_driver_id';
export const TENANT_STORAGE_KEY = 'mobile_tenant_id';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = localStorage.getItem(TENANT_STORAGE_KEY) || '00000000-0000-0000-0000-000000000001';
  config.headers = config.headers ?? {};
  config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);

export const persistSession = (payload: AuthResponseData): void => {
  const token = payload.token || payload.accessToken;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  if (payload.user?.tenant?.id) {
    localStorage.setItem(TENANT_STORAGE_KEY, payload.user.tenant.id);
  }
  const driverId =
    (payload.user?.profile && (payload.user.profile as Record<string, string>).driverId) ||
    payload.user?.id ||
    null;
  if (driverId) {
    localStorage.setItem(DRIVER_STORAGE_KEY, driverId);
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(DRIVER_STORAGE_KEY);
  localStorage.removeItem(TENANT_STORAGE_KEY);
};

export const authApi = {
  async login(credentials: LoginPayload): Promise<AuthResponseData> {
    const response = await api.post<{ success: boolean; data: AuthResponseData }>('/auth/login', credentials);
    const payload = response.data.data;
    persistSession(payload);
    return payload;
  },
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
    }
  },
  getProfile: () => api.get('/auth/profile'),
};

const getDriverId = (): string | null => localStorage.getItem(DRIVER_STORAGE_KEY);

export const driverShipmentsApi = {
  getDriverShipments: () => api.get('/shipments/driver/me'),
  startPickup: (shipmentId: string, driverId?: string) =>
    api.post(`/shipments/${shipmentId}/pickup`, driverId ? { driverId } : {}),
  startTransit: (shipmentId: string, driverId?: string) =>
    api.post(`/shipments/${shipmentId}/transit`, driverId ? { driverId } : {}),
  completeDelivery: (shipmentId: string, driverId?: string) =>
    api.post(`/shipments/${shipmentId}/delivery`, driverId ? { driverId } : {}),
  uploadShipmentPOD: (shipmentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const driverId = getDriverId();
    if (driverId) {
      formData.append('driverId', driverId);
    }
    return api.post(`/shipments/${shipmentId}/pod`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;