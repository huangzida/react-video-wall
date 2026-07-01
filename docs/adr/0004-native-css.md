# 0004 — Native CSS (CSS Modules + custom properties) for the Consumer Library

_Supersedes ADR-0001 and ADR-0003._

The Consumer Library styles itself with **native CSS** — CSS Modules for per-component scoping plus CSS custom properties for theming — compiled and emitted by Vite's native CSS handling. No Tailwind, no `@tailwindcss/vite`, no Lightning CSS config layer; the platform is the toolchain.

We switched off the pre-compiled-Tailwind decision after the Win7/browser-floor, Preflight-conflict, and dynamic-class-scan issues all turned out to be Tailwind artifacts. In a pre-compiled component-library context the End User experience is identical either way (import one `style.css`); the difference is entirely author-side, and for the focused component libraries this Starter Template targets, native CSS's zero-dependency, author-controlled-floor, predictable-output profile beats Tailwind's authoring-speed / design-system payoff. Tailwind remains the right call for large UI kits (dozens of components, strong consistency needs) — downstream teams who want it can add it on top.

## Contract

- **CSS Modules** for component-local styles (`Counter.module.css`); Vite scopes class names automatically and bundles them into the lib build.
- **Custom properties for theming**: `:root { --rl-color-primary: ... }` in a global `src/style.css`, with `.dark { ... }` overrides for class-driven dark mode. End Users override the same variables in their own CSS — no framework needed.
- **Single artifact**: one `dist/index.css` exposed via `exports["./style.css"]`, same shape as before. `sideEffects: ["**/*.css"]` retained so bundlers don't tree-shake the CSS side-effect import.
- **No shipped reset** (no Preflight equivalent). Components are self-contained.
- **No forced browser floor.** Authors choose per feature: custom properties + `@layer` give a floor around Chrome 99 / Safari 15.4 / Firefox 97 (2022); CSS nesting raises it to ~Chrome 112 / Firefox 117 / Safari 16.5. No build-time downgrade — write compatible CSS directly if broader support is needed (trivially covers Win7 if ever required).

## Consequences

- The browser-floor decision from ADR-0003 (Chrome 111 / Firefox 128 / no-Win7) is gone — the floor is now author-chosen and per-feature.
- Preflight stripping (ADR-0003) is moot — there is no framework reset to strip.
- Adding Tailwind later remains possible if a downstream Consumer Library grows into a large UI kit; the native-CSS baseline doesn't prevent it.
