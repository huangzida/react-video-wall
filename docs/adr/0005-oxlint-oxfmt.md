# 0005 — Lint/Format stack: Oxlint + Oxfmt

The Starter Template lints with **oxlint** and formats with **oxfmt** — the oxc-project toolchain, and the default lint/format stack of VoidZero's Vite+ distribution. ESLint and Prettier are not used.

Chosen over ESLint+Prettier / ESLint+Biome alternatives because:

- **Speed.** oxlint is ~50-100x faster than ESLint; oxfmt ~30x faster than Prettier and ~3x faster than Biome. Matches the performance-first positioning.
- **Coherence.** oxc is already Vite 8's internal parse/transform/minify engine (via Rolldown); sourcing lint/format from the same project keeps one toolchain mental model.
- **React coverage is mature.** oxlint ships `react/rules-of-hooks` and `react/exhaustive-deps` natively, passing 5007 tests aligned with `eslint-plugin-react-hooks` v7. Hook-correctness — the original reason to keep ESLint — is no longer a blocker.

## Consequences / caveats

- **oxfmt is beta** (v0.56) but passes 100% of Prettier's JS/TS conformance tests, so its output is deterministic and migration-safe. If it ever regresses, `oxfmt --migrate` or a swap to Biome is low-cost.
- **Type-aware linting via tsgolint is alpha and opt-in**, not on by default. The template ships stable oxlint (syntax + react-hooks + typescript rules); `--type-aware` with `oxlint-tsgolint` is documented as an opt-in for teams that want `no-floating-promises` etc.
- Windows users may hit OOM on very large repos (oxc guidance: use WSL). Noted in the template docs.
- Roughly 20% of ESLint users carry a plugin oxlint cannot yet replace (custom type-aware rules, Svelte/Vue/Angular file formats). None apply to a React+TS component library.
