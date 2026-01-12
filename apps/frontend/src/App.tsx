
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
        path: 'waybills',
        element: <WaybillsList />,
      },
      {
        path: 'waybills/create',
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
        path: 'pricing',
        element: <PricingCalculator />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
