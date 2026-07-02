# 0010 — Window data model (controlled, shell-rendered)

Built on the wall/tile model (ADR-0009) and the coordinate model (ADR-0008).

- **Windows are a controlled list prop** — `windows: Window[]`, owned by the consumer. The library is stateless about window data; every change (add / move / resize / remove, driven by the interaction layer) is reported up via callbacks (`onAdd`, `onMove`, `onResize`, `onRemove`, and/or a convenience `onWindowsChange`). The consumer decides how to persist/sync the data. This is what makes the library composable.
- **A Window is `{ id, x, y, width, height }`** in physical-integer wall coordinates (origin `0,0` = wall top-left), plus an open extension slot (`z?`, `data?`, etc.) for consumer business fields. The library only cares about geometry; `id` is the stable React key and the moveable target handle.
- **`<Window>` renders as a shell/frame only.** The consumer provides `children` (a `<video>`, `<img>`, iframe, chart — anything). The library never assumes content type, keeping the core free of media/business dependencies.
- **Overlap is allowed.** z-order defaults to array order (later = on top); an optional explicit `z` overrides.
- **Window geometry is validated/clamped to the wall rect** `[0,0,W,H]`. Dragging a window *out* of the wall to remove it is an interaction-layer behaviour (ADR-0011), not a data-model rule.

## Consequences

- The window array is the single source of truth and lives in the consumer's state — the library never holds or mutates it.
- Because windows are shells, the library renders correctly for any content; consumers compose their own media.
- Since windows are plain physical-integer rects, persisting/serialising them (and round-tripping through the physical grid) is lossless by construction (ADR-0008).
