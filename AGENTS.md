# AGENTS.md

Operational guidance. Read this + CONTEXT.md (vocabulary) + docs/adr/ (decisions) + docs/PLAN.md (implementation) before coding.

## What this repo is
`react-video-wall` — a composable React component library for video-wall (大屏) layout, windowing, and interactive editing. Built on the starter-react template (build/test/lint/release infra inherited). Two layers: a zero-dependency **core** (render a physical wall to the DOM, lossless coords) and an opt-in **interactive** layer (box-select / drag / resize / remove via react-rnd).

## Package structure (ADR-0013)
- `packages/react-video-wall` — the publishable package, **two sub-exports**:
  - `.` (core) — `<VideoWall>`, `<Window>`, coordinate utils, `splitWall`. **Zero deps.**
  - `./interactive` — `<VideoWallEditor>`, `<InteractionLayer>`, box-select, drag-out. peerDep **react-rnd**.
- `apps/playground` — dev-only demo app (static wall + editor), NEVER published.

## The coordinate model (ADR-0008) — the foundation
All rects (wall, tiles, windows) are modelled in **physical-integer pixels** (the real wall's grid). The DOM is a derived, scaled view. Conversions cross the boundary once per interaction, integer-driven (`Math.round(dom * physW / domViewW)`), never a stored float ratio. **Never** let DOM-float state become authoritative — it drifts.

## Commands (inherited from template)
- `corepack enable` + `pnpm install` — setup (Node 24 / pnpm 10 via Corepack).
- `pnpm build:lib` — Vite multi-entry lib build -> dist/core.js + dist/interactive.js + dist/rvw.css.
- `pnpm test` — vitest in react-video-wall.
- `pnpm lint` / `pnpm fmt` / `pnpm lint:ci` — oxlint / oxfmt --write / oxlint+oxfmt --check. NOT eslint/prettier.
- `pnpm release:dry-run` — verdaccio publish + consumer-install gate. **Run before any build/publish change.**
- No root `dev` — playground dev is `pnpm --filter playground dev`.

## Build-contract gotchas
- Multi-entry Vite lib: `exports` must map `.` and `./interactive`, each with `types`. `react-rnd` is externalized (peerDep), NOT bundled.
- `sideEffects: ["**/*.css"]` stays — consumer bundlers must not tree-shake the CSS side-effect import.
- dts excludes test files; tile borders (not gaps) preserve the exact-partition invariant (ADR-0009).
- Vite lib `fileName` forces `index`/asset naming to match `exports` (inherited template gotcha).

## Conventions (enforced)
- Conventional Commits (commitlint via lefthook; body lines <= 100). pre-commit runs oxlint+oxfmt on staged.
- oxlint: react/typescript are PLUGINS in `rules`, NOT categories. oxlint/oxfmt have NO `--staged` flag — lefthook uses `{staged_files}` + `pnpm exec`.
- React peerDep `>=17.0.2`; CI matrix 17/18/19 x Node 22/24.

## Release
CI-driven (release.yml workflow_dispatch), OIDC trusted publishing (no NPM_TOKEN), first release bootstrapped with a one-time granular token (npm/cli#8544). CHANGELOG auto-generated; don't hand-edit version sections.

## Decision record
docs/adr/0008-0013 are this project's decisions; 0001-0007 are inherited template infra. Check before reversing anything.
