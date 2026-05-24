#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull
bun install --ignore-scripts
. "$HOME/.cargo/env" 2>/dev/null || true
bun --cwd=packages/natives run build
bun --cwd=packages/coding-agent run generate-docs-index

echo ""
echo "Updated to $(omp --version)"
echo "Resolved: $(readlink -f "$(command -v omp)")"
