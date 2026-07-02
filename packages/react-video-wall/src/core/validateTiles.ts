// Boundary validation — ADR-0009.
//
// "Tiles ... must exactly partition [0,0,W,H] (no gaps, no overlaps, no overflow);
// violations are validated and rejected." This validates ARBITRARY partitions,
// not just grids. For axis-aligned rects all inside the wall, the three checks
// (in-bounds + area-equality + no-overlap) together imply an exact cover: any gap
// would make the covered area strictly less than the wall area, and any overflow
// would make it strictly more, so equal area with no overlap and no overflow
// leaves exactly the wall covered.

import type { PhysicalRect, WallSize } from "./coords";

/**
 * Validate that `tiles` exactly partition the `wall` (no gaps, no overlaps, no
 * overflow, all physical-integer). Returns normally if valid; throws `RangeError`
 * with a descriptive message on the first violation.
 */
export function validateTiles(tiles: PhysicalRect[], wall: WallSize): void {
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (
      !Number.isInteger(t.x) ||
      !Number.isInteger(t.y) ||
      !Number.isInteger(t.width) ||
      !Number.isInteger(t.height) ||
      !(t.width > 0) ||
      !(t.height > 0) ||
      !(t.x >= 0) ||
      !(t.y >= 0) ||
      !(t.x + t.width <= wall.width) ||
      !(t.y + t.height <= wall.height)
    ) {
      throw new RangeError(
        `validateTiles: tile ${i} out of wall bounds or non-integer: ${JSON.stringify(t)}`,
      );
    }
  }

  const wallArea = wall.width * wall.height;
  let sum = 0;
  for (const t of tiles) sum += t.width * t.height;
  if (sum !== wallArea) {
    throw new RangeError(
      `validateTiles: tile area ${sum} != wall area ${wallArea} (gaps or overflow)`,
    );
  }

  // ponytail: O(n^2) pairwise overlap check; fine for realistic wall tile counts
  // (tens to low hundreds). Upgrade to a sweep-line if huge walls need it.
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const a = tiles[i];
      const b = tiles[j];
      const overlap =
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      if (overlap) {
        throw new RangeError(`validateTiles: tiles ${i} and ${j} overlap`);
      }
    }
  }
}
