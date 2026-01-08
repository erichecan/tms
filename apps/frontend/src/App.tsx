
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { WaybillCreate } from './WaybillCreate';
import { FleetManagement } from './FleetManagement';
import { TrackingPage } from './TrackingPage';
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
        path: 'waybills/create',
        element: <WaybillCreate />,
      },
      {
        path: 'waybills',
        element: <div>Waybills List (Coming Soon)</div>,
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
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
