#!/bin/bash
# 清理测试产物脚本
# 创建时间: 2025-12-11T16:20:00Z
# 用途: 删除本地和远程的测试产物

set -e

echo "🧹 开始清理测试产物..."

# 1. 删除本地测试产物目录
echo "📁 删除本地测试产物目录..."
rm -rf test-results
rm -rf apps/frontend/test-results
rm -rf apps/frontend/playwright-report
rm -f apps/frontend/test-results.json
rm -f apps/frontend/playwright-report.zip
rm -rf coverage
rm -rf apps/*/coverage
rm -rf .nyc_output
rm -rf .playwright
rm -rf playwright/.cache
rm -rf playwright/.auth
rm -rf blob-report

echo "✅ 本地测试产物已删除"

# 2. 检查是否有测试产物被 git 跟踪
echo ""
echo "🔍 检查是否有测试产物被 git 跟踪..."
TRACKED_FILES=$(git ls-files | grep -E "(test-results|playwright-report|coverage)" | grep -v "node_modules" || true)

if [ -n "$TRACKED_FILES" ]; then
  echo "⚠️  发现以下测试产物文件被 git 跟踪:"
  echo "$TRACKED_FILES"
  echo ""
  echo "是否要从 git 中删除这些文件? (y/n)"
  read -r response
  if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    echo "$TRACKED_FILES" | xargs git rm --cached
    echo "✅ 已从 git 索引中删除测试产物文件"
  fi
else
  echo "✅ 没有测试产物文件被 git 跟踪"
fi

# 3. 检查 .gitignore 配置
echo ""
echo "📝 检查 .gitignore 配置..."
if grep -q "test-results" .gitignore && grep -q "playwright-report" .gitignore && grep -q "coverage" .gitignore; then
  echo "✅ .gitignore 已正确配置"
else
  echo "⚠️  .gitignore 可能需要更新"
fi

# 4. 显示清理结果
echo ""
echo "🎉 清理完成！"
echo ""
echo "已删除的测试产物:"
echo "  - test-results/"
echo "  - apps/frontend/test-results/"
echo "  - apps/frontend/playwright-report/"
echo "  - apps/frontend/test-results.json"
echo "  - apps/frontend/playwright-report.zip"
echo "  - coverage/"
echo "  - .nyc_output/"
echo "  - .playwright/"
echo "  - playwright/.cache/"
echo "  - playwright/.auth/"
echo "  - blob-report/"


