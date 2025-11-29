#!/usr/bin/env bash
set -euo pipefail

# ---------- CONFIG ----------
ROOT_DIR="$(pwd)"
PKG_ROOT="packages"
CORE_PKG="$PKG_ROOT/logger-core"
V1_PKG="$PKG_ROOT/logger"

# ---------- HELPERS ----------
mkdirp() { mkdir -p "$1"; }
write_if_missing() {
  local file="$1"; local content="$2"
  if [[ -f "$file" ]]; then
    echo "skipping existing $file"
  else
    echo "writing $file"
    printf "%s\n" "$content" > "$file"
  fi
}

# ---------- ROOT / WORKSPACE ----------
echo "Creating monorepo root files..."
mkdirp "$PKG_ROOT"

write_if_missing "pnpm-workspace.yaml" $'packages:\n  - "packages/*"\n'

write_if_missing "package.json" '{
  "name": "your-org-monorepo",
  "private": true,
  "scripts": {
    "bootstrap": "pnpm -w install",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "5.x"
  }
}'

write_if_missing "tsconfig.base.json" '{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "module": "CommonJS",
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "rootDir": "./",
    "outDir": "dist",
    "baseUrl": "."
  }
}'

write_if_missing ".gitignore" $'node_modules\ndist\n.pnpm-store\n.env\n.idea\n.vscode\ncoverage\n'

write_if_missing "turbo.json" '{
  "$schema": "https://turborepo.org/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}'

# ---------- logger-core ----------
echo "Creating shared core package: $CORE_PKG"
mkdirp "$CORE_PKG/src/interfaces"
mkdirp "$CORE_PKG/src/transports"
mkdirp "$CORE_PKG/src/formatters"
mkdirp "$CORE_PKG/src/queue"
mkdirp "$CORE_PKG/src/context"
mkdirp "$CORE_PKG/src/types"
mkdirp "$CORE_PKG/src/utils"
mkdirp "$CORE_PKG/tests"
mkdirp "$CORE_PKG/docs"
mkdirp "$CORE_PKG/examples"
mkdirp "$CORE_PKG/ci"
mkdirp "$CORE_PKG/scripts"
mkdirp "$CORE_PKG/config"
mkdirp "$CORE_PKG/dist"

write_if_missing "$CORE_PKG/package.json" '{
  "name": "@yourorg/logger-core",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "test": "echo \"no tests\"",
    "clean": "rm -rf dist"
  }
}'

write_if_missing "$CORE_PKG/tsconfig.json" '{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "references": []
}'

touch "$CORE_PKG/src/.gitkeep"
touch "$CORE_PKG/src/interfaces/.gitkeep"
touch "$CORE_PKG/src/transports/.gitkeep"
touch "$CORE_PKG/src/formatters/.gitkeep"
touch "$CORE_PKG/src/queue/.gitkeep"
touch "$CORE_PKG/src/context/.gitkeep"
touch "$CORE_PKG/src/types/.gitkeep"
touch "$CORE_PKG/src/utils/.gitkeep"
touch "$CORE_PKG/tests/.gitkeep"
touch "$CORE_PKG/examples/.gitkeep"
touch "$CORE_PKG/docs/.gitkeep"
touch "$CORE_PKG/ci/.gitkeep"
touch "$CORE_PKG/scripts/.gitkeep"
touch "$CORE_PKG/config/default.json"
touch "$CORE_PKG/README.md"

# ---------- logger (v1) ----------
echo "Creating v1 package: $V1_PKG"
mkdirp "$V1_PKG/src/core"
mkdirp "$V1_PKG/src/adapters"
mkdirp "$V1_PKG/src/entrypoints"
mkdirp "$V1_PKG/src/extensions"   # future v2 extensions go here
mkdirp "$V1_PKG/tests"
mkdirp "$V1_PKG/docs"
mkdirp "$V1_PKG/bench"
mkdirp "$V1_PKG/ci"
mkdirp "$V1_PKG/scripts"
mkdirp "$V1_PKG/config"
mkdirp "$V1_PKG/dist"

write_if_missing "$V1_PKG/package.json" '{
  "name": "@yourorg/logger",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@yourorg/logger-core": "*"
  },
  "scripts": {
    "build": "tsc -b",
    "test": "echo \"no tests\"",
    "clean": "rm -rf dist"
  }
}'

write_if_missing "$V1_PKG/tsconfig.json" '{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "references": [
    { "path": "../logger-core" }
  ]
}'

touch "$V1_PKG/src/.gitkeep"
touch "$V1_PKG/src/core/.gitkeep"
touch "$V1_PKG/src/adapters/.gitkeep"
touch "$V1_PKG/src/entrypoints/.gitkeep"
touch "$V1_PKG/src/extensions/.gitkeep"
touch "$V1_PKG/tests/.gitkeep"
touch "$V1_PKG/docs/.gitkeep"
touch "$V1_PKG/bench/.gitkeep"
touch "$V1_PKG/ci/.gitkeep"
touch "$V1_PKG/scripts/.gitkeep"
touch "$V1_PKG/config/default.json"
touch "$V1_PKG/README.md"

# ---------- CI skeleton ----------
mkdirp .github/workflows
write_if_missing ".github/workflows/ci.yml" 'name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: pnpm -w install
      - name: Build
        run: pnpm -w build
      - name: Test
        run: pnpm -w test
'

# ---------- helper script ----------
mkdirp scripts
write_if_missing "scripts/bootstrap.sh" $'#!/usr/bin/env bash\nset -euo pipefail\nif ! command -v pnpm >/dev/null 2>&1; then\n  echo \"pnpm not found — installing globally via npm...\"\n  npm install -g pnpm\nfi\npnpm -w install\n'
chmod +x scripts/bootstrap.sh

echo
echo "✅ Monorepo scaffold ready."
echo "Run: ./scripts/bootstrap.sh"
echo "Then: pnpm -w build"
