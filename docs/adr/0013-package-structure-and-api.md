# 0013 — Package structure & component API

`react-video-wall` is **one package with two sub-exports**, so the dependency-free core and the react-rnd interaction layer are isolated by import path, not by repository.

## Sub-exports

- **`react-video-wall`** (core) — `<VideoWall>`, `<Window>`, `useWallScale`, coordinate utils (`toPhysical` / `toDom`), `splitWall`, `boundingBox`. **Zero** runtime dependencies.
- **`react-video-wall/interactive`** — `<VideoWallEditor>`, `<InteractionLayer>`, `BoxSelect`, drag-out hook. `react-rnd` is a **peerDependency** (ADR-0012).

Build: Vite library mode, **multi-entry** → `dist/core.js` + `dist/interactive.js` + one `dist/rvw.css`; `package.json#exports` maps `.` → core and `./interactive` → interactive; `react-rnd` is externalized. Core-only consumers never resolve `react-rnd`.

## Components

- **Composable primitives**: `<VideoWall wall tiles padding>` (renders tiles, contain-fit, provides scale via context), `<Window rect>` (physical-rect shell, consumer provides children), `<InteractionLayer>` (adds box-select + drag/resize/remove via react-rnd; emits `onAdd`/`onMove`/`onResize`/`onRemove`).
- **Convenience**: `<VideoWallEditor wall tiles windows padding ...handlers>` composes all three for one-line setup. Consumers wanting control use the primitives directly.

## Extension points

`renderTile?(tile, i)` and `renderWindow?(window)` render-props; snapping config (tile-boundary / grid), min/max size, aspect lock as `<InteractionLayer>` props; coordinate utils exported for advanced consumers.

A monorepo (separate `@rvw/core` + `@rvw/interactive`) was rejected for v1 as overkill; sub-exports deliver the same isolation and peerDep boundary with one package and one publish pipeline.

## Consequences

- The peerDep boundary is enforced by import path: importing `.` never pulls `react-rnd`; importing `./interactive` requires it.
- `splitWall` (NxN remainder distribution, ADR-0009) and the coordinate utils (ADR-0008) live in core and are reusable by both layers and by consumers directly.
- Multi-entry build means `exports` must carry `types` conditions for both sub-paths; `vite-plugin-dts` emits per-entry declarations.
