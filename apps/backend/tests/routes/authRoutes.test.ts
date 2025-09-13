// 认证路由测试
// 创建时间: 2025-01-27 15:32:45

import request from 'supertest';
import express from 'express';
import { authRoutes } from '../../src/routes/authRoutes';
import { AuthController } from '../../src/controllers/AuthController';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock认证控制器
jest.mock('../../src/controllers/AuthController');

describe('Auth Routes', () => {
  let app: express.Application;
  let mockAuthController: jest.Mocked<AuthController>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);

    mockAuthController = new AuthController(new DatabaseService()) as jest.Mocked<AuthController>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should handle login request', async () => {
      const loginData = {
        email: 'test@test.com',
        password: 'password'
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-id',
            email: 'test@test.com',
            role: 'admin'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      };

      // Mock the controller method
      (AuthController.prototype.login as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });

    it('should handle login validation errors', async () => {
      const invalidLoginData = {
        email: 'test@test.com'
        // password missing
      };

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'password',
              message: 'Password is required'
            }
          ]
        }
      };

      // Mock the controller method to return validation error
      (AuthController.prototype.login as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(400).json(mockErrorResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidLoginData)
        .expect(400);

      expect(response.body).toEqual(mockErrorResponse);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should handle registration request', async () => {
      const registerData = {
        email: 'newuser@test.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
        role: 'user'
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'new-user-id',
            email: 'newuser@test.com',
            role: 'user'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      };

      // Mock the controller method
      (AuthController.prototype.register as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should handle get current user request', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-id',
            email: 'test@test.com',
            role: 'admin',
            profile: {
              firstName: 'Test',
              lastName: 'User'
            }
          }
        }
      };

      // Mock the controller method
      (AuthController.prototype.getCurrentUser as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should handle token refresh request', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      };

      // Mock the controller method
      (AuthController.prototype.refreshToken as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should handle logout request', async () => {
      const mockResponse = {
        success: true,
        message: 'Logged out successfully'
      };

      // Mock the controller method
      (AuthController.prototype.logout as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });
});
