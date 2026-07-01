# 0001 — Pre-compiled Tailwind CSS for the Consumer Library

> **Status: superseded by [ADR-0004](./0004-native-css.md) (2026-07-01). Kept for history.**

The Consumer Library uses Tailwind v4 but ships a **pre-compiled, static `dist/style.css`** built at library build time. End Users import `react-lib/style.css` and get fully styled components without installing or configuring Tailwind themselves.

We chose pre-compiled over shipping Tailwind source/preset because the stated goal is zero consumer friction ("消费者不用自己写样式"). The trade-off: consumers cannot tree-shake the CSS on their side, and theme customization is limited to the CSS variables we expose via Tailwind v4 `@theme` (no consumer-side Tailwind config). That ceiling is acceptable — it matches the "batteries-included" product we promised.

## Considered Options

- **Pre-compiled (chosen).** Consumer friction: zero. Customization: via CSS variables only.
- **Ship Tailwind source / preset.** Consumer must install Tailwind and configure `content` globs; full customization but high friction. Rejected: contradicts the zero-friction goal. (This is the shadcn/ui "deliver source" model — a different product.)

## Consequences

- The library build pipeline must run Tailwind compilation (`@tailwindcss/vite`) and emit `dist/style.css`, referenced from `package.json#exports` as `"./style.css"`.
- Tailwind v4 Preflight (reset) lands in the artifact and may conflict with the End User's own app reset — must be addressed at build config time (see ADR on build config).
- No consumer-side tree-shaking of unused CSS; the whole `style.css` ships. Fine for a component library; revisit only if it grows large.
