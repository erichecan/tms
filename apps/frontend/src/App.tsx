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
            <Route path="/create-shipment" element={<ShipmentCreate />} />
            {/* 新增路由 - 符合PRD v3.0-PC设计 */}
            <Route path="/fleet-management" element={<FleetManagement />} />
            <Route path="/trip-management" element={<TripManagement />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/finance-settlement" element={<FinanceManagement />} />
            {/* 管理后台页面 - 2025-01-27 17:30:00 使用新的PageLayout */}
            <Route path="/admin" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/rules" element={<ProtectedRoute><PageLayout><RuleManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/shipments" element={<ProtectedRoute><PageLayout><ShipmentManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute><PageLayout><FinanceManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><PageLayout><CustomerManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/drivers" element={<ProtectedRoute><PageLayout><DriverManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute><PageLayout><VehicleManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/currencies" element={<ProtectedRoute><PageLayout><CurrencyManagement /></PageLayout></ProtectedRoute>} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;