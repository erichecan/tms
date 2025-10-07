import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PageLayout from './components/Layout/PageLayout';
import Login from './pages/Auth/Login';
import Home from './pages/Home/Home';
import TestPage from './pages/Test/TestPage';
import Dashboard from './pages/Dashboard/Dashboard';
import RuleManagement from './pages/RuleManagement/RuleManagement';
import ShipmentManagement from './pages/ShipmentManagement/ShipmentManagement';
import ShipmentCreate from './pages/ShipmentCreate/ShipmentCreate';
import FinanceManagement from './pages/FinanceManagement/FinanceManagement';
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
            <Route path="/admin" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/rules" element={<ProtectedRoute><PageLayout><RuleManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/shipments" element={<ProtectedRoute><PageLayout><ShipmentManagement /></PageLayout></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute><PageLayout><FinanceManagement /></PageLayout></ProtectedRoute>} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;