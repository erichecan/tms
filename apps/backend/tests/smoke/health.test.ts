import request from 'supertest';
import express from 'express'; // 2025-11-11T16:12:30Z Added by Assistant: Provide router factory for mocks

function buildRouterModule() {
  const router = express.Router(); // 2025-11-11T16:12:30Z Added by Assistant: Create inert router stub
  return { __esModule: true, default: router };
} // 2025-11-11T16:12:30Z Added by Assistant: Reusable router mock factory

jest.mock('../../src/routes/authRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub auth routes
jest.mock('../../src/routes/customerRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub customer routes
jest.mock('../../src/routes/driverRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub driver routes
jest.mock('../../src/routes/vehicleRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub vehicle routes
jest.mock('../../src/routes/shipmentRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub shipment routes
jest.mock('../../src/routes/tripRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub trip routes
jest.mock('../../src/routes/financeRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub finance routes
jest.mock('../../src/routes/ruleRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub rule routes
jest.mock('../../src/routes/dbRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub DB routes
jest.mock('../../src/routes/maps', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub maps routes
jest.mock('../../src/routes/locationRoutes', buildRouterModule); // 2025-11-11T16:12:30Z Added by Assistant: Stub location routes

describe('Health Endpoint Smoke Test', () => {
  it('should respond with healthy status payload', async () => {
    const appModule = await import('../../src/app'); // 2025-11-11T16:10:20Z Added by Assistant: Lazy-load app after Jest mocks
    const app = appModule.default; // 2025-11-11T16:10:20Z Added by Assistant: Resolve default export
    const response = await request(app).get('/health'); // 2025-11-11T16:02:05Z Added by Assistant: Hit health check
    expect(response.status).toBe(200); // 2025-11-11T16:02:05Z Added by Assistant: Validate status code
    expect(response.body).toMatchObject({
      ok: true
    }); // 2025-11-11T16:14:20Z Added by Assistant: Align with current /health payload
  });
});

