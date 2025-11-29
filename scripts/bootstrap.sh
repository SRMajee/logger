#!/usr/bin/env bash
set -euo pipefail
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found — installing globally via npm..."
  npm install -g pnpm
fi
pnpm -w install

