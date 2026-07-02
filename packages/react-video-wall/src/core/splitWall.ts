// Wall & tile data model — ADR-0009.
//
// Tiles are a single model: a list of physical-integer rects that EXACTLY partition
// [0,0,W,H] (no gaps, no overlaps, no overflow). splitWall is the NxN GENERATOR: it
// distributes remainder pixels to the LAST column/row so every tile size is an integer
// summing exactly to the wall (e.g. 10000 / 3 -> 3333, 3333, 3334). A direct
// consequence of ADR-0008's integer grid — no fractional tiles are ever produced.

import type { PhysicalRect, WallSize } from "./coords";

export type { PhysicalRect, WallSize };

/**
 * Split a wall into a `cols` x `rows` grid of physical-integer tiles that exactly
 * cover [0,0,wall.width,wall.height]. Remainder pixels go to the last column/row.
 *
 * Tiles are emitted row-major (left-to-right, top-to-bottom).
 */
export function splitWall(wall: WallSize, cols: number, rows: number): PhysicalRect[] {
  if (!Number.isInteger(cols) || cols < 1) {
    throw new RangeError(`splitWall: cols must be a positive integer (got ${cols})`);
  }
  if (!Number.isInteger(rows) || rows < 1) {
    throw new RangeError(`splitWall: rows must be a positive integer (got ${rows})`);
  }

  const colW = Math.floor(wall.width / cols);
  const colRem = wall.width - colW * cols; // remainder px -> last column
  const rowH = Math.floor(wall.height / rows);
  const rowRem = wall.height - rowH * rows; // remainder px -> last row

  const rects: PhysicalRect[] = [];
  let y = 0;
  for (let r = 0; r < rows; r++) {
    const height = rowH + (r === rows - 1 ? rowRem : 0);
    let x = 0;
    for (let c = 0; c < cols; c++) {
      const width = colW + (c === cols - 1 ? colRem : 0);
      rects.push({ x, y, width, height });
      x += width;
    }
    y += height;
  }
  return rects;
}
