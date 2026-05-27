#!/usr/bin/env bash
set -e
echo "=== 构建 ==="
npm run build

echo "=== 提交 ==="
git add .
git commit -m "deploy: $(date '+%m-%d %H:%M')"

echo "=== 推送 ==="
git push origin qianxin:source

echo "=== 完成，去 https://github.com/czkm/Three-match-gift/actions 查看 ==="
