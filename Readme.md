# install workspace deps and link local packages
pnpm -w install

# build everything (uses TypeScript project refs)
pnpm -w build

# run tests (placeholders until you add real tests)
pnpm -w test



pnpm -w add -D vitest @types/node
pnpm -w add -D nodemon ts-node-dev
pnpm add -D commitizen cz-conventional-changelog
pnpm add -D czg
pnpm add -D @commitlint/config-conventional @commitlint/cli husky
pnpm dlx husky-init && pnpm install
npx husky add .husky/commit-msg 'pnpm commitlint --edit $1'
pnpm dlx commitizen init cz-conventional-changelog --save-dev --save-exact
pnpm -w add -D concurrently
pnpm --filter @majee/logger-core add mongodb

Nice — here's a compact, copy-pasteable **dev checklist + exact commands** so you can iterate on `@majee/logger-core` and `@majee/logger` quickly. Follow in order.

---

# Quick checklist (what to do)

1. Install pnpm (if not installed).
2. Bootstrap workspace (install deps & link local packages).
3. Build everything once to verify setup.
4. Use watch mode on core + logger while coding.
5. Run an example consumer and restart it automatically when builds change.
6. Run unit tests (Vitest recommended).
7. Debug common issues (force reinstall, inspect workspace resolution).

---

# Commands (copy & paste)

## 0. Open a terminal in repo root

(Works in Git Bash / macOS / Linux / PowerShell)

---

## 1. Install pnpm (only if you don’t have it)

```bash
npm install -g pnpm
pnpm -v   # confirm it prints a version
```

---

## 2. Bootstrap workspace (install deps & link local packages)

```bash
pnpm -w install
```

If a local package is still fetched from npm, ensure `pnpm-workspace.yaml` contains `packages: - "packages/*"` and your consumer uses `"workspace:*"` for the local dependency. Then run:

```bash
pnpm -w install --force
```

---

## 3. One-time build (verifies TypeScript project refs + turbo)

```bash
pnpm -w build
```

If turbo complains about `pipeline` → run:

```bash
# replace pipeline with tasks (only needed once)
node -e "const fs=require('fs');let p=JSON.parse(fs.readFileSync('turbo.json')); if(p.pipeline){ p.tasks=p.pipeline; delete p.pipeline; fs.writeFileSync('turbo.json',JSON.stringify(p,null,2)); console.log('patched turbo.json'); } else console.log('no change');"
pnpm -w build
```

---

## 4. Watch mode for iterative development (open 2 terminals)

Terminal A — watch core package:

```bash
pnpm --filter @majee/logger-core run watch
# (ensure packages/logger-core/package.json has "watch": "tsc -b -w")
```

Terminal B — watch logger package:

```bash
pnpm --filter @majee/logger run watch
# (ensure packages/logger/package.json has "watch": "tsc -b -w")
```

When you edit source files, dist will update automatically.

---

## 5. Run example and auto-restart on rebuild

Option A — manual restart:

```bash
# after initial build
node packages/logger/dist/examples/basic.js
# restart when needed
```

Option B — automatic restart with nodemon (preferred):

```bash
pnpm -w add -D nodemon
npx nodemon --watch packages/logger/dist --exec "node packages/logger/dist/examples/basic.js"
```

Option C — run TS directly with ts-node-dev:

```bash
pnpm -w add -D ts-node-dev
pnpm --filter @majee/logger run dev:ts   # requires script like: ts-node-dev --respawn --transpile-only examples/basic.ts
```

---

## 6. Add & run unit tests (Vitest example)

Install dev deps at root:

```bash
pnpm -w add -D vitest @types/node
```

Add `test` script in each package `package.json`:

```json
"scripts": {
  "test": "vitest"
}
```

Run tests:

```bash
pnpm --filter @majee/logger test   # single package
pnpm -w test                       # all workspace packages
```

---

## 7. Useful workspace debug commands

```bash
pnpm -w ls                  # list workspace packages
pnpm -w -s why @majee/logger-core   # shows why/how dependency is resolved
pnpm -w install --force     # relink & reinstall if things look off
```

---

## 8. If you need to add missing scripts into package.json quickly (one-liners)

Add watch script to core:

```bash
node -e "const f='packages/logger-core/package.json',p=require(f?fs.readFileSync(f):f);p=JSON.parse(fs.readFileSync(f));p.scripts=p.scripts||{};p.scripts.watch='tsc -b -w';require('fs').writeFileSync(f,JSON.stringify(p,null,2));console.log('core watch added')"
```

(If that one-liner errors, I can print exact JSON to paste — I kept it short here.)

---

# Typical dev loop (recommended)

1. `pnpm -w install`
2. `pnpm --filter @majee/logger-core run watch` (Terminal A)
3. `pnpm --filter @majee/logger run watch` (Terminal B)
4. `pnpm --filter @majee/logger-dev-app` run dev
` (Terminal C)
5. Edit TS source in `packages/logger-core/src` or `packages/logger/src` — watcher rebuilds, nodemon restarts example.
or 
pnpm dev
# start coding immediately

---

# Final tips

* Use `workspace:*` for local deps in `packages/logger/package.json` so pnpm links locally.
* Keep `logger-core` small and stable (interfaces + tiny utils).
* Write an integration test that runs `Logger` with a test transport (captures logs in-memory) — this prevents regressions when you later add V2.
* If builds are slow, use `pnpm -w build --filter ...` to build a single package.

---

