import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
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
            <Route path="/create-shipment" element={<ShipmentCreate />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="rules" element={<RuleManagement />} />
              <Route path="shipments" element={<ShipmentManagement />} />
              <Route path="finance" element={<FinanceManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="drivers" element={<DriverManagement />} />
              <Route path="vehicles" element={<VehicleManagement />} />
              <Route path="currencies" element={<CurrencyManagement />} />
              <Route path="pricing" element={<PricingHome />} />
              <Route path="pricing/templates" element={<PricingTemplates />} />
              <Route path="pricing/calculator" element={<PricingCalculator />} />
              <Route path="pricing/wizard" element={<PricingWizard />} />
              {/* Add other protected routes here */}
            </Route>
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;