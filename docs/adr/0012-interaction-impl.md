# 0012 — Interaction layer: react-rnd (peerDep) + custom box-select / drag-out

The interaction layer (box-select-to-open, drag, resize, drag-out-to-remove) is **opt-in** and sits on top of the core `<VideoWall>` / `<Window>` renderers (ADR-0009/0010). Core stays dependency-free; the interaction layer pulls in one peerDependency.

- **`react-rnd` is the interaction layer's peerDependency.** It provides controlled drag + 8-way resize per window via `react-draggable` + `re-resizable` (both Pointer-Events based → PC and touch unified; both actively maintained; `re-resizable` explicitly declares React 19). `react-rnd` is controlled — position/size are props, changes come back via callbacks — so the layer stays **purely state-driven** and ADR-0010's controlled model holds with no imperative-DOM friction (the moveable issue #1119 trap is avoided).
- **Box-select-to-open is custom.** A transparent overlay on the wall: pointerdown on empty area → draw a dashed rect (Pointer Events, cross-device) → pointerup emits the rect → convert to physical (ADR-0008) → clamp to wall → `onAdd`. ~40 lines.
- **Drag-out-to-remove is custom.** The window is constrained to the wall during drag (`react-rnd` `bounds="parent"` — it never leaves the wall, so the view stays clean); if the **pointer** is outside the wall at drag-release → `onRemove(id)`. Pointer-based (not window-centre) on release: the window itself never flies off-screen, the gesture is cancellable (drag out → back in → release = no remove), and there's no mid-drag unmount of the `<Rnd>`. ~10 lines.
  - _(Earlier draft judged on window-centre exit with an unconstrained drag. Changed because the unconstrained drag let the window overlap surrounding UI, and centre-out-on-release was higher effort than a pointer-out flick.)_
- All coordinates cross the DOM↔physical seam exactly here (ADR-0008): `react-rnd` gives DOM px → `Math.round(dom × physW / domViewW)` → physical → callbacks.

Rejected alternatives (verified 2026-07): `react-moveable`/`react-selecto` (frozen since 2023-12, no React 19, imperative-DOM/state-clash #1119, 76 KB of transform-matrix math useless for axis-aligned rects); `@use-gesture/react` and `interactjs` (silent 2+ years); `@dnd-kit` (list-sort-oriented, **no resize**, model mismatch — would still need re-resizable/react-rnd for resize); new canvas-editor libs (single-author, <1.5 yr, not production-safe). For axis-aligned rectangles, `react-rnd` = the pre-integrated `react-draggable + re-resizable` combo the use case actually needs.

## Consequences

- The core (`<VideoWall>`, `<Window>`, coordinate utils) has **zero** runtime deps; consumers who only render pay nothing. Consumers who want the editor install `react-rnd` alongside.
- `react-rnd` is single-element-per-window (one `<Rnd>` per window). **Multi-window simultaneous group drag/resize is not supported by default** — the spec only asks for box-select-to-OPEN and per-window edit, so this is acceptable; a selection-set could be layered on later if needed.
- Box-select-create and drag-out-remove are small self-owned modules, kept in the interaction sub-export so they never reach core-only consumers.
