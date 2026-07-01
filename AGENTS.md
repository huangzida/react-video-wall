# AGENTS.md

Operational guidance for agents working here. Read this + `CONTEXT.md` (vocabulary) + `docs/adr/` (decisions) before changing fundamentals.

## What this repo is

A **starter template** for producing publishable React npm libraries — it IS the scaffolding (cloned via `degit`/`git clone`), NOT a library that gets installed. `packages/react-lib` is an _example_ Consumer Library; downstream teams replace its `src/`. See `CONTEXT.md` for the Starter Template / Consumer Library / End User / Playground vocabulary.

## Workspace (pnpm)

- `packages/react-lib` — the **only** publishable package. Its `package.json` holds the full publish contract: `exports`, `peerDependencies` (`react`/`react-dom` `>=17.0.2`), `sideEffects: ["**/*.css"]`, `files: ["dist"]`.
- `apps/playground` — private dev-only app, **never** published. Consumes `react-lib` from the End User perspective (`import 'react-lib/style.css'`). Feature deps (e.g. `lucide-react`) may live here but **must not** be added to `react-lib` (zero-tax library principle).

## Commands

- `corepack enable` then `pnpm install` — first setup (pnpm via Corepack; Node/pnpm versions pinned).
- `pnpm build:lib` — build the publishable lib → `dist/index.js` + `index.css` + `index.d.ts`.
- `pnpm test` — vitest in react-lib only.
- `pnpm lint` / `pnpm fmt` / `pnpm lint:ci` — oxlint / oxfmt --write / oxlint + oxfmt --check. **NOT eslint/prettier** (ADR-0005).
- `pnpm release:dry-run` — verdaccio publish + throwaway consumer install gate. **Run before any build/publish change** — it's the local mirror of CI's release gate and catches the "builds locally, fails to publish" class of bug (ADR-0006).
- `PREVIEW=1 pnpm build:playground` — build playground against the lib's BUILT dist (consumer fidelity); without `PREVIEW` it aliases lib source for HMR.
- No root `dev` script — playground dev is `pnpm --filter playground dev`.
- `node scripts/pin-react.mjs <ver>` — pin react/react-dom for the CI matrix (rewrites `pnpm-workspace.yaml` overrides; CI-only, not committed).

## Build-contract gotchas (breaking any silently breaks consumers)

- Vite lib mode is forced to `fileName: 'index'` + `assetFileNames: 'index.[ext]'` so dist is `index.js`/`index.css`, matching `exports`. Don't remove — default naming yields `react-lib.js` and the package won't resolve.
- `dts` excludes `*.test.*` and `test-setup.ts` — test declaration files must not ship in `dist`.
- `sideEffects: ["**/*.css"]` must stay — without it, consumer bundlers tree-shake the CSS side-effect import and styles vanish.
- Styling is **native CSS** (CSS Modules + `:root` custom properties, class-driven `.dark`). **Not Tailwind** — ADR-0001/0003 are SUPERSEDED by ADR-0004. Do not re-introduce Tailwind.

## Release — Pattern B (ADR-0006 + ADR-0007)

- Releases are **CI-driven** via `.github/workflows/release.yml` (`workflow_dispatch`), not local. Version is derived from Conventional Commits; the maintainer only picks an optional prerelease id.
- release-it config is `packages/react-lib/.release-it.json`: `npm.publish: false`, with a `before:git:release` hook running `npm publish --provenance`. This ordering makes the release atomic — commit/tag/push happen only AFTER publish succeeds, so a failed publish never burns a version. Don't reorder.
- Publish uses **npm OIDC trusted publishing** (no `NPM_TOKEN`). The FIRST release of a new package can't use OIDC (npm/cli#8544) — bootstrap once with a one-time granular token, then configure the Trusted Publisher on npmjs pointing at `release.yml`.
- `CHANGELOG.md` is auto-generated at repo root by release-it + conventional-changelog; don't hand-edit version sections.

## Conventions (enforced, not optional)

- **Conventional Commits** enforced by commitlint via the lefthook `commit-msg` hook. Messages like `feat(scope): ...` / `fix: ...`; body lines ≤100 chars. The pre-commit hook runs `oxlint --fix` + `oxfmt --write` on staged files.
- oxlint/oxfmt have **no `--staged` flag** — lefthook passes staged files via the `{staged_files}` template and resolves binaries with `pnpm exec`. Don't "fix" this to bare `oxlint`.
- `.oxlintrc.json`: `react`/`typescript` are PLUGINS referenced in `rules`, NOT `categories`. Valid categories: correctness/suspicious/pedantic/perf/style/restriction/nursery.
- React support floor is 17.0.2 (automatic JSX runtime landed there). CI matrix covers React 17/18/19 × Node 22/24 — library code and tests must stay version-agnostic.

## Environment

- Node 24 (`.nvmrc` + `.node-version`, both kept for cross-version-manager auto-switch). Floor 22.14 — required by OIDC trusted publishing's npm CLI (ADR-0006).
- pnpm 10 via Corepack (`packageManager` field). pnpm enforces `engines` natively; `.npmrc` adds `engine-strict=true` for npm calls.

## Decision record

`docs/adr/0002`–`0007` are active; `0001`/`0003` are superseded by `0004`. Check before reversing a prior decision — these are the "why".
