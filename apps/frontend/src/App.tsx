import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PageLayout from './components/Layout/PageLayout'; // 2025-01-27 17:30:00 使用新的PageLayout组件
import Login from './pages/Auth/Login';
import Home from './pages/Home/Home';
import TestPage from './pages/Test/TestPage';
import Dashboard from './pages/Dashboard/Dashboard';
import RuleManagement from './pages/RuleManagement/RuleManagement';
import ShipmentManagement from './pages/ShipmentManagement/ShipmentManagement';
import ShipmentCreate from './pages/ShipmentCreate/ShipmentCreate';
import FinanceManagement from './pages/FinanceManagement/FinanceManagement';
import FinanceManagementSimplified from './pages/FinanceManagement/FinanceManagementSimplified'; // 2025-10-10 18:25:00 简化版财务页面
import DriverSalarySimplified from './pages/DriverSalary/DriverSalarySimplified'; // 2025-10-10 18:25:00 简化版司机薪酬页面
import CustomerManagement from './pages/CustomerManagement/CustomerManagement';
import CurrencyManagement from './pages/CurrencyManagement/CurrencyManagement';
// 新增页面导入 - 符合PRD v3.0-PC设计
import FleetManagement from './pages/FleetManagement/FleetManagement';
// 计费规则引擎页面导入
import PricingTemplates from './pages/PricingEngine/PricingTemplates';
import PricingCalculator from './pages/PricingEngine/PricingCalculator';
import PricingWizard from './pages/PricingEngine/PricingWizard';
import PricingHome from './pages/PricingEngine/PricingHome';
import BatchImportPage from './pages/BatchImport/BatchImportPage';
// import FinancialReportsPage from './pages/FinancialReports/FinancialReportsPage'; // 2025-10-03 注释掉缺失的导入
// 2025-10-02 18:35:00 - 以下页面已整合，移除独立导入:
// import VehicleMaintenancePage from './pages/VehicleMaintenance/VehicleMaintenancePage'; → 已整合到车队管理页面
// import DriverPerformancePage from './pages/DriverPerformance/DriverPerformancePage'; → 已整合到车队管理页面
// import RealTimeTrackingPage from './pages/RealTimeTracking/RealTimeTrackingPage'; → 已整合到车队管理页面
// 2025-10-02 19:00:00 - 路径优化页面暂时移除，后续添加
// import RouteOptimizationPage from './pages/RouteOptimization/RouteOptimizationPage';
import RuleVersionManagementPage from './pages/RuleVersionManagement/RuleVersionManagementPage';
// 2025-10-02 18:35:00 - 以下页面已整合，移除独立导入:
// import PerformanceMonitoringPage from './pages/PerformanceMonitoring/PerformanceMonitoringPage'; → 已整合到仪表板页面
import GranularPermissionsPage from './pages/GranularPermissions/GranularPermissionsPage';
// ============================================================================
// 地图相关页面导入 - 二期开发功能 (2025-01-27 17:45:00)
// 状态: 已注释，二期恢复
// 说明: 以下导入的地图页面在一期版本中暂时不使用，二期时取消注释
// ============================================================================
// import MapsDemo from './pages/MapsDemo/MapsDemo';
// import MapsTest from './pages/MapsTest/MapsTest';
// import MapsDebug from './pages/MapsDebug/MapsDebug';
import LayoutTest from './pages/LayoutTest/LayoutTest';
import CustomerPortal from './pages/SelfService/CustomerPortal'; // 2025-11-11 10:15:05 引入客户自助入口
import { PermissionProvider } from './contexts/PermissionContext'; // 2025-11-11 10:15:05 引入权限提供器
import { DataProvider } from './contexts/DataContext'; // 2025-11-11T16:00:00Z Added by Assistant: Global data management
import './App.css';

function App() {
  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <TenantProvider>
          <DataProvider>
            <PermissionProvider>
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/" element={<Home />} />
            <Route path="/customer/portal" element={<CustomerPortal />} /> {/* 2025-11-11 10:15:05 新增自助入口路由 */}
            <Route path="/create-shipment" element={<ProtectedRoute><PageLayout><ShipmentCreate /></PageLayout></ProtectedRoute>} />
            
            <Route path="/customers" element={<ProtectedRoute><PageLayout><CustomerManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/finance-settlement" element={<ProtectedRoute><PageLayout><FinanceManagementSimplified /></PageLayout></ProtectedRoute>} />
            
            <Route path="/admin" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/rules" element={<ProtectedRoute><PageLayout><RuleManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/shipments" element={<ProtectedRoute><PageLayout><ShipmentManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/shipments/create" element={<ProtectedRoute><PageLayout><ShipmentCreate /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute><PageLayout><FinanceManagementSimplified /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/driver-salary" element={<ProtectedRoute><PageLayout><DriverSalarySimplified /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><PageLayout><CustomerManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/fleet" element={<ProtectedRoute><PageLayout><FleetManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/currencies" element={<ProtectedRoute><PageLayout><CurrencyManagement /></PageLayout></ProtectedRoute>} />
            
            <Route path="/admin/pricing" element={<ProtectedRoute><PageLayout><PricingHome /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/pricing/templates" element={<ProtectedRoute><PageLayout><PricingTemplates /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/pricing/calculator" element={<ProtectedRoute><PageLayout><PricingCalculator /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/pricing/wizard" element={<ProtectedRoute><PageLayout><PricingWizard /></PageLayout></ProtectedRoute>} />
            
            <Route path="/admin/batch-import" element={<ProtectedRoute><PageLayout><BatchImportPage /></PageLayout></ProtectedRoute>} />
            
            
            
            <Route path="/admin/rule-version-management" element={<ProtectedRoute><PageLayout><RuleVersionManagementPage /></PageLayout></ProtectedRoute>} />
            
            
            <Route path="/admin/granular-permissions" element={<ProtectedRoute><PageLayout><GranularPermissionsPage /></PageLayout></ProtectedRoute>} />
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            <Route path="/layout-test" element={<ProtectedRoute><LayoutTest /></ProtectedRoute>} />
            </Routes>
            </PermissionProvider>
          </DataProvider>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;