// 生成测试JWT token
const jwt = require('jsonwebtoken');

// 使用与后端相同的JWT密钥
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// 从数据库获取的用户和租户信息
const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000001';

// 生成token
const token = jwt.sign(
  { 
    userId: userId,
    tenantId: tenantId,
    role: 'admin'
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('测试JWT Token:');
console.log(token);
console.log('\n使用示例:');
console.log(`curl -X GET http://localhost:8000/api/shipments -H "Authorization: Bearer ${token}"`);