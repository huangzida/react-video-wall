import { describe, expect, it } from "vitest";
import { boundingBox } from "./boundingBox";
import type { PhysicalRect } from "./coords";

// ADR-0009 convenience: bounding box is the smallest physical-integer rect that
// contains the input rects. Expected values below are HAND-COMPUTED independent
// truth (min origin, max far edge), not recomputed from the function under test.

describe("boundingBox", () => {
  it("returns null for an empty list (no box is defined)", () => {
    expect(boundingBox([])).toBeNull();
  });

  it("returns the rect itself for a single rect", () => {
    const r: PhysicalRect = { x: 10, y: 20, width: 100, height: 50 };
    expect(boundingBox([r])).toEqual(r);
  });

  it("computes the bounding box of multiple rects (worked example)", () => {
    // Worked example, verified by hand:
    //   {0,0,100,100}   -> right 100, bottom 100
    //   {50,50,100,100} -> right 150, bottom 150
    //   {200,10,5,5}    -> right 205, bottom 15
    //   min origin = (0,0); max right = 205; max bottom = 150
    //   => {x:0, y:0, width: 205-0=205, height: 150-0=150}
    const rects: PhysicalRect[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 },
      { x: 200, y: 10, width: 5, height: 5 },
    ];
    expect(boundingBox(rects)).toEqual({ x: 0, y: 0, width: 205, height: 150 });
  });

  it("uses the min origin even when no rect starts at (0,0)", () => {
    // {10,20,30,40} -> right 40, bottom 60
    // {20,5,10,10}  -> right 30, bottom 15
    // min origin = (10,5); max right = 40; max bottom = 60
    // => width 30, height 55
    const rects: PhysicalRect[] = [
      { x: 10, y: 20, width: 30, height: 40 },
      { x: 20, y: 5, width: 10, height: 10 },
    ];
    expect(boundingBox(rects)).toEqual({ x: 10, y: 5, width: 30, height: 55 });
  });
});
