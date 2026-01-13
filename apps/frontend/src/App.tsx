
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { WaybillCreate } from './WaybillCreate';
import { WaybillsList } from './WaybillsList';
import { FleetManagement } from './FleetManagement';
import { TrackingPage } from './TrackingPage';
import { Messages } from './Messages';
import { Settings } from './Settings';
import { FinanceDashboard } from './FinanceDashboard';
import { FinanceReceivables } from './FinanceReceivables';
import { FinancePayables } from './FinancePayables';
import { CustomerManagement } from './CustomerManagement';
import RuleManagement from './RuleManagement';
import { UserManagement } from './UserManagement';
import { PricingCalculator } from './PricingCalculator';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'customers',
        element: <CustomerManagement />,
      },
      {
        path: 'waybills',
        element: <WaybillsList />,
      },
      {
        path: 'waybills/create',
        element: <WaybillCreate />,
      },
      {
        path: 'waybills/edit/:id',
        element: <WaybillCreate />,
      },
      {
        path: 'fleet',
        element: <FleetManagement />,
      },
      {
        path: 'tracking',
        element: <TrackingPage />,
      },
      {
        path: 'tracking/:id',
        element: <TrackingPage />,
      },
      {
        path: 'messages',
        element: <Messages />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'finance',
        children: [
          { index: true, element: <FinanceDashboard /> },
          { path: 'receivables', element: <FinanceReceivables /> },
          { path: 'payables', element: <FinancePayables /> }
        ]
      },
      {
        path: 'rules',
        element: <RuleManagement />,
      },
      {
        path: 'pricing',
        element: <PricingCalculator />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
    ],
  },
]);

import { DialogProvider } from './context/DialogContext';

function App() {
  return (
    <DialogProvider>
      <RouterProvider router={router} />
    </DialogProvider>
  );
}

export default App;
