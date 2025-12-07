#!/bin/bash

# 批量将 Issues 添加到 GitHub Project
# 使用方法: ./scripts/add-issues-to-project.sh

REPO="erichecan/tms"
PROJECT_NUMBER=2

echo "🚀 开始将 Issues 添加到 GitHub Project..."
echo ""

# 检查是否需要刷新权限
echo "检查 GitHub CLI 权限..."
if ! gh api user > /dev/null 2>&1; then
    echo "⚠️  需要登录 GitHub CLI"
    gh auth login
fi

# 获取所有 open 的 issues
echo "获取所有 Issues..."
ISSUES=$(gh issue list --repo "$REPO" --state open --json number,title --jq '.[] | .number')

TOTAL=$(echo "$ISSUES" | wc -l | xargs)
CURRENT=0
SUCCESS=0
FAILED=0

echo "找到 $TOTAL 个 Issues"
echo ""

for ISSUE_NUM in $ISSUES; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL] 添加 Issue #$ISSUE_NUM 到 Project..."
    
    # 尝试添加到 Project
    if gh project item-add "$PROJECT_NUMBER" \
        --owner erichecan \
        --url "https://github.com/$REPO/issues/$ISSUE_NUM" > /dev/null 2>&1; then
        SUCCESS=$((SUCCESS + 1))
        echo "  ✅ 成功"
    else
        FAILED=$((FAILED + 1))
        echo "  ⚠️  可能已经存在或需要手动添加"
    fi
    
    # 避免速率限制
    sleep 0.5
done

echo ""
echo "=========================================="
echo "✅ 完成！"
echo "=========================================="
echo "📊 统计:"
echo "   总数: $TOTAL"
echo "   ✅ 成功: $SUCCESS"
echo "   ⚠️  需要手动: $FAILED"
echo ""
echo "💡 如果有些 Issues 未成功添加，可以："
echo "1. 在 GitHub Project 页面手动添加"
echo "2. 使用搜索过滤: is:issue repo:erichecan/tms"
echo "=========================================="

