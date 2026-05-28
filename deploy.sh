#!/usr/bin/env bash
set -e

echo "=== 构建 ==="
npm run build

echo "=== 同步源码（qianxin）==="
git add .
git commit -m "chore: source update $(date '+%m-%d %H:%M')" || true
git push origin qianxin

echo "=== 部署到 main ==="
TMP=$(mktemp -d)
cp -r dist/* "$TMP"
cd "$TMP"
git init
git checkout -b main
git add .
git commit -m "deploy: $(date '+%m-%d %H:%M')"
git remote add origin https://github.com/czkm/Three-match-gift.git
git push origin main --force
cd -
rm -rf "$TMP"

echo "=== 完成 ==="
echo "1-2 分钟后访问 https://czkm.github.io/Three-match-gift/"
