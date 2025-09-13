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

// 清理函数
afterAll(async () => {
  // 清理测试数据
  // 这里可以添加清理逻辑
});
