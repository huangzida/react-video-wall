// Bounding-box derivation — ADR-0009 convenience.
//
// Given a set of physical-integer rects, compute the smallest physical-integer
// rect that contains them all. Pure derivation over the authoritative integer
// model (ADR-0008): no scaling, no DOM, no validation of inputs (caller's job).

import type { PhysicalRect } from "./coords";

/**
 * The smallest physical-integer rect that contains every rect in `rects`.
 * Returns `null` for an empty list (no box is defined).
 */
export function boundingBox(rects: PhysicalRect[]): PhysicalRect | null {
  if (rects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    const right = r.x + r.width;
    const bottom = r.y + r.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
