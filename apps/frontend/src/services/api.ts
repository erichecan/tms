import axios from 'axios';
import { UserLoginPayload, AuthResponse } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and Tenant ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 临时解决方案：如果没有token，使用demo token
      config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInRvbGVuYW50SWQiOiJkZW1vLXRlbmFudCIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTczNzQ4MDAwMH0.mock-token-for-demo`;
    }
    // Assuming tenant ID might be stored or derived
    const tenantId = localStorage.getItem('current_tenant_id') || 'demo-tenant';
    config.headers['X-Tenant-ID'] = tenantId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (e.g., redirect to login on 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error('Unauthorized, redirecting to login...');
      // window.location.href = '/login'; // Or use react-router-dom's navigate
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
  generateCustomerStatement: (customerId: string, period: { start: string, end: string }) => 
    api.post('/finance/statements/customer', { customerId, period }),
  generateDriverPayrollStatement: (driverId: string, period: { start: string, end: string }) => 
    api.post('/finance/statements/driver', { driverId, period }),
  getStatements: (params?: any) => api.get('/finance/statements', { params }),
  getStatementDetails: (statementId: string) => api.get(`/finance/statements/${statementId}`),
  downloadStatement: (statementId: string) => api.get(`/finance/statements/${statementId}/download`),
};

// Customer related API calls
export const customersApi = {
  getCustomers: (params?: any) => api.get('/customers', { params }),
  createCustomer: (customerData: any) => api.post('/customers', customerData),
  updateCustomer: (customerId: string, customerData: any) => api.put(`/customers/${customerId}`, customerData),
  deleteCustomer: (customerId: string) => api.delete(`/customers/${customerId}`),
  getCustomerDetails: (customerId: string) => api.get(`/customers/${customerId}`),
};

// Driver related API calls
export const driversApi = {
  getDrivers: (params?: any) => api.get('/drivers', { params }),
  createDriver: (driverData: any) => api.post('/drivers', driverData),
  updateDriver: (driverId: string, driverData: any) => api.put(`/drivers/${driverId}`, driverData),
  deleteDriver: (driverId: string) => api.delete(`/drivers/${driverId}`),
  getDriverDetails: (driverId: string) => api.get(`/drivers/${driverId}`),
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