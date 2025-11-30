import axios from 'axios';
import { UserLoginPayload, AuthResponse } from '../types/index';

// 2025-11-29 17:40:00 修复：使用代理，不需要完整 URL，使用相对路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
interface QueuedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
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
// 2025-11-29T19:30:00 修复：改进 401 错误处理，避免立即清除 token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 处理 401 错误
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      const isProfileEndpoint = originalRequest.url?.includes('/auth/profile');

      // 2025-11-29T19:30:00 开发环境下的特殊处理
      if (import.meta.env.DEV) {
        // 对于 /auth/profile 的 401，这是 token 验证失败，需要特殊处理
        if (isProfileEndpoint) {
          console.warn('[DEV MODE] Token validation failed for /auth/profile, will be handled by AuthContext');
          // 不在这里清除 token，让 AuthContext 来处理
          return Promise.reject(error);
        }

        // 对于其他认证相关的 API（如 /auth/login），直接拒绝
        if (isAuthEndpoint && !isProfileEndpoint) {
          console.warn('[DEV MODE] 401 error on auth endpoint:', originalRequest.url);
          return Promise.reject(error);
        }

        // 对于其他 API 的 401，在开发环境下暂时不处理（可能是后端配置问题）
        console.warn('[DEV MODE] 401 error, token may be invalid:', originalRequest.url);
        return Promise.reject(error);
      }

      // 生产环境：尝试刷新 token - 2025-10-10 18:15:00
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return api(originalRequest);
            }
            return Promise.reject(error);
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
        // 2025-11-29T19:30:00 只有在非 profile 端点时才清除 token 并重定向
        // profile 端点由 AuthContext 处理
        if (!isProfileEndpoint) {
          localStorage.removeItem('jwt_token');
          window.location.href = '/login';
        }
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
  register: (userData: unknown) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
};

// Rule related API calls
export const rulesApi = {
  getRules: (params?: unknown) => api.get('/rules', { params }),
  createRule: (ruleData: unknown) => api.post('/rules', ruleData),
  updateRule: (ruleId: string, ruleData: unknown) => api.put(`/rules/${ruleId}`, ruleData),
  deleteRule: (ruleId: string) => api.delete(`/rules/${ruleId}`),
  fuzzyMatchRules: (ruleData: unknown) => api.post('/rules/fuzzy-match', ruleData),
  detectRuleConflicts: (ruleData: unknown) => api.post('/rules/detect-conflicts', ruleData),
};

