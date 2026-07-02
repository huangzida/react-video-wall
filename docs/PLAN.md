# Implementation Plan

Status: design COMPLETE (CONTEXT.md + docs/adr/0008-0013). Ready to implement; nothing has been built yet.

## Goal
A composable React video-wall component library. Core renders a physical video wall to the DOM at any scale with lossless coordinates; an opt-in interactive layer adds box-select / drag / resize / remove.

## Read first (in order)
1. CONTEXT.md — vocabulary (Video Wall / Tile / Window / Wall Layout / Coordinate Space) + 3-layer architecture.
2. docs/adr/0008-coordinate-model.md — THE foundation (physical-integer-authoritative; solves "lossless coordinate submission").
3. docs/adr/0009 (wall/tile), 0010 (window), 0012 (interaction: react-rnd), 0013 (package structure).

## Target package layout
packages/react-video-wall/        (rename from packages/react-lib)
├── src/
│   ├── core/                     # zero-dep
│   │   ├── VideoWall.tsx         # tiles + contain-fit + scale context
│   │   ├── Window.tsx            # physical-rect shell + children
│   │   ├── WallContext.tsx       # useWallScale
│   │   ├── coords.ts             # computeScale / toPhysical / toDom (ADR-0008)
│   │   ├── splitWall.ts          # NxN generator, remainder distribution (ADR-0009)
│   │   └── boundingBox.ts        # tiles -> wall convenience
│   ├── interactive/              # peerDep react-rnd
│   │   ├── VideoWallEditor.tsx   # convenience composition
│   │   ├── InteractionLayer.tsx  # react-rnd per window + box-select + drag-out
│   │   ├── BoxSelect.tsx         # custom overlay
│   │   └── useDragOut.ts         # centre-exits-wall -> onRemove
│   ├── core.index.ts             # entry "."
│   └── interactive.index.ts      # entry "./interactive"
├── vite.config.ts                # multi-entry lib build
└── package.json                  # exports . + ./interactive; peerDep react/react-rnd

## Steps
1. Rename packages/react-lib -> packages/react-video-wall (dir, package.json name, pnpm-workspace.yaml).
2. Replace src/ with core/ + interactive/.
3. Vite multi-entry lib build (build.lib.entry = { core, interactive }); externalize react, react-dom, react/jsx-runtime, react-rnd.
4. package.json exports: "." -> core, "./interactive" -> interactive, each with types. peerDeps react/react-dom >=17.0.2; react-rnd required by ./interactive consumers.
5. Core: coords (computeScale = min(domViewW/physW, domViewH/physH); toPhysical = round integer-driven; toDom = phys*scale), splitWall (NxN remainder), boundingBox, WallContext, VideoWall (tiles with borders NOT gaps, contain-fit, padding), Window (shell).
6. Interactive: InteractionLayer (per-window react-rnd; convert DOM->physical at the boundary; emit onMove/onResize), BoxSelect (overlay, pointer events, emit onAdd), useDragOut (centre out -> onRemove), VideoWallEditor (compose).
7. Playground: <VideoWall> static + <VideoWallEditor> side by side; dark toggle.
8. Tests (CRITICAL — encode the design guarantees):
   - toPhysical(toDom(phys)) === phys for integer physRects (ADR-0008 lossless round-trip).
   - splitWall output exactly covers [0,0,W,H]; all integers; sums exact.
   - Window drag clamps to wall; centre drag-out -> onRemove.
9. lint:ci (oxlint+oxfmt); release:dry-run (verdaccio; react-video-wall may be taken on npm but the dry-run isolates it); then OIDC publish.

## Invariants (do not violate)
- Model holds ONLY physical integers; DOM px are derived render state (ADR-0008).
- Tiles exactly partition the wall; borders, not gaps (ADR-0009).
- Windows are a controlled prop; the lib never holds window state (ADR-0010).
- The core import path (".") never pulls react-rnd; only "./interactive" does (ADR-0013).
