# 0002 — ESM-only Build with a React 17/18/19 CI Matrix

The Consumer Library ships **ESM only** (`dist/index.js` + `dist/index.d.ts`, `"type": "module"`, modern conditional `exports`) — no CommonJS bundle. It declares `peerDependencies` of `react`/`react-dom` `>=17.0.2` and uses the automatic JSX runtime (`jsx: "react-jsx"`), so components never need `import React`.

ESM-only because in 2026 every modern bundler (Vite, webpack 5, esbuild, Rollup, Next.js) consumes ESM natively, and CJS consumers are niche. The React 17.0.2 floor exists because automatic JSX runtime landed in 17.0.2. The "supports React 17" claim is backed by a **CI test matrix running Vitest against React 17.x, 18.x, and 19.x** (via pnpm overrides) — the peer range is a tested fact, not marketing.

## Consequences

- No CommonJS consumers out of the box. If one appears, add `@rollup/plugin-commonjs`/a CJS output later; until then the dual-build complexity isn't paid for.
- The CI matrix must cover three React majors, so a break against React 19 (or a React 17 regression) fails CI before release.