// Shipment related API calls
export const shipmentsApi = {
  getShipments: (params?: unknown) => api.get('/shipments', { params }),
  createShipment: (shipmentData: unknown) => api.post('/shipments', shipmentData),
  getShipmentDetails: (shipmentId: string) => api.get(`/shipments/${shipmentId}`),
  updateShipment: (shipmentId: string, shipmentData: unknown) => api.put(`/shipments/${shipmentId}`, shipmentData),
  deleteShipment: (shipmentId: string) => api.delete(`/shipments/${shipmentId}`),
  updateShipmentStatus: (shipmentId: string, status: string) => api.post(`/shipments/${shipmentId}/status`, { targetStatus: status }), // 2025-10-27 修复：改用POST方法并使用targetStatus参数
  // 运单状态流转API
  // 2025-10-29 10:25:30 扩展：支持同时指派车辆
  assignDriver: (shipmentId: string, driverId: string, vehicleId?: string, notes?: string) => 
    api.post(`/shipments/${shipmentId}/assign`, { driverId, vehicleId, notes }),
  // 2025-11-11 10:15:05 增加上传POD接口，支持表单数据上传
  uploadShipmentPOD: (shipmentId: string, file: File, payload?: { note?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (payload?.note) {
      formData.append('note', payload.note);
    }
    return api.post(`/shipments/${shipmentId}/pod`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // 2025-11-11 10:15:05 新增获取运单时间线接口
  getShipmentTimeline: (shipmentId: string) => api.get(`/shipments/${shipmentId}/timeline`),
  // 2025-11-11 10:15:05 新增获取运单POD列表接口
  getShipmentPODs: (shipmentId: string) => api.get(`/shipments/${shipmentId}/pods`),
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
  getShipmentStats: (params?: unknown) => api.get('/shipments/stats', { params }),
  // 获取司机运单列表
  getDriverShipments: (driverId: string, params?: unknown) => 
    api.get(`/shipments/driver/${driverId}`, { params }),
};

// Pricing related API calls
export const pricingApi = {
  getQuote: (quoteData: unknown) => api.post('/pricing/quote', quoteData),
  calculateCost: (costData: unknown) => api.post('/pricing/calculate', costData),
  getPricingRules: (params?: unknown) => api.get('/pricing/rules', { params }),
};

// Finance related API calls
export const financeApi = {
  getFinancialRecords: (params?: unknown) => api.get('/finance/records', { params }),
  // 2025-10、02 18:45:00 - 修复结算单生成API参数格式
  generateCustomerStatement: (customerId: string, period: { start: string, end: string }) => 
    api.post('/finance/statements/customer', { customerId, startDate: period.start, endDate: period.end }),
  generateDriverPayrollStatement: (driverId: string, period: { start: string, end: string }) => 
    api.post('/finance/statements/driver', { driverId, startDate: period.start, endDate: period.end }),
  getStatements: (params?: unknown) => api.get('/finance/statements', { params }),
  getStatementDetails: (statementId: string) => api.get(`/finance/statements/${statementId}`),
  downloadStatement: (statementId: string) => api.get(`/finance/statements/${statementId}/download`),
  // 2025-11-29T11:25:04Z 标记对账单为已支付
  markAsPaid: (statementId: string, paidAmount: number, paymentDate?: string) => 
    api.put(`/finance/statements/${statementId}/pay`, { paidAmount, paymentDate }),
};

// Trip related API calls - 2025-01-27 16:45:00 新增行程管理API
export const tripsApi = {
  getTrips: (params?: unknown) => api.get('/trips', { params }),
  getTrip: (id: string) => api.get(`/trips/${id}`),
  createTrip: (data: unknown) => api.post('/trips', data),
  updateTrip: (id: string, data: unknown) => api.put(`/trips/${id}`, data),
  deleteTrip: (id: string) => api.delete(`/trips/${id}`),
  mountShipmentsToTrip: (id: string, shipmentIds: string[]) => 
    api.post(`/trips/${id}/shipments`, { shipmentIds }),
  updateTripStatus: (id: string, status: string) => 
    api.patch(`/trips/${id}/status`, { status }),
};

// Customer related API calls
export const customersApi = {
  getCustomers: (params?: unknown) => api.get('/customers', { params }),
  createCustomer: (customerData: unknown) => api.post('/customers', customerData),
  updateCustomer: (customerId: string, customerData: unknown) => api.put(`/customers/${customerId}`, customerData),
  deleteCustomer: (customerId: string) => api.delete(`/customers/${customerId}`),
  getCustomerDetails: (customerId: string) => api.get(`/customers/${customerId}`),
  searchCustomers: (query: string) => api.get('/customers/search', { params: { q: query } }),
};

// Driver related API calls
export const driversApi = {
  getDrivers: (params?: unknown) => api.get('/drivers', { params }),
  createDriver: (driverData: unknown) => api.post('/drivers', driverData),
  updateDriver: (driverId: string, driverData: unknown) => api.put(`/drivers/${driverId}`, driverData),
  deleteDriver: (driverId: string) => api.delete(`/drivers/${driverId}`),
  getDriverDetails: (driverId: string) => api.get(`/drivers/${driverId}`),
  // 司机证照管理 // 2025-11-29T11:25:04Z
  getDriverCertificates: (driverId: string) => api.get(`/drivers/${driverId}/certificates`),
  createDriverCertificate: (driverId: string, data: unknown) => api.post(`/drivers/${driverId}/certificates`, data),
  updateDriverCertificate: (certificateId: string, data: unknown) => api.put(`/drivers/certificates/${certificateId}`, data),
  deleteDriverCertificate: (certificateId: string) => api.delete(`/drivers/certificates/${certificateId}`),
  getExpiringDriverCertificates: (daysAhead?: number) => api.get('/drivers/certificates/expiring', { params: { daysAhead } }),
  // 司机违章管理 // 2025-11-29T11:25:04Z
  getDriverViolations: (driverId: string) => api.get(`/drivers/${driverId}/violations`),
  createDriverViolation: (driverId: string, data: unknown) => api.post(`/drivers/${driverId}/violations`, data),
  updateDriverViolation: (violationId: string, data: unknown) => api.put(`/drivers/violations/${violationId}`, data),
  deleteDriverViolation: (violationId: string) => api.delete(`/drivers/violations/${violationId}`),
  getDriverTotalPoints: (driverId: string) => api.get(`/drivers/${driverId}/violations/total-points`),
  // 司机排班管理 // 2025-11-29T11:25:04Z
  getDriverSchedules: (driverId: string, params?: unknown) => api.get(`/drivers/${driverId}/schedules`, { params }),
  createDriverSchedule: (driverId: string, data: unknown) => api.post(`/drivers/${driverId}/schedules`, data),
  updateDriverSchedule: (scheduleId: string, data: unknown) => api.put(`/drivers/schedules/${scheduleId}`, data),
  deleteDriverSchedule: (scheduleId: string) => api.delete(`/drivers/schedules/${scheduleId}`),
  checkDriverWorkHours: (driverId: string, date?: string) => api.get(`/drivers/${driverId}/schedules/check-hours`, { params: { date } }),
  // 司机班组管理 // 2025-11-29T11:25:04Z
  getDriverGroups: (params?: unknown) => api.get('/drivers/groups', { params }),
  createDriverGroup: (data: unknown) => api.post('/drivers/groups', data),
  getDriverGroup: (groupId: string) => api.get(`/drivers/groups/${groupId}`),
  updateDriverGroup: (groupId: string, data: unknown) => api.put(`/drivers/groups/${groupId}`, data),
  deleteDriverGroup: (groupId: string) => api.delete(`/drivers/groups/${groupId}`),
  getGroupMembers: (groupId: string, params?: unknown) => api.get(`/drivers/groups/${groupId}/members`, { params }),
  addGroupMember: (groupId: string, data: unknown) => api.post(`/drivers/groups/${groupId}/members`, data),
  removeGroupMember: (groupId: string, driverId: string) => api.delete(`/drivers/groups/${groupId}/members/${driverId}`),
  // 司机体检管理 // 2025-11-29T11:25:04Z
  getDriverMedicalRecords: (driverId: string) => api.get(`/drivers/${driverId}/medical-records`),
  createDriverMedicalRecord: (driverId: string, data: unknown) => api.post(`/drivers/${driverId}/medical-records`, data),
  updateDriverMedicalRecord: (recordId: string, data: unknown) => api.put(`/drivers/medical-records/${recordId}`, data),
  deleteDriverMedicalRecord: (recordId: string) => api.delete(`/drivers/medical-records/${recordId}`),
  getExpiringMedicalRecords: (daysAhead?: number) => api.get('/drivers/medical-records/expiring', { params: { daysAhead } }),
  // 司机培训管理 // 2025-11-29T11:25:04Z
  getDriverTrainingRecords: (driverId: string) => api.get(`/drivers/${driverId}/training-records`),
  createDriverTrainingRecord: (driverId: string, data: unknown) => api.post(`/drivers/${driverId}/training-records`, data),
  updateDriverTrainingRecord: (recordId: string, data: unknown) => api.put(`/drivers/training-records/${recordId}`, data),
  deleteDriverTrainingRecord: (recordId: string) => api.delete(`/drivers/training-records/${recordId}`),
  getExpiringTrainingCertificates: (daysAhead?: number) => api.get('/drivers/training-records/expiring', { params: { daysAhead } }),
  // 排班自定义字段定义 // 2025-11-29T11:25:04Z
  getScheduleCustomFieldDefinitions: (activeOnly?: boolean) => api.get('/schedules/custom-fields', { params: { activeOnly } }),
  getScheduleCustomFieldDefinition: (fieldId: string) => api.get(`/schedules/custom-fields/${fieldId}`),
  createScheduleCustomFieldDefinition: (data: unknown) => api.post('/schedules/custom-fields', data),
  updateScheduleCustomFieldDefinition: (fieldId: string, data: unknown) => api.put(`/schedules/custom-fields/${fieldId}`, data),
  deleteScheduleCustomFieldDefinition: (fieldId: string) => api.delete(`/schedules/custom-fields/${fieldId}`),
};

// Vehicle related API calls
export const vehiclesApi = {
  getVehicles: (params?: unknown) => api.get('/vehicles', { params }),
  createVehicle: (vehicleData: unknown) => api.post('/vehicles', vehicleData),
  updateVehicle: (vehicleId: string, vehicleData: unknown) => api.put(`/vehicles/${vehicleId}`, vehicleData),
  deleteVehicle: (vehicleId: string) => api.delete(`/vehicles/${vehicleId}`),
  getVehicleDetails: (vehicleId: string) => api.get(`/vehicles/${vehicleId}`),
  // 车辆证照管理 // 2025-11-29T11:25:04Z
  getVehicleCertificates: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/certificates`),
  createVehicleCertificate: (vehicleId: string, data: unknown) => api.post(`/vehicles/${vehicleId}/certificates`, data),
  updateVehicleCertificate: (certificateId: string, data: unknown) => api.put(`/vehicles/certificates/${certificateId}`, data),
  deleteVehicleCertificate: (certificateId: string) => api.delete(`/vehicles/certificates/${certificateId}`),
  getExpiringCertificates: (daysAhead?: number) => api.get('/vehicles/certificates/expiring', { params: { daysAhead } }),
  // 车辆保险管理 // 2025-11-29T11:25:04Z
  getVehicleInsurances: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/insurances`),
  createVehicleInsurance: (vehicleId: string, data: unknown) => api.post(`/vehicles/${vehicleId}/insurances`, data),
  updateVehicleInsurance: (insuranceId: string, data: unknown) => api.put(`/vehicles/insurances/${insuranceId}`, data),
  deleteVehicleInsurance: (insuranceId: string) => api.delete(`/vehicles/insurances/${insuranceId}`),
  getExpiringInsurances: (daysAhead?: number) => api.get('/vehicles/insurances/expiring', { params: { daysAhead } }),
  // 车辆年检管理 // 2025-11-29T11:25:04Z
  getVehicleInspections: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/inspections`),
  createVehicleInspection: (vehicleId: string, data: unknown) => api.post(`/vehicles/${vehicleId}/inspections`, data),
  updateVehicleInspection: (inspectionId: string, data: unknown) => api.put(`/vehicles/inspections/${inspectionId}`, data),
  deleteVehicleInspection: (inspectionId: string) => api.delete(`/vehicles/inspections/${inspectionId}`),
  getExpiringInspections: (daysAhead?: number) => api.get('/vehicles/inspections/expiring', { params: { daysAhead } }),
  // 车辆设备管理 // 2025-11-29T11:25:04Z
  getVehicleDevices: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/devices`),
  createVehicleDevice: (vehicleId: string, data: unknown) => api.post(`/vehicles/${vehicleId}/devices`, data),
  updateVehicleDevice: (deviceId: string, data: unknown) => api.put(`/vehicles/devices/${deviceId}`, data),
  deleteVehicleDevice: (deviceId: string) => api.delete(`/vehicles/devices/${deviceId}`),
};

// Maintenance related API calls // 2025-11-29T11:25:04Z 维护记录管理API
export const maintenanceApi = {
  // 维护记录
  getMaintenanceRecords: (params?: {
    vehicleId?: string;
    status?: string;
    maintenanceType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/maintenance/records', { params }),
  getMaintenanceRecord: (id: string) => api.get(`/maintenance/records/${id}`),
  getVehicleMaintenanceRecords: (vehicleId: string) => api.get(`/maintenance/vehicles/${vehicleId}/records`),
  createMaintenanceRecord: (data: unknown) => api.post('/maintenance/records', data),
  updateMaintenanceRecord: (id: string, data: unknown) => api.put(`/maintenance/records/${id}`, data),
  deleteMaintenanceRecord: (id: string) => api.delete(`/maintenance/records/${id}`),
  getUpcomingMaintenance: (daysAhead?: number) => api.get('/maintenance/upcoming', { params: { daysAhead } }),
  // 保养计划
  getMaintenancePlans: (params?: {
    vehicleId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/maintenance/plans', { params }),
  getMaintenancePlan: (id: string) => api.get(`/maintenance/plans/${id}`),
  getVehicleMaintenancePlans: (vehicleId: string, isActive?: boolean) => api.get(`/maintenance/vehicles/${vehicleId}/plans`, { params: { isActive } }),
  createMaintenancePlan: (data: unknown) => api.post('/maintenance/plans', data),
  updateMaintenancePlan: (id: string, data: unknown) => api.put(`/maintenance/plans/${id}`, data),
  deleteMaintenancePlan: (id: string) => api.delete(`/maintenance/plans/${id}`),
  executeMaintenancePlan: (id: string, data: { executionDate: string; executionMileage?: number }) => api.post(`/maintenance/plans/${id}/execute`, data),
  getUpcomingMaintenancePlans: (daysAhead?: number) => api.get('/maintenance/plans/upcoming', { params: { daysAhead } }),
  // 维修工单
  getWorkOrders: (params?: {
    vehicleId?: string;
    status?: string;
    priority?: string;
    workOrderType?: string;
    assignedTo?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/maintenance/work-orders', { params }),
  getWorkOrder: (id: string) => api.get(`/maintenance/work-orders/${id}`),
  getVehicleWorkOrders: (vehicleId: string) => api.get(`/maintenance/vehicles/${vehicleId}/work-orders`),
  createWorkOrder: (data: unknown) => api.post('/maintenance/work-orders', data),
  updateWorkOrder: (id: string, data: unknown) => api.put(`/maintenance/work-orders/${id}`, data),
  deleteWorkOrder: (id: string) => api.delete(`/maintenance/work-orders/${id}`),
  // 备件管理
  getSpareParts: (params?: {
    partCategory?: string;
    isActive?: boolean;
    lowStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/maintenance/spare-parts', { params }),
  getSparePart: (id: string) => api.get(`/maintenance/spare-parts/${id}`),
  createSparePart: (data: unknown) => api.post('/maintenance/spare-parts', data),
  updateSparePart: (id: string, data: unknown) => api.put(`/maintenance/spare-parts/${id}`, data),
  deleteSparePart: (id: string) => api.delete(`/maintenance/spare-parts/${id}`),
  adjustSparePartStock: (id: string, data: { adjustmentType: 'in' | 'out' | 'adjust'; quantity: number; reason?: string; workOrderId?: string }) => api.post(`/maintenance/spare-parts/${id}/adjust-stock`, data),
  getLowStockParts: () => api.get('/maintenance/spare-parts/low-stock'),
};

// Route related API calls // 2025-11-29T11:25:04Z 线路管理API
export const routesApi = {
  getRoutes: (params?: {
    routeType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/routes', { params }),
  getRoute: (id: string) => api.get(`/routes/${id}`),
  createRoute: (data: unknown) => api.post('/routes', data),
  updateRoute: (id: string, data: unknown) => api.put(`/routes/${id}`, data),
  deleteRoute: (id: string) => api.delete(`/routes/${id}`),
  getRouteMetrics: (id: string) => api.get(`/routes/${id}/metrics`),
  getRouteSegments: (routeId: string) => api.get(`/routes/${routeId}/segments`),
  createRouteSegment: (routeId: string, data: unknown) => api.post(`/routes/${routeId}/segments`, data),
  updateRouteSegment: (segmentId: string, data: unknown) => api.put(`/routes/segments/${segmentId}`, data),
  deleteRouteSegment: (segmentId: string) => api.delete(`/routes/segments/${segmentId}`),
};

// Station related API calls // 2025-11-29T11:25:04Z 站点与仓库管理API
export const stationsApi = {
  // 站点管理
  getStations: (params?: {
    stationType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/stations', { params }),
  getStation: (id: string) => api.get(`/stations/${id}`),
  createStation: (data: unknown) => api.post('/stations', data),
  updateStation: (id: string, data: unknown) => api.put(`/stations/${id}`, data),
  deleteStation: (id: string) => api.delete(`/stations/${id}`),
  // 仓库管理
  getWarehouses: (params?: {
    warehouseType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/stations/warehouses', { params }),
  getWarehouse: (id: string) => api.get(`/stations/warehouses/${id}`),
  createWarehouse: (data: unknown) => api.post('/stations/warehouses', data),
  updateWarehouse: (id: string, data: unknown) => api.put(`/stations/warehouses/${id}`, data),
  deleteWarehouse: (id: string) => api.delete(`/stations/warehouses/${id}`),
  // 枢纽管理
  getHubs: (params?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/stations/hubs', { params }),
  getHub: (id: string) => api.get(`/stations/hubs/${id}`),
  createHub: (data: unknown) => api.post('/stations/hubs', data),
  updateHub: (id: string, data: unknown) => api.put(`/stations/hubs/${id}`, data),
  deleteHub: (id: string) => api.delete(`/stations/hubs/${id}`),
};

// Cost related API calls // 2025-11-29T11:25:04Z 成本核算管理API
export const costsApi = {
  // 成本分类
  getCostCategories: (params?: {
    categoryType?: string;
    isActive?: boolean;
    parentCategoryId?: string;
  }) => api.get('/costs/categories', { params }),
  getCostCategory: (id: string) => api.get(`/costs/categories/${id}`),
  createCostCategory: (data: unknown) => api.post('/costs/categories', data),
  updateCostCategory: (id: string, data: unknown) => api.put(`/costs/categories/${id}`, data),
  deleteCostCategory: (id: string) => api.delete(`/costs/categories/${id}`),
  // 车辆成本
  getVehicleCosts: (params?: {
    vehicleId?: string;
    costType?: string;
    costCategoryId?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }) => api.get('/costs/vehicles', { params }),
  getVehicleCost: (id: string) => api.get(`/costs/vehicles/${id}`),
  createVehicleCost: (data: unknown) => api.post('/costs/vehicles', data),
  updateVehicleCost: (id: string, data: unknown) => api.put(`/costs/vehicles/${id}`, data),
  deleteVehicleCost: (id: string) => api.delete(`/costs/vehicles/${id}`),
  // 成本统计
  getCostSummary: (params?: {
    vehicleId?: string;
    startDate?: string;
    endDate?: string;
    costType?: string;
  }) => api.get('/costs/summary', { params }),
  compareVehicleCosts: (data: { vehicleIds: string[]; startDate?: string; endDate?: string }) => api.post('/costs/compare', data),
};

// Carrier related API calls // 2025-11-29T11:25:04Z
export const carriersApi = {
  getCarriers: (params?: unknown) => api.get('/carriers', { params }),
  createCarrier: (data: unknown) => api.post('/carriers', data),
  getCarrier: (carrierId: string) => api.get(`/carriers/${carrierId}`),
  updateCarrier: (carrierId: string, data: unknown) => api.put(`/carriers/${carrierId}`, data),
  deleteCarrier: (carrierId: string) => api.delete(`/carriers/${carrierId}`),
  // 承运商评分管理
  getCarrierRatings: (carrierId: string, params?: unknown) => api.get(`/carriers/${carrierId}/ratings`, { params }),
  createCarrierRating: (carrierId: string, data: unknown) => api.post(`/carriers/${carrierId}/ratings`, data),
  // 承运商报价管理
  getCarrierQuotes: (carrierId: string, params?: unknown) => api.get(`/carriers/${carrierId}/quotes`, { params }),
  createCarrierQuote: (carrierId: string, data: unknown) => api.post(`/carriers/${carrierId}/quotes`, data),
  // 承运商证照管理
  getCarrierCertificates: (carrierId: string) => api.get(`/carriers/${carrierId}/certificates`),
  createCarrierCertificate: (carrierId: string, data: unknown) => api.post(`/carriers/${carrierId}/certificates`, data),
  updateCarrierCertificate: (certificateId: string, data: unknown) => api.put(`/carriers/certificates/${certificateId}`, data),
  deleteCarrierCertificate: (certificateId: string) => api.delete(`/carriers/certificates/${certificateId}`),
  getExpiringCarrierCertificates: (daysAhead?: number) => api.get('/carriers/certificates/expiring', { params: { daysAhead } }),
};

// Tenant related API calls
export const tenantsApi = {
  getTenants: (params?: unknown) => api.get('/tenants', { params }),
  createTenant: (tenantData: unknown) => api.post('/tenants', tenantData),
  updateTenant: (tenantId: string, tenantData: unknown) => api.put(`/tenants/${tenantId}`, tenantData),
  deleteTenant: (tenantId: string) => api.delete(`/tenants/${tenantId}`),
  getTenantDetails: (tenantId: string) => api.get(`/tenants/${tenantId}`),
};

// User related API calls
export const usersApi = {
  getUsers: (params?: unknown) => api.get('/users', { params }),
  createUser: (userData: unknown) => api.post('/users', userData),
  updateUser: (userId: string, userData: unknown) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
  getUserDetails: (userId: string) => api.get(`/users/${userId}`),
};

// Dashboard related API calls
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentShipments: (params?: unknown) => api.get('/dashboard/recent-shipments', { params }),
  getRevenueChart: (params?: unknown) => api.get('/dashboard/revenue-chart', { params }),
  getShipmentChart: (params?: unknown) => api.get('/dashboard/shipment-chart', { params }),
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
  getNotifications: (params?: unknown) => api.get('/notifications', { params }),
  markAsRead: (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (notificationId: string) => api.delete(`/notifications/${notificationId}`),
};

// Audit log related API calls
export const auditApi = {
  getAuditLogs: (params?: unknown) => api.get('/audit/logs', { params }),
  getAuditLogDetails: (logId: string) => api.get(`/audit/logs/${logId}`),
};

// System settings related API calls
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings: unknown) => api.put('/settings', settings),
  getSystemInfo: () => api.get('/settings/system-info'),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
  checkDatabase: () => api.get('/health/database'),
  checkServices: () => api.get('/health/services'),
};

// Location tracking related API calls - 2025-10-17 23:25:00
export const locationApi = {
  // 获取实时位置列表
  getRealTimeLocations: () => api.get('/location/realtime'),
  
  // 更新车辆位置
  updateVehicleLocation: (vehicleId: string, location: {
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    accuracy?: number;
  }) => api.post(`/location/vehicles/${vehicleId}`, location),
  
  // 更新司机位置
  updateDriverLocation: (driverId: string, location: {
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    accuracy?: number;
  }) => api.post(`/location/drivers/${driverId}`, location),
  
  // 获取位置历史轨迹
  getLocationHistory: (entityType: string, entityId: string, params?: {
    startTime?: string;
    endTime?: string;
    limit?: number;
  }) => api.get(`/location/history/${entityType}/${entityId}`, { params }),
  
  // 批量更新位置（用于模拟器）
  bulkUpdateLocations: (updates: Array<{
    entityType: string;
    entityId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    accuracy?: number;
  }>) => api.post('/location/bulk-update', { updates })
};

export default api;