// 生成构建版本信息脚本
// 创建时间: 2025-12-11 10:00:00
// 用途: 在构建时生成版本信息文件，用于验证部署

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取 Git 信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const commitTime = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim();
    
    return {
      commitHash,
      shortHash,
      branch,
      commitTime,
    };
  } catch (error) {
    console.warn('无法获取 Git 信息:', error.message);
    return {
      commitHash: 'unknown',
      shortHash: 'unknown',
      branch: 'unknown',
      commitTime: new Date().toISOString(),
    };
  }
}

// 生成版本信息
function generateVersion() {
  const gitInfo = getGitInfo();
  const buildTime = new Date().toISOString();
  
  const versionInfo = {
    version: process.env.npm_package_version || '1.0.0',
    buildTime,
    commitHash: gitInfo.commitHash,
    shortHash: gitInfo.shortHash,
    branch: gitInfo.branch,
    commitTime: gitInfo.commitTime,
    environment: process.env.NODE_ENV || 'development',
  };
  
  return versionInfo;
}

// 主函数
function main() {
  const versionInfo = generateVersion();
  
  // 输出目录
  const outputDir = path.join(__dirname, '../apps/frontend/public');
  
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 写入 version.json
  const versionPath = path.join(outputDir, 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2), 'utf-8');
  
  console.log('✓ 版本信息已生成:', versionPath);
  console.log('  版本:', versionInfo.version);
  console.log('  构建时间:', versionInfo.buildTime);
  console.log('  Commit:', versionInfo.shortHash);
  console.log('  分支:', versionInfo.branch);
  
  // 同时生成 .env 文件用于 Vite 构建时注入
  const envContent = `# 构建版本信息
# 生成时间: ${versionInfo.buildTime}
VITE_BUILD_VERSION=${versionInfo.version}
VITE_BUILD_TIME=${versionInfo.buildTime}
VITE_BUILD_COMMIT_HASH=${versionInfo.commitHash}
VITE_BUILD_SHORT_HASH=${versionInfo.shortHash}
VITE_BUILD_BRANCH=${versionInfo.branch}
`;
  
  const envPath = path.join(__dirname, '../apps/frontend/.env.build');
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log('✓ 构建环境变量已生成:', envPath);
  
  return versionInfo;
}

if (require.main === module) {
  main();
}

module.exports = { generateVersion, getGitInfo };
