# 🤝 Contributing

We welcome contributions\! Here is the workflow for external contributors:

1.  **Fork** the repository and clone it locally.
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feat/my-cool-feature
    ```
4.  **Make your changes**.
5.  **Add a Changeset** (Required if you edit source code):
    ```bash
    npx changeset
    ```
    *Follow the prompts to select the package and version bump (patch/minor).*
6.  **Push** to your fork and submit a **Pull Request**.

### Requirements

  * All tests must pass (`pnpm test`).
  * Linting must pass (`pnpm build`).
  * Include a changeset so our release bot can publish your code\!

-----


# Maintainer Guide

This document outlines the responsibilities and procedures maintainers must
follow to ensure safe and consistent releases using our OIDC-based pipeline.

---

## 🧩 Release Architecture

Releases are performed by GitHub Actions through an OIDC trust established
between:

- **npm Organization:** `@majee`
- **GitHub Repository:** `majee/logger`
- **Workflow:** `.github/workflows/release.yml`

No long-lived tokens are stored or used.  
The CI runner obtains a short-lived, verifiable identity token which npm accepts
as authentication.

---

## 🚀 How Publishing Works

1. A contributor submits a PR.
2. The maintainer reviews and merges the PR **into `main`**.
3. If a Changeset is present, the CI will:
   - Version affected packages
   - Create a version PR, or
   - Publish directly (depending on Changesets state)
4. On publish, the workflow:
   - Requests an OIDC identity token from GitHub
   - Presents it to npm
   - Publishes packages under `@majee/*`
   - Creates Git tags and GitHub Releases

---

## ✔️ Maintainer Responsibilities

- Enforce PR quality standards.
- Require a Changeset for any user-visible change.
- Confirm CI checks before merging.
- Never push directly to `main` without review.
- Never attempt local manual publishing (CI owns releases).

---

## 🔧 Managing npm Trusted Publisher Settings

Only organization owners can modify trusted publisher configuration.

Location:  
**npm → Organization Settings → Access → Trusted Publishers**

The configuration must include:

- Repository: `majee/logger`
- Workflow: `release.yml`
- Permission: `automation publish`

If this trust is removed, CI publishing will immediately fail.

---

## 🛑 When Releases Will Not Trigger

- The PR comes from a fork.
- The workflow has been renamed without updating npm trust.
- The npm organization trust has been revoked.
- No changesets exist after merging.
- CI permissions (`id-token: write`) are missing.

In these cases, CI will run but will not publish.

---

## 🔐 Security Model

This project follows industry-standard, tokenless publishing practices using:

- **GitHub Actions OIDC**
- **npm Trusted Publishers**
- **Short-lived identity tokens**
- **Branch protection + maintainers-only merging**

### Key Guarantees

- No static npm tokens exist anywhere in the repository.
- External contributors cannot publish, even if they open PRs.
- Publishing only occurs when:
  - Code is merged into `main`
  - The trusted GitHub workflow runs
  - The workflow receives an OIDC identity token
  - npm verifies the identity against the trusted publisher configuration

### Why This Is Secure

- Tokens cannot leak because none are stored.
- A compromised contributor account cannot publish.
- npm verifies the workflow identity cryptographically.
- Only maintainers control merges → maintainers control releases.

This model matches the release pipelines used by major organizations such as
Vercel, Microsoft, Cloudflare, and Stripe.