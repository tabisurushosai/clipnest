#!/bin/bash
set -e
cd "$(dirname "$0")/.."
echo "[1/5] lint"
npm run lint
echo "[2/5] typecheck"
npm run typecheck
echo "[3/5] test"
npm run test:run || { echo "test 失敗"; exit 1; }
echo "[4/5] build"
rm -rf dist release
npm run build
echo "[5/5] zip"
mkdir -p release
cd dist
zip -r "../release/clipnest-$(node -p "require('../package.json').version").zip" .
cd ..
ls -la release/
