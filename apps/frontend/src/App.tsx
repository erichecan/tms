import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import RuleManagement from './pages/RuleManagement/RuleManagement';
import ShipmentManagement from './pages/ShipmentManagement/ShipmentManagement';
import FinanceManagement from './pages/FinanceManagement/FinanceManagement';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
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
              {/* Add other protected routes here */}
            </Route>
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;