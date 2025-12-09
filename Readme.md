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

-----

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

-----

## ✅ 1. Install pnpm (one-time)

If you don’t already have `pnpm`:

```bash
npm install -g pnpm
pnpm -v
```

-----

## ✅ 2. Install workspace dependencies & link local packages

From the **repo root**:

```bash
pnpm -w install
```

If anything looks incorrectly resolved from npm instead of workspace:

```bash
pnpm -w install --force
```

-----

## ✅ 3. One-time full build (verifies TS project references)

```bash
pnpm -w build
```

-----

## ✅ 4. Docker Setup (MongoDB)

This project uses **MongoDB** for specific log transports. To run the database locally for development:

1.  Ensure you have **Docker Desktop** installed.
2.  Start the container:

<!-- end list -->

```bash
docker compose up -d
```

This spins up a MongoDB instance at `mongodb://admin:password@localhost:27017`.

> **Note:** The CI pipeline automatically spins up a temporary MongoDB service container for testing, so you do not need to configure this in GitHub Actions manually.

-----

## ✅ 5. Watch mode for iterative development

Open **two terminals**:

### Terminal A — Watch logger-core

```bash
pnpm --filter @majee/logger-core run watch
```

### Terminal B — Watch logger

```bash
pnpm --filter @majee/logger run watch
```

Now any change in `src/` will automatically rebuild `dist/`.

-----

## ✅ 6. Run the dev app (auto-restart on changes)

### Option A — Run compiled JS manually

```bash
node packages/logger-dev-app/dist/index.js
```

### Option B — Auto-restart with nodemon (recommended)

Install once: `pnpm -w add -D nodemon`

Run:

```bash
npx nodemon --watch packages --ext js --exec "node packages/logger-dev-app/dist/index.js"
```

-----

## ✅ 7. Testing Setup (Vitest)

Tests run using **Vitest**. The test suite will attempt to connect to the MongoDB instance if available.

### Run tests:

```bash
pnpm --filter @majee/logger test   # single package
pnpm -w test                       # all packages
```

-----

## ✅ 8. Git, Commits & Linting (Conventional Commits)

We use **Conventional Commits** to automate versioning.

### Commit using Commitizen:

```bash
pnpm cz
```

Or manually: `git commit -m "feat: add new transport"`

-----

## ✅ 9. CI/CD & Automated Releases 🚀

We use **GitHub Actions** and **Changesets** to handle testing and publishing. **Do not publish manually.**

### The Workflows

1.  **CI (`ci.yml`):** Runs on every Push and Pull Request.
      * Installs dependencies (pnpm).
      * Builds all packages.
      * Spins up a **MongoDB Service Container**.
      * Runs tests against the container.
2.  **Release (`release.yml`):** Runs on pushes to `main`.
      * Creates a "Version Packages" PR if new changesets exist.
      * Publishes to NPM automatically when that PR is merged.

### How to Release (The "Changeset" Flow)

When you make code changes, follow this flow:

1.  **Make your changes** locally.
2.  **Run Changeset CLI:**
    ```bash
    npx changeset
    ```
      * Select the package(s) you modified.
      * Choose the semantic version bump (patch/minor/major).
      * Write a summary of the change.
3.  **Commit & Push:**
    Include the generated `.changeset/*.md` file in your commit.
    ```bash
    git add .
    git commit -m "feat: added mongo transport"
    git push origin main
    ```
4.  **The Bot Takes Over:**
      * GitHub Actions will detect the changeset and create a **"Version Packages" Pull Request**.
      * **Review & Merge** that PR.
      * The bot will automatically tag the release and publish it to NPM.

-----

## ✅ 10. Typical Daily Dev Loop (Recommended)

```bash
# 1. Start DB
docker compose up -d

# 2. Install deps
pnpm -w install

# 3. Start Watchers (in separate terminals)
pnpm --filter @majee/logger-core run watch
pnpm --filter @majee/logger run watch

# 4. Run Dev App
pnpm --filter @majee/logger-dev-app run dev
```

Now:

  * Edit code in `logger-core` or `logger`
  * TypeScript rebuilds automatically
  * Dev app restarts automatically
  * You see real output immediately

-----

## ✅ Final Best Practices

  * Use `"workspace:*"` for local deps during development.
  * Always add a changeset (`npx changeset`) if your code change affects the library user.
  * Do not edit `package.json` versions manually; let the CI handle it.

