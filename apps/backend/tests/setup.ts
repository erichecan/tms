// 测试环境设置
// 创建时间: 2025-01-27 15:30:45

import dotenv from 'dotenv';

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tms_user:tms_password@localhost:5432/tms_platform_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// 全局测试超时
jest.setTimeout(10000);

// 2025-11-11T15:55:30Z Added by Assistant: Mock logger to bypass ESM-only winston dependency in Jest
jest.mock('../src/utils/logger', () => {
  const noop = () => undefined; // 2025-11-11T15:55:30Z Added by Assistant: No-op helper
  const mockLogger = {
    info: noop,
    error: noop,
    warn: noop,
    debug: noop,
    add: noop,
    child: () => mockLogger
  }; // 2025-11-11T15:55:30Z Added by Assistant: Shared mock logger object

  return {
    __esModule: true,
    logger: mockLogger,
    requestLogger: (_req: unknown, _res: unknown, next: () => void) => next(), // 2025-11-11T15:55:30Z Added by Assistant: Mock request logger middleware
    errorLogger: (_err: unknown, _req: unknown, _res: unknown, next: () => void) => next(), // 2025-11-11T15:55:30Z Added by Assistant: Mock error logger middleware
    default: mockLogger
  };
});

// 2025-11-11T16:07:25Z Added by Assistant: Reuse compiled shared types bundle to stabilize ts-jest runtime
jest.mock('@tms/shared-types', () => require('../../../packages/shared-types/dist')); // 2025-11-11T16:07:25Z Added by Assistant: Provide shared types via dist output

// 清理函数
afterAll(async () => {
  // 清理测试数据
  // 这里可以添加清理逻辑
});
