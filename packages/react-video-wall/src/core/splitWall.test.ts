import { describe, expect, it } from "vitest";
import { splitWall, type PhysicalRect, type WallSize } from "./splitWall";

// ADR-0009: tiles are a single model — a list of physical-integer rects that must
// EXACTLY partition [0,0,W,H] (no gaps, no overlaps, no overflow). splitWall is the
// NxN GENERATOR; it distributes remainder pixels to the last column/row so every
// tile size is an integer summing exactly to the wall (e.g. 10000 / 3 -> 3333,3333,3334).

/** Every tile must be a non-negative integer rect inside the wall. */
function assertIntegerRectsIn(rects: PhysicalRect[], wall: WallSize) {
  for (const r of rects) {
    expect(Number.isInteger(r.x)).toBe(true);
    expect(Number.isInteger(r.y)).toBe(true);
    expect(Number.isInteger(r.width)).toBe(true);
    expect(Number.isInteger(r.height)).toBe(true);
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(wall.width);
    expect(r.y + r.height).toBeLessThanOrEqual(wall.height);
  }
}

/** Assert the rects form a cols x rows grid that exactly covers [0,0,W,H]. */
function assertExactCover(rects: PhysicalRect[], wall: WallSize, cols: number, rows: number) {
  expect(rects).toHaveLength(cols * rows);
  // column boundaries: within every row the x-runs are contiguous and end at wall.width
  for (let r = 0; r < rows; r++) {
    let x = 0;
    for (let c = 0; c < cols; c++) {
      const t = rects[r * cols + c];
      expect(t.x).toBe(x); // no gaps, no overlaps
      x = t.x + t.width;
    }
    expect(x).toBe(wall.width); // exact right edge
  }
  // row boundaries: contiguous and end at wall.height
  for (let c = 0; c < cols; c++) {
    let y = 0;
    for (let r = 0; r < rows; r++) {
      const t = rects[r * cols + c];
      expect(t.y).toBe(y);
      y = t.y + t.height;
    }
    expect(y).toBe(wall.height); // exact bottom edge
  }
}

describe("splitWall exact partition (ADR-0009)", () => {
  it("a single tile covers the whole wall (1x1)", () => {
    const wall: WallSize = { width: 1920, height: 1080 };
    const rects = splitWall(wall, 1, 1);
    assertIntegerRectsIn(rects, wall);
    assertExactCover(rects, wall, 1, 1);
    expect(rects[0]).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("distributes remainder pixels to the LAST column/row (ADR worked example)", () => {
    // ADR-0009: 10000 px / 3 -> 3333, 3333, 3334. 6000 / 3 = 2000 (exact).
    const wall: WallSize = { width: 10000, height: 6000 };
    const rects = splitWall(wall, 3, 3);
    assertIntegerRectsIn(rects, wall);
    assertExactCover(rects, wall, 3, 3);

    // column widths per row: [3333, 3333, 3334] (remainder -> last col)
    expect(rects[0].width).toBe(3333);
    expect(rects[1].width).toBe(3333);
    expect(rects[2].width).toBe(3334);
    // row heights: all 2000 (no remainder)
    expect(rects[0].height).toBe(2000);
    expect(rects[3].height).toBe(2000);
    expect(rects[6].height).toBe(2000);
  });

  it("distributes remainder on BOTH axes (5000/3 -> 1666,1666,1668)", () => {
    const wall: WallSize = { width: 5000, height: 5000 };
    const rects = splitWall(wall, 3, 3);
    assertIntegerRectsIn(rects, wall);
    assertExactCover(rects, wall, 3, 3);
    // floor(5000/3)=1666, rem=2 -> LAST row gets +2 = 1668.
    // rects[0..2] are row 0 (height 1666); rects[6..8] are the last row (height 1668).
    expect(rects[0].height).toBe(1666);
    expect(rects[6].height).toBe(1668);
    expect(rects[6].y + rects[6].height).toBe(5000); // bottom row seals the wall
  });

  it("an even split leaves no remainder (3840x2160 / 4x2)", () => {
    const wall: WallSize = { width: 3840, height: 2160 };
    const rects = splitWall(wall, 4, 2);
    assertIntegerRectsIn(rects, wall);
    assertExactCover(rects, wall, 4, 2);
    expect(rects[0]).toEqual({ x: 0, y: 0, width: 960, height: 1080 });
    expect(rects[7]).toEqual({ x: 2880, y: 1080, width: 960, height: 1080 });
  });

  it("all tiles are integers and inside the wall for an odd-sized wall", () => {
    const wall: WallSize = { width: 9999, height: 7777 };
    const rects = splitWall(wall, 7, 5);
    assertIntegerRectsIn(rects, wall);
    assertExactCover(rects, wall, 7, 5);
  });
});
