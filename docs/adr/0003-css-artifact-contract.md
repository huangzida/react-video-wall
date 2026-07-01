# 0003 — Consumer Library CSS Artifact Contract

> **Status: superseded by [ADR-0004](./0004-native-css.md) (2026-07-01). Kept for history.**

The Consumer Library ships a single pre-compiled `dist/index.css` whose contract is fixed at build time. Four decisions define it:

- **No Preflight.** Entry CSS imports only `tailwindcss/theme.css` and `tailwindcss/utilities.css` — no `preflight.css`. Components must be self-contained (explicit `box-sizing`, base styles) so they drop into an End User app that already has its own reset without cascade pollution.
- **Modern browser target, no downgrade.** Lightning CSS targets `{ chrome: 111, safari: 16.4, firefox: 128 }` — the floor where `oklch()`, `color-mix()`, and `@property` all exist. Output stays modern; no lossy rgb/cascade-layer downgrades.
- **Class-driven dark mode.** `@custom-variant dark (&:where(.dark, .dark *))`, so End Users toggle dark mode via a `.dark` class rather than it being locked to `prefers-color-scheme`.
- **Single artifact.** One `style.css` exposed via `exports["./style.css"]`. No separate `theme.css`; the `@theme` `:root` variables live inside `style.css` for End Users to override directly.

## Consequences

- **Windows 7 / 8.1 are not supported.** Their browser ceilings (Chrome 109, Firefox 115 ESR) sit below the syntax floor. Downgrading would (a) shift `oklch()` colors to lossy rgb approximations, (b) break `color-mix()` theming — our `@theme` model is CSS-variable-driven and `color-mix()` cannot be statically resolved against variables, and (c) lossily rewrite `@layer`. Supporting a 6-year-EOL'd OS that Chrome and Firefox themselves abandoned contradicts the project's modern/geek/performance-first positioning.
- Advanced utilities (`text-balance`, `@starting-style`, etc.) raise the floor if used. The template keeps example components on baseline utilities and leaves a `ponytail:` note naming the ceiling + upgrade path.
