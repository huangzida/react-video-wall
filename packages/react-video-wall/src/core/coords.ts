// Coordinate model — ADR-0008 (physical-integer-authoritative).
//
// The wall and every rect on it (tiles, windows) are modelled in physical-INTEGER
// pixels: the real wall's native grid. The DOM is a derived, scaled view that never
// holds authoritative state. Coordinates cross the boundary exactly once per
// interaction, integer-driven, so the model can never drift.
//
// Interpretation note (ADR-0008 x ADR-0009): rendering is contain-fit with a SINGLE
// uniform `scale = min(domView.w / wall.w, domView.h / wall.h)` (ADR-0009), so the
// wall's DOM box is `phys x scale` on BOTH axes. For the lossless round-trip
// `toPhysical(toDom(phys)) === phys` to hold on BOTH axes — including the
// non-binding axis under contain-fit — `toPhysical` must divide by that SAME uniform
// scale. (ADR-0008's literal `round(dom x wall.w / domView.w)` is the width-binding
// special case; dividing by the uniform min-scale is its contain-fit generalisation
// and is what makes the round-trip hold universally. Both honour the principle:
// scale is derived fresh from the integer (wall, domView) pair every layout, never
// stored as a stale float ratio.)

/** The authoritative wall size, in physical-integer pixels. Origin (0,0) = top-left. */
export interface WallSize {
  width: number;
  height: number;
}

/** A rectangle in physical-integer wall coordinates. */
export interface PhysicalRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The wall's DOM view box (container minus padding), in float DOM pixels. */
export interface DomView {
  width: number;
  height: number;
}

/** A rectangle in wall-relative DOM coordinates (origin = the wall's DOM box top-left). */
export interface DomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The uniform contain-fit scale (ADR-0009): `min(domView.w / wall.w, domView.h / wall.h)`.
 * Derived fresh from the integer (wall, domView) pair every layout — never cached.
 */
export function computeScale(wall: WallSize, domView: DomView): number {
  return Math.min(domView.width / wall.width, domView.height / wall.height);
}

/** Physical-integer -> wall-relative DOM px (CSS sub-pixel is fine). */
export function toDom(value: number, scale: number): number {
  return value * scale;
}

/**
 * Wall-relative DOM px -> physical-integer. Snaps to the nearest physical grid point
 * (ADR-0008: the physical wall cannot display sub-pixel detail, so this loses no
 * meaningful precision and cannot drift).
 */
export function toPhysical(value: number, scale: number): number {
  return Math.round(value / scale);
}

/** Physical-integer rect -> wall-relative DOM rect. */
export function toDomRect(phys: PhysicalRect, scale: number): DomRect {
  return {
    x: phys.x * scale,
    y: phys.y * scale,
    width: phys.width * scale,
    height: phys.height * scale,
  };
}

/** Wall-relative DOM rect -> physical-integer rect (each field snapped to the grid). */
export function toPhysicalRect(dom: DomRect, scale: number): PhysicalRect {
  return {
    x: Math.round(dom.x / scale),
    y: Math.round(dom.y / scale),
    width: Math.round(dom.width / scale),
    height: Math.round(dom.height / scale),
  };
}
