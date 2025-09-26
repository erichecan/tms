// 生成测试JWT token
const jwt = require('jsonwebtoken');

// 使用与后端相同的JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 从数据库获取的用户和租户信息
const tenantId = '2996f5d0-2ffa-4aa8-acb5-6c23fbf38e0e';
const userId = '84e18223-1adb-4d4e-a4cd-6a21e4c06bac';

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