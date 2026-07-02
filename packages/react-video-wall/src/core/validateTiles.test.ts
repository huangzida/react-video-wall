import { describe, expect, it } from "vitest";
import { splitWall } from "./splitWall";
import type { PhysicalRect, WallSize } from "./coords";
import { validateTiles } from "./validateTiles";

// ADR-0009: tiles must exactly partition [0,0,W,H] — no gaps, no overlaps, no
// overflow. validateTiles enforces that for ARBITRARY partitions (not just grids)
// via in-bounds + area-equality + no-overlap. These tests encode valid covers
// (hand-verified) and each violation class.

describe("validateTiles accepts exact covers", () => {
  it("accepts a 3x3 splitWall output exactly covering the wall", () => {
    const wall: WallSize = { width: 10000, height: 6000 };
    const tiles = splitWall(wall, 3, 3);
    expect(() => validateTiles(tiles, wall)).not.toThrow();
  });

  it("accepts a single tile equal to the whole wall", () => {
    const wall: WallSize = { width: 1920, height: 1080 };
    const tiles: PhysicalRect[] = [{ x: 0, y: 0, width: 1920, height: 1080 }];
    expect(() => validateTiles(tiles, wall)).not.toThrow();
  });

  it("accepts an arbitrary (non-grid) partition that still exactly covers", () => {
    // Worked example, verified by hand: wall 100x100.
    //   {0,0,60,100}   -> left column, full height
    //   {60,0,40,50}   -> right column, top half
    //   {60,50,40,50}  -> right column, bottom half
    // Column split 60/40 (sums to 100 width); right column split 50/50 (sums to
    // 100 height). Three tiles, area = 6000+2000+2000 = 10000 = wall area. Exact.
    const wall: WallSize = { width: 100, height: 100 };
    const tiles: PhysicalRect[] = [
      { x: 0, y: 0, width: 60, height: 100 },
      { x: 60, y: 0, width: 40, height: 50 },
      { x: 60, y: 50, width: 40, height: 50 },
    ];
    expect(() => validateTiles(tiles, wall)).not.toThrow();
  });
});

describe("validateTiles rejects violations", () => {
  it("rejects a tile that overflows the wall", () => {
    const wall: WallSize = { width: 100, height: 100 };
    // tile right edge = 110 > 100 -> overflow
    const tiles: PhysicalRect[] = [{ x: 10, y: 0, width: 100, height: 100 }];
    expect(() => validateTiles(tiles, wall)).toThrow(RangeError);
    expect(() => validateTiles(tiles, wall)).toThrow(/out of wall bounds/);
  });

  it("rejects a gap (tile area less than wall area)", () => {
    const wall: WallSize = { width: 100, height: 100 };
    // wall area 10000; tile area 90*90 = 8100 < 10000 -> gap / under-cover
    const tiles: PhysicalRect[] = [{ x: 0, y: 0, width: 90, height: 90 }];
    expect(() => validateTiles(tiles, wall)).toThrow(RangeError);
    expect(() => validateTiles(tiles, wall)).toThrow(/!= wall area/);
  });

  it("rejects overlapping tiles", () => {
    const wall: WallSize = { width: 100, height: 100 };
    // Two tiles that OVERLAP yet still sum to the wall area, so the area check
    // passes and the pairwise overlap check must catch it. A={0,0,60,100} (area
    // 6000) overlaps B={50,0,40,100} (area 4000) on x in [50,60); sum = 10000 =
    // wall area. There is a compensating gap on the right (x in [90,100)).
    const tiles: PhysicalRect[] = [
      { x: 0, y: 0, width: 60, height: 100 },
      { x: 50, y: 0, width: 40, height: 100 },
    ];
    expect(() => validateTiles(tiles, wall)).toThrow(RangeError);
    expect(() => validateTiles(tiles, wall)).toThrow(/overlap/);
  });

  it("rejects a non-integer tile coordinate", () => {
    const wall: WallSize = { width: 100, height: 100 };
    const tiles: PhysicalRect[] = [{ x: 0.5, y: 0, width: 100, height: 100 }];
    expect(() => validateTiles(tiles, wall)).toThrow(RangeError);
    expect(() => validateTiles(tiles, wall)).toThrow(/non-integer/);
  });

  it("rejects a zero-width tile", () => {
    const wall: WallSize = { width: 100, height: 100 };
    const tiles: PhysicalRect[] = [{ x: 0, y: 0, width: 0, height: 100 }];
    expect(() => validateTiles(tiles, wall)).toThrow(RangeError);
    expect(() => validateTiles(tiles, wall)).toThrow(/out of wall bounds/);
  });
});
