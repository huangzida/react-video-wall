# 0009 — Wall & Tile data model

Built on the physical-integer coordinate model (ADR-0008), the wall and its tiles are defined as follows.

- **Wall size is an explicit, authoritative input** — `wall = { width, height }` in physical-integer pixels. It is the coordinate anchor (origin `0,0`, extent `W,H`) that every Window is positioned against. A `boundingBox(tiles)` helper exists for convenience derivation, but the model never lets a derived value override the explicit wall — that would let the coordinate frame drift when tiles change.
- **Tiles are a single model: a list of physical-integer rects** `[{x,y,width,height}, …]` that must **exactly partition** `[0,0,W,H]` (no gaps, no overlaps, no overflow); violations are validated and rejected. Arbitrary partitions are supported. `NxN` is a **generator** (`splitWall(wall, cols, rows) → rects`), not a separate model — there is one tile representation.
- **The NxN generator distributes remainder pixels** to the last column/row so every tile size is an integer summing exactly to the wall (e.g. 10000 px / 3 → `3333, 3333, 3334`). No fractional tiles — a direct consequence of ADR-0008's integer grid.
- **Tile boundaries are drawn as CSS borders/outlines, not gaps.** Gaps would break the exact-partition invariant and perturb Window coordinates; borders draw the seam without moving any rect.
- **Render is contain-fit with padding.** `scale = min(domViewW / physW, domViewH / physH)` where `domView` = container minus padding; the wall's DOM box is `phys × scale`, centred (letterboxing is expected when aspect ratios differ). Padding is a prop.

## Consequences

- Passing a tile list that does not exactly cover the wall is a configuration error caught at the boundary, not silently rendered.
- Tile visuals (borders) are purely presentational — they never affect the coordinate model or window positions.
- Because the wall is always an explicit rectangle, Window coordinates always have a stable referent regardless of how tiles are arranged or rearranged.
