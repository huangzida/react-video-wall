# 0008 — Coordinate model: physical-integer-authoritative

The wall and every rect on it (tiles, windows) are modelled in **physical-integer pixels** — the real wall's native grid. The DOM is a derived, scaled view that never holds authoritative state. Coordinates cross the boundary exactly once per interaction: when a DOM-px gesture (from `moveable`/`selecto`) writes back to the model, it rounds to the nearest physical integer via integer-driven math (`Math.round(dom × physW / domViewW)`), never via a precomputed float ratio.

Chosen over DOM-authoritative (model in DOM px, convert at submit) because DOM-float × a large ratio → round → re-render ÷ ratio accumulates drift across edit cycles. Physical-integer-authoritative cannot drift: the model only ever holds integers, and sub-physical-pixel detail is not representable on the real wall anyway, so snapping to the physical grid loses no meaningful precision.

## Consequences

- The public API exposes **only physical coordinates** (wall size, tile rects, window rects, event payloads). DOM px are an implementation detail, never leaked to consumers.
- `selecto` and `moveable` operate in DOM px; they sit behind an explicit conversion seam in the interaction layer. That seam is the only place DOM px are translated to physical.
- Render recomputes `scale = min(domViewW / physW, domViewH / physH)` (contain-fit, after padding) every layout; element DOM positions are `phys × scale` (CSS sub-pixel is fine). Scale is derived from the integer `(physW, domViewW)` pair, never stored as a stale float.
- Any drag/resize a user performs snaps to the nearest physical pixel — intended, since the physical wall cannot display finer.
