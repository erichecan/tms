import axios from 'axios';
import { UserLoginPayload, AuthResponse } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and Tenant ID // 2025-09-25 23:42:00
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 租户ID：开发环境默认绑定演示租户 // 2025-09-25 23:42:00
    const tenantId = localStorage.getItem('current_tenant_id') || '00000000-0000-0000-0000-000000000001';
    config.headers['X-Tenant-ID'] = tenantId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token 刷新状态 - 2025-10-10 18:15:00
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling and token refresh - 2025-10-10 18:15:00
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 处理 401 错误
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // 开发环境：直接重定向到登录页 - 2025-10-10 18:15:00
      if (import.meta.env.DEV) {
        console.log('[DEV MODE] 401 error, token may be invalid');
        // 开发环境下由于后端跳过认证，401 不应该发生
        // 如果发生了，可能是配置问题，直接放行
        return Promise.reject(error);
      }

      // 生产环境：尝试刷新 token - 2025-10-10 18:15:00
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await authApi.refreshToken();
        const { token } = response.data;
        localStorage.setItem('jwt_token', token);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth related API calls
export const authApi = {
  login: (credentials: UserLoginPayload) => api.post<AuthResponse>('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
};

// Rule related API calls
export const rulesApi = {
  getRules: (params?: any) => api.get('/rules', { params }),
  createRule: (ruleData: any) => api.post('/rules', ruleData),
  updateRule: (ruleId: string, ruleData: any) => api.put(`/rules/${ruleId}`, ruleData),
  deleteRule: (ruleId: string) => api.delete(`/rules/${ruleId}`),
  fuzzyMatchRules: (ruleData: any) => api.post('/rules/fuzzy-match', ruleData),
  detectRuleConflicts: (ruleData: any) => api.post('/rules/detect-conflicts', ruleData),
};

// Shipment related API calls
export const shipmentsApi = {
  getShipments: (params?: any) => api.get('/shipments', { params }),
  createShipment: (shipmentData: any) => api.post('/shipments', shipmentData),
  getShipmentDetails: (shipmentId: string) => api.get(`/shipments/${shipmentId}`),
  updateShipment: (shipmentId: string, shipmentData: any) => api.put(`/shipments/${shipmentId}`, shipmentData),
  deleteShipment: (shipmentId: string) => api.delete(`/shipments/${shipmentId}`),
  updateShipmentStatus: (shipmentId: string, status: string) => api.patch(`/shipments/${shipmentId}/status`, { status }),
  // 运单状态流转API
  assignDriver: (shipmentId: string, driverId: string, notes?: string) => 
    api.post(`/shipments/${shipmentId}/assign`, { driverId, notes }),
  confirmShipment: (shipmentId: string) => api.post(`/shipments/${shipmentId}/confirm`),
  startPickup: (shipmentId: string, driverId?: string) => 
    api.post(`/shipments/${shipmentId}/pickup`, { driverId }),
  startTransit: (shipmentId: string, driverId?: string) => 
    api.post(`/shipments/${shipmentId}/transit`, { driverId }),
  completeDelivery: (shipmentId: string, driverId?: string, deliveryNotes?: string) => 
    api.post(`/shipments/${shipmentId}/delivery`, { driverId, deliveryNotes }),
  completeShipment: (shipmentId: string, finalCost?: number) => 
    api.post(`/shipments/${shipmentId}/complete`, { finalCost }),
  cancelShipment: (shipmentId: string, reason: string) => 
    api.post(`/shipments/${shipmentId}/cancel`, { reason }),
  // 获取运单统计
  getShipmentStats: (params?: any) => api.get('/shipments/stats', { params }),
  // 获取司机运单列表
  getDriverShipments: (driverId: string, params?: any) => 
    api.get(`/shipments/driver/${driverId}`, { params }),
};

// Pricing related API calls
export const pricingApi = {
  getQuote: (quoteData: any) => api.post('/pricing/quote', quoteData),
  calculateCost: (costData: any) => api.post('/pricing/calculate', costData),
  getPricingRules: (params?: any) => api.get('/pricing/rules', { params }),
};

// Finance related API calls
export const financeApi = {
  getFinancialRecords: (params?: any) => api.get('/finance/records', { params }),
  // 2025-10、02 18:45:00 - 修复结算单生成API参数格式
  generateCustomerStatement: (customerId: string, period: { start: string, end: string }) => 
    api.post('/finance/statements/customer', { customerId, startDate: period.start, endDate: period.end }),
  generateDriverPayrollStatement: (driverId: string, period: { start: string, end: string }) => 
    api.post('/finance/statements/driver', { driverId, startDate: period.start, endDate: period.end }),
  getStatements: (params?: any) => api.get('/finance/statements', { params }),
  getStatementDetails: (statementId: string) => api.get(`/finance/statements/${statementId}`),
  downloadStatement: (statementId: string) => api.get(`/finance/statements/${statementId}/download`),
};

// Trip related API calls - 2025-01-27 16:45:00 新增行程管理API
export const tripsApi = {
  getTrips: (params?: any) => api.get('/trips', { params }),
  getTrip: (id: string) => api.get(`/trips/${id}`),
  createTrip: (data: any) => api.post('/trips', data),
  updateTrip: (id: string, data: any) => api.put(`/trips/${id}`, data),
  deleteTrip: (id: string) => api.delete(`/trips/${id}`),
  mountShipmentsToTrip: (id: string, shipmentIds: string[]) => 
    api.post(`/trips/${id}/shipments`, { shipmentIds }),
  updateTripStatus: (id: string, status: string) => 
    api.patch(`/trips/${id}/status`, { status }),
};

// Customer related API calls
export const customersApi = {
  getCustomers: (params?: any) => api.get('/customers', { params }),
  createCustomer: (customerData: any) => api.post('/customers', customerData),
  updateCustomer: (customerId: string, customerData: any) => api.put(`/customers/${customerId}`, customerData),
  deleteCustomer: (customerId: string) => api.delete(`/customers/${customerId}`),
  getCustomerDetails: (customerId: string) => api.get(`/customers/${customerId}`),
  searchCustomers: (query: string) => api.get('/customers/search', { params: { q: query } }),
};

// Driver related API calls
export const driversApi = {
  getDrivers: (params?: any) => api.get('/drivers', { params }),
  createDriver: (driverData: any) => api.post('/drivers', driverData),
  updateDriver: (driverId: string, driverData: any) => api.put(`/drivers/${driverId}`, driverData),
  deleteDriver: (driverId: string) => api.delete(`/drivers/${driverId}`),
  getDriverDetails: (driverId: string) => api.get(`/drivers/${driverId}`),
};

// Vehicle related API calls
export const vehiclesApi = {
  getVehicles: (params?: any) => api.get('/vehicles', { params }),
  createVehicle: (vehicleData: any) => api.post('/vehicles', vehicleData),
  updateVehicle: (vehicleId: string, vehicleData: any) => api.put(`/vehicles/${vehicleId}`, vehicleData),
  deleteVehicle: (vehicleId: string) => api.delete(`/vehicles/${vehicleId}`),
  getVehicleDetails: (vehicleId: string) => api.get(`/vehicles/${vehicleId}`),
};

// Tenant related API calls
export const tenantsApi = {
  getTenants: (params?: any) => api.get('/tenants', { params }),
  createTenant: (tenantData: any) => api.post('/tenants', tenantData),
  updateTenant: (tenantId: string, tenantData: any) => api.put(`/tenants/${tenantId}`, tenantData),
  deleteTenant: (tenantId: string) => api.delete(`/tenants/${tenantId}`),
  getTenantDetails: (tenantId: string) => api.get(`/tenants/${tenantId}`),
};

// User related API calls
export const usersApi = {
  getUsers: (params?: any) => api.get('/users', { params }),
  createUser: (userData: any) => api.post('/users', userData),
  updateUser: (userId: string, userData: any) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
  getUserDetails: (userId: string) => api.get(`/users/${userId}`),
};

// Dashboard related API calls
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentShipments: (params?: any) => api.get('/dashboard/recent-shipments', { params }),
  getRevenueChart: (params?: any) => api.get('/dashboard/revenue-chart', { params }),
  getShipmentChart: (params?: any) => api.get('/dashboard/shipment-chart', { params }),
};

// File upload related API calls
export const fileApi = {
  uploadFile: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadFile: (fileId: string) => api.get(`/files/${fileId}/download`),
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
};

// Notification related API calls
export const notificationsApi = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (notificationId: string) => api.delete(`/notifications/${notificationId}`),
};

// Audit log related API calls
export const auditApi = {
  getAuditLogs: (params?: any) => api.get('/audit/logs', { params }),
  getAuditLogDetails: (logId: string) => api.get(`/audit/logs/${logId}`),
};

// System settings related API calls
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings: any) => api.put('/settings', settings),
  getSystemInfo: () => api.get('/settings/system-info'),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
  checkDatabase: () => api.get('/health/database'),
  checkServices: () => api.get('/health/services'),
};

export default api;