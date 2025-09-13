# TMS Frontend

This is the frontend application for the TMS (Transportation Management System) SaaS platform.

## Features

- **Dashboard**: Overview of key metrics and recent shipments
- **Rule Management**: Visual rule editor for billing and payroll rules
- **Shipment Management**: Create, view, and manage transportation orders
- **Finance Management**: Financial records and statement generation

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Ant Design**: UI component library
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Vite**: Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The frontend runs on `http://localhost:3000` and proxies API requests to the backend at `http://localhost:8000`.

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components
│   └── RuleEditor/     # Rule editor component
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── TenantContext.tsx # Tenant state
├── pages/              # Page components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard page
│   ├── RuleManagement/ # Rule management page
│   ├── ShipmentManagement/ # Shipment management page
│   └── FinanceManagement/  # Finance management page
├── services/           # API services
│   └── api.ts         # API client configuration
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## API Integration

The frontend communicates with the backend through a centralized API service (`src/services/api.ts`) that includes:

- Authentication endpoints
- Rule management endpoints
- Shipment management endpoints
- Finance management endpoints
- Customer and driver management endpoints

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write meaningful component and function names
4. Add proper error handling
5. Test your changes thoroughly
