# 0006 — Release tooling: release-it (single command, prerelease-aware)

The Starter Template releases with **release-it**. changesets and bumpp were considered and rejected.

- **changesets** is built for monorepos with many publishable packages: a per-PR changeset file, an accumulating "Version" PR, per-package changelogs. For this template — which publishes exactly one Consumer Library package — that ceremony is over-engineering. Downstream teams that grow into a true multi-package monorepo can adopt changesets later.
- **bumpp** only bumps version + commits + tags + pushes. It leaves changelog generation, npm publish, and GitHub release to be assembled separately — three more moving parts the template would have to wire and document.
- **release-it** does all of it in one configurable command: semver bump (interactive or CI-driven), conventional-commits changelog, git tag/push, npm publish, GitHub release — with first-class prerelease channels (`--preRelease=beta` → `1.0.0-beta.0`).

## Flow

Releasing is driven from CI, not the local machine. A maintainer dispatches `release.yml` (GitHub Actions `workflow_dispatch`, with the bump type and optional prerelease id as input). The job runs atomically: install → build → **release dry-run gate** (`npm pack` + tarball assertions + verdaccio publish + playground install/build) → release-it in `--ci` mode bumps the version and writes the changelog into the working tree → the `before:git:release` hook runs `npm publish` via **OIDC trusted publishing** (GA 2025-07-31; npm CLI ≥ 11.5.1; `permissions: id-token: write`; GitHub-hosted runner; no `NPM_TOKEN`) → **only on publish success** does release-it commit, tag, push, and create the GitHub Release. If the publish hook fails, release-it aborts before any commit/tag — no version is burned. The same dry-run script runs locally as `pnpm release:dry-run`, so local and CI validate identical artifacts.

## Consequences

- Prereleases publish to npm under the `beta`/`rc` dist-tag automatically; End Users opt in with `npm install pkg@beta`.
- **Version discontinuity is prevented at the source.** Version bump and publish run atomically in one CI job, gated so the commit/tag/push only happens _after_ `npm publish` succeeds. A failed publish leaves nothing in git; the maintainer re-dispatches. No burned versions.
- **A release dry-run gates every release**, both locally (`pnpm release:dry-run`) and inside `release.yml` before the bump. The same script asserts the publishable artifact (`npm pack` + tarball contents) and the consumer install path (verdaccio publish → playground install → build), so local and CI validate identical artifacts — eliminating the local-builds-but-CI-publish-fails drift that motivated this pattern.
- **Engine drift is locked**: `.nvmrc` + `.node-version` pin Node 24; root `engines.node >=22.14` (the OIDC/npm-CLI floor); `packageManager` pins pnpm 10 via Corepack; `.npmrc` `engine-strict=true`; CI installs with `--frozen-lockfile` and the publish build runs with `package-manager-cache: false`.
- A downstream team that converts the Starter into a multi-package monorepo should re-evaluate changesets; release-it's monorepo support exists but changesets is the stronger tool there.
- **The first release of a new Consumer Library is bootstrapped with a one-time granular publish token.** npm OIDC trusted publishing cannot publish a package that doesn't exist yet (npm/cli#8544); after the first manual publish, the package's npm settings are configured with a Trusted Publisher bound to `release.yml`, and all subsequent releases are tokenless. The Starter Template documents this bootstrap step.
- The publish step runs `npm publish` (not `pnpm publish`), because pnpm's publish implementation has trusted-publishing maturity gaps. Install and dev still use pnpm.
