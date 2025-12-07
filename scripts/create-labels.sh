#!/bin/bash

# 创建 GitHub Labels
REPO="erichecan/tms"

echo "创建 GitHub Labels..."

# 优先级标签
gh label create "p0" --description "Critical priority" --color "d73a4a" --repo "$REPO" || true
gh label create "p1" --description "High priority" --color "e99695" --repo "$REPO" || true
gh label create "p2" --description "Medium priority" --color "fbca04" --repo "$REPO" || true
gh label create "p3" --description "Low priority" --color "0e8a16" --repo "$REPO" || true

# 类型标签
gh label create "bug" --description "Something isn't working" --color "d73a4a" --repo "$REPO" || true
gh label create "enhancement" --description "New feature or request" --color "a2eeef" --repo "$REPO" || true
gh label create "documentation" --description "Documentation improvements" --color "0075ca" --repo "$REPO" || true
gh label create "refactor" --description "Code refactoring" --color "7057ff" --repo "$REPO" || true
gh label create "feature" --description "New feature" --color "0e8a16" --repo "$REPO" || true
gh label create "testing" --description "Testing related" --color "d876e3" --repo "$REPO" || true
gh label create "performance" --description "Performance improvements" --color "c5def5" --repo "$REPO" || true

# 状态标签
gh label create "critical" --description "Critical issue" --color "d73a4a" --repo "$REPO" || true
gh label create "security" --description "Security related" --color "b60205" --repo "$REPO" || true

# 模块标签
gh label create "frontend" --description "Frontend related" --color "1d76db" --repo "$REPO" || true
gh label create "backend" --description "Backend related" --color "0e8a16" --repo "$REPO" || true
gh label create "database" --description "Database related" --color "0052cc" --repo "$REPO" || true

# 功能模块标签
gh label create "shipment" --description "Shipment module" --color "c2e0c6" --repo "$REPO" || true
gh label create "customer" --description "Customer module" --color "c2e0c6" --repo "$REPO" || true
gh label create "driver" --description "Driver module" --color "c2e0c6" --repo "$REPO" || true
gh label create "vehicle" --description "Vehicle module" --color "c2e0c6" --repo "$REPO" || true
gh label create "finance" --description "Finance module" --color "c2e0c6" --repo "$REPO" || true
gh label create "pricing" --description "Pricing module" --color "c2e0c6" --repo "$REPO" || true
gh label create "google-maps" --description "Google Maps integration" --color "fbca04" --repo "$REPO" || true

echo "✅ Labels 创建完成！"

