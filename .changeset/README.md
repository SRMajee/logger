# Changesets setup for pnpm monorepo

Goal: 
A simple, reliable flow to:

- track changes to `@majee/logger-core` and `@majee/logger`,
- automatically bump versions,
- generate changelogs,
- publish both in the right order.

You already have a pnpm monorepo with:

- `packages/logger-core`
- `packages/logger`
- `packages/logger-dev-app` (no publish)

We’ll:

1. Install Changesets.
2. Configure it for this monorepo.
3. Add scripts.
4. Show how to use it.

---

### 2.1 Install Changesets

From the repo root:

```bash
pnpm add -D @changesets/cli
```

(You can also do `pnpm add -Dw @changesets/cli` if you prefer workspace devDependency.)

Initialize:

```bash
pnpm changeset init
```

>This will create a `.changeset` folder with some default files.

---

### 2.2 Configure `.changeset/config.json`

Open `.changeset/config.json` and replace with:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.1/schema.json",
  "changelog": "@changesets/changelog-git",
  "commit": false,
  "fixed": [],
  "linked": [
    ["@majee/logger-core", "@majee/logger"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@majee/logger-dev-app"
  ]
}
```

Key points:

* `linked`: you link `@majee/logger-core` and `@majee/logger`.

  * This means Changesets will keep versions aligned when appropriate if you choose that pattern.
* `access: "public"`: scoped packages are published as public.
* `ignore`: dev app is not versioned or published.

If you prefer to keep core and logger versions independent, you can remove them from `linked`. For now, linking is simpler while the ecosystem is small.

---

### 2.3 Add scripts to root `package.json`

Open the **root** `package.json` (in `C:\Projects\Logger\package.json`) and add:

```json
{
  "scripts": {
    "build": "pnpm -r run build",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "publish-packages": "changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0"
  }
}
```

Now you have:

* `pnpm changeset` – create a new changeset (record of changes).
* `pnpm version-packages` – apply version bumps + changelogs.
* `pnpm publish-packages` – publish to npm.

---

### 2.4 Typical workflow

When you make changes to core/logger:

#### Step 1 – Create a changeset

From repo root:

```bash
pnpm changeset
```

You’ll be prompted to select packages that changed:

* `@majee/logger-core`
* `@majee/logger`

Then for each selected package, choose the bump type:

* `patch` / `minor` / `major`

Changesets will create a file in `.changeset/*.md` describing the bump and short summary.

Example file:

```md
---
"@majee/logger-core": minor
"@majee/logger": minor
---

Add MongoTransport and PrettyFormatter with per-transport level filters.
```

Commit this file along with your code.

---

#### Step 2 – Apply versions

When you’re ready to cut a release (could be after 1 or multiple changesets):

```bash
pnpm version-packages
```

This will:

* Read all pending changesets.
* Bump versions in `packages/logger-core/package.json` and `packages/logger/package.json`.
* Update or create `CHANGELOG.md` files per package.
* Remove the processed `.changeset/*.md` files.

Commit those version + changelog changes.

---

#### Step 3 – Build everything

From repo root:

```bash
pnpm build
```

This runs `build` in every package (core, logger, dev-app) via pnpm recursive script.

---

#### Step 4 – Publish to npm

Finally:

```bash
pnpm publish-packages
```

Changesets will:

* Publish updated packages in correct order.
* Handle `@majee/logger-core` and `@majee/logger` properly.
* Respect `access: "public"` and versions from step 2.

You’ll need to be logged in:

```bash
npm login
npm whoami
```

---

### 2.5 Example: adding a new transport

Say you add a `KafkaTransport` in `@majee/logger-core` and re-export it from `@majee/logger`:

1. Code changes in `logger-core` and `logger`.

2. Run:

   ```bash
   pnpm changeset
   ```

   Choose:

   * `@majee/logger-core` → `minor`
   * `@majee/logger` → `minor`

3. Commit code + changeset.

4. When ready:

   ```bash
   pnpm version-packages
   pnpm build
   pnpm publish-packages
   ```

You now have:

* `@majee/logger-core@0.2.0`
* `@majee/logger@0.2.0`
* Changelogs updated.

---

