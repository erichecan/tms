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
import CustomerManagement from './pages/CustomerManagement/CustomerManagement';
import DriverManagement from './pages/DriverManagement/DriverManagement';
import VehicleManagement from './pages/VehicleManagement/VehicleManagement';
import CurrencyManagement from './pages/CurrencyManagement/CurrencyManagement';
// 新增页面导入 - 符合PRD v3.0-PC设计
import FleetManagement from './pages/FleetManagement/FleetManagement';
import TripManagement from './pages/TripManagement/TripManagement';
// 计费规则引擎页面导入
import PricingTemplates from './pages/PricingEngine/PricingTemplates';
import PricingCalculator from './pages/PricingEngine/PricingCalculator';
import PricingWizard from './pages/PricingEngine/PricingWizard';
import PricingHome from './pages/PricingEngine/PricingHome';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/" element={<Home />} />
            <Route path="/create-shipment" element={<ProtectedRoute><ShipmentCreate /></ProtectedRoute>} />
            {/* 新增路由 - 符合PRD v3.0-PC设计 - 2025-09-29 13:35:00 移除路由层PageLayout，与创建运单页面保持一致 */}
            <Route path="/fleet-management" element={<ProtectedRoute><FleetManagement /></ProtectedRoute>} />
            <Route path="/trip-management" element={<ProtectedRoute><TripManagement /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomerManagement /></ProtectedRoute>} />
            <Route path="/finance-settlement" element={<ProtectedRoute><FinanceManagement /></ProtectedRoute>} />
            {/* 管理后台页面 - 2025-01-27 17:30:00 使用新的PageLayout */}
            <Route path="/admin" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/rules" element={<ProtectedRoute><PageLayout><RuleManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/shipments" element={<ProtectedRoute><PageLayout><ShipmentManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute><PageLayout><FinanceManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><PageLayout><CustomerManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/drivers" element={<ProtectedRoute><PageLayout><DriverManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute><PageLayout><VehicleManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/currencies" element={<ProtectedRoute><PageLayout><CurrencyManagement /></PageLayout></ProtectedRoute>} />
            {/* 计费规则引擎路由 - 2025-09-29 09:15:00 */}
            <Route path="/admin/pricing" element={<ProtectedRoute><PageLayout><PricingHome /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/pricing/templates" element={<ProtectedRoute><PageLayout><PricingTemplates /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/pricing/calculator" element={<ProtectedRoute><PageLayout><PricingCalculator /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/pricing/wizard" element={<ProtectedRoute><PageLayout><PricingWizard /></PageLayout></ProtectedRoute>} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;