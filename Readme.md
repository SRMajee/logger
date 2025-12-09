# @majee/logger

[![npm version](https://img.shields.io/npm/v/@majee/logger.svg)](https://www.npmjs.com/package/@majee/logger)
[![npm downloads](https://img.shields.io/npm/dm/@majee/logger.svg)](https://www.npmjs.com/package/@majee/logger)
[![License](https://img.shields.io/npm/l/@majee/logger.svg)](LICENSE)
[![CI](https://github.com/SRMajee/logger/actions/workflows/ci.yml/badge.svg)](https://github.com/SRMajee/logger/actions)


A modern, **modular, TypeScript-first logging system for Node.js**, designed for **scalability, extensibility, and production-grade observability**.

`@majee/logger` provides a clean, ergonomic logging API, while its internal companion package, `@majee/logger-core`, powers low-level primitives such as:

- Transports (Console, File, MongoDB, custom)
- Formatters (JSON, Pretty)
- Log level filtering (global & per-transport)
- Async context propagation (request-scoped metadata)

This architecture allows:

- ✅ Simple usage for application developers  
- ✅ Deep extensibility for infrastructure and framework integrations  
- ✅ Safe evolution toward distributed tracing, metrics, and log routing  

> Consumers only import from `@majee/logger`.  
> `@majee/logger-core` is published separately for advanced use cases and shared infrastructure.

---

## ⚡ Quick Usage Example

```ts
import {
  Logger,
  ConsoleTransport,
  FileTransport,
  JsonFormatter,
  PrettyFormatter
} from "@majee/logger";

const logger = new Logger({
  level: "debug",
  formatter: new JsonFormatter(), // default formatter
  transports: [
    {
      transport: new ConsoleTransport(),
      formatter: new PrettyFormatter(), // pretty console output
      minLevel: "info"
    },
    {
      transport: new FileTransport("logs/app.log"),
      minLevel: "debug" // file gets everything
    }
  ]
});

logger.info("App started");
logger.debug("Debug details");
logger.warn("Something looks off");
logger.error("Something failed");
```

# 🛠️ Development Setup & Workflow (Monorepo)

This repository is a **pnpm-based monorepo** containing:

* `@majee/logger-core` – low-level logging primitives
* `@majee/logger` – public logger API
* `@majee/logger-dev-app` – local dev/test app

This guide explains how to set up the workspace, run in watch mode, test, and prepare for releases.

---

## ✅ 1. Install pnpm (one-time)

If you don’t already have `pnpm`:

```bash
npm install -g pnpm
pnpm -v
```

---

## ✅ 2. Install workspace dependencies & link local packages

From the **repo root**:

```bash
pnpm -w install
```

If anything looks incorrectly resolved from npm instead of workspace:

```bash
pnpm -w install --force
```

Make sure `pnpm-workspace.yaml` contains:

```yaml
packages:
  - "packages/*"
```

---

## ✅ 3. One-time full build (verifies TS project references)

```bash
pnpm -w build
```

### If Turbo errors with `pipeline` instead of `tasks` (Turbo v2+):

```bash
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('turbo.json'));if(p.pipeline){p.tasks=p.pipeline;delete p.pipeline;fs.writeFileSync('turbo.json',JSON.stringify(p,null,2));console.log('patched turbo.json')}else{console.log('no change')}"
pnpm -w build
```

---

## ✅ 4. Watch mode for iterative development

Open **two terminals**:

### Terminal A — Watch logger-core

```bash
pnpm --filter @majee/logger-core run watch
```

Ensure `packages/logger-core/package.json` contains:

```json
"scripts": {
  "watch": "tsc -b -w"
}
```

---

### Terminal B — Watch logger

```bash
pnpm --filter @majee/logger run watch
```

Ensure `packages/logger/package.json` contains:

```json
"scripts": {
  "watch": "tsc -b -w"
}
```

Now any change in `src/` will automatically rebuild `dist/`.

---

## ✅ 5. Run the dev app (auto-restart on changes)

### Option A — Run compiled JS manually

```bash
node packages/logger-dev-app/dist/index.js
```

Restart manually after rebuilds.

---

### ✅ Option B — Auto-restart with nodemon (recommended)

Install once:

```bash
pnpm -w add -D nodemon
```

Run:

```bash
npx nodemon --watch packages --ext js --exec "node packages/logger-dev-app/dist/index.js"
```

---

### ✅ Option C — Run TypeScript directly with ts-node-dev

Install once:

```bash
pnpm -w add -D ts-node-dev
```

Add this to `packages/logger-dev-app/package.json`:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
}
```

Run:

```bash
pnpm --filter @majee/logger-dev-app run dev
```

---

## ✅ 6. Testing Setup (Vitest)

### Install at workspace root:

```bash
pnpm -w add -D vitest @types/node
```

### Add this to each package `package.json`:

```json
"scripts": {
  "test": "vitest"
}
```

### Run tests:

```bash
pnpm --filter @majee/logger test   # single package
pnpm -w test                       # all packages
```

---

## ✅ 7. Git, Commits & Linting (Conventional Commits)

### Install tooling:

```bash
pnpm add -D commitizen cz-conventional-changelog
pnpm add -D czg
pnpm add -D @commitlint/config-conventional @commitlint/cli husky
```

### Initialize Husky:

```bash
pnpm dlx husky-init && pnpm install
```

### Add commit-msg hook:

```bash
npx husky add .husky/commit-msg "pnpm commitlint --edit $1"
```

### Initialize Commitizen:

```bash
pnpm dlx commitizen init cz-conventional-changelog --save-dev --save-exact
```

### Now commit using:

```bash
pnpm cz
```

---

## ✅ 8. MongoDB support for logger-core

```bash
pnpm --filter @majee/logger-core add mongodb
```

---

## ✅ 9. Changesets (Versioning & Releases)

### Install:

```bash
pnpm add -Dw @changesets/cli
```

### Initialize:

```bash
pnpm changeset init
```

### Root `package.json` scripts:

```json
"scripts": {
  "build": "pnpm -r run build",
  "changeset": "changeset",
  "version-packages": "changeset version",
  "publish-packages": "changeset publish"
}
```

### Normal release flow:

```bash
pnpm changeset
pnpm version-packages
pnpm build
pnpm publish-packages
```

---

## ✅ 10. Workspace Debugging Commands

```bash
pnpm -w ls                          # list all workspace packages
pnpm -w why @majee/logger-core      # why a package is installed
pnpm -w install --force             # full relink if resolution breaks
```

---

## ✅ 11. Typical Daily Dev Loop (Recommended)

```bash
pnpm -w install

# Terminal A
pnpm --filter @majee/logger-core run watch

# Terminal B
pnpm --filter @majee/logger run watch

# Terminal C
pnpm --filter @majee/logger-dev-app run dev
```

Now:

* Edit code in `logger-core` or `logger`
* TypeScript rebuilds automatically
* Dev app restarts automatically
* You see real output immediately

---

## ✅ Final Best Practices

* Use `"workspace:*"` for local deps during development.
* Publish `@majee/logger-core` **before** `@majee/logger`.
* Keep core minimal and stable.
* Add at least one **in-memory test transport** for integration testing.
* Use Changesets for every meaningful change.

