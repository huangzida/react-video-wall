import { describe, expect, it } from "vitest";
import {
  clampRectToWall,
  clampToWall,
  dragRect,
  isBelowMinSize,
  isCentreOutside,
  isPointOutsideBox,
  minSizeToDom,
} from "./geometry";

// ADR-0012: the DOM<->physical seam lives in the interaction layer. These pure
// helpers carry the policy (wall clamping, centre-exits-wall drag-out) so the
// invariants are testable without react-rnd, which happy-dom cannot drive.
// BoxSelect and Rnd windows render as wall-box children, so they convert wall-
// relative DOM via core toPhysicalRect directly; only policy lives here.

describe("clampToWall — keep a physical rect inside [0,0,W,H]", () => {
  const wall = { width: 1000, height: 1000 };

  it("pulls a negative origin back to 0", () => {
    expect(clampToWall({ x: -50, y: -50, width: 100, height: 100 }, wall)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  it("pulls an overflowing origin back so the far edge meets the wall", () => {
    // {950,950,100,100}: 950+100=1050 > 1000 -> clamp to {900,900} (900+100=1000)
    expect(clampToWall({ x: 950, y: 950, width: 100, height: 100 }, wall)).toEqual({
      x: 900,
      y: 900,
      width: 100,
      height: 100,
    });
  });

  it("leaves an in-bounds rect untouched", () => {
    const r = { x: 123, y: 456, width: 100, height: 100 };
    expect(clampToWall(r, wall)).toEqual(r);
  });
});

describe("clampRectToWall — clamp all four edges (resize / box-select)", () => {
  const wall = { width: 1920, height: 1080 };

  it("caps a bottom-right resize that grows past the wall (keeps the top-left)", () => {
    // origin fixed at {320,180}; size grew to 2000x2000 -> right 2320 > 1920, bottom 2180 > 1080
    expect(clampRectToWall({ x: 320, y: 180, width: 2000, height: 2000 }, wall)).toEqual({
      x: 320,
      y: 180,
      width: 1600, // right edge = 1920
      height: 900, // bottom edge = 1080
    });
  });

  it("caps a top-left resize that goes negative (keeps the bottom-right)", () => {
    // bottom-right fixed at {960,540}; origin dragged to {-50,-30}, size grew to match
    expect(clampRectToWall({ x: -50, y: -30, width: 1010, height: 570 }, wall)).toEqual({
      x: 0,
      y: 0,
      width: 960, // right edge 960 preserved
      height: 540, // bottom edge 540 preserved
    });
  });

  it("leaves an in-wall rect untouched", () => {
    const r = { x: 100, y: 100, width: 500, height: 500 };
    expect(clampRectToWall(r, wall)).toEqual(r);
  });
});

describe("isCentreOutside — drag-out-to-remove (ADR-0012)", () => {
  const wall = { width: 1000, height: 1000 };

  it("false when the centre is inside the wall", () => {
    expect(isCentreOutside({ x: 400, y: 400, width: 100, height: 100 }, wall)).toBe(false);
  });

  it("false when the centre sits exactly on the far edge (boundary is inside)", () => {
    // centre {1000,1000} is ON the edge, not past it -> still inside
    expect(isCentreOutside({ x: 950, y: 950, width: 100, height: 100 }, wall)).toBe(false);
  });

  it("true when the centre is dragged past the far edge", () => {
    // {1000,1000,100,100} -> centre {1050,1050} -> outside
    expect(isCentreOutside({ x: 1000, y: 1000, width: 100, height: 100 }, wall)).toBe(true);
  });

  it("true when the centre is dragged past the near (negative) edge", () => {
    expect(isCentreOutside({ x: -200, y: 400, width: 100, height: 100 }, wall)).toBe(true);
  });
});

describe("dragRect — drag converts position (DOM->physical), size stays physical", () => {
  // Regression: onDragStop once built the rect with toPhysicalRect on {d.x, d.y,
  // w.width, w.height}, re-converting the ALREADY-physical size and ballooning the
  // window (640 -> ~2064), which then tripped drag-out removal on the next drag.
  it("converts only the DOM position; the physical size is NOT re-converted", () => {
    // window physical size 640x360; dragged to DOM {160,90}; scale 0.5
    // position: round(160/0.5)=320, round(90/0.5)=180
    // size stays 640, 360 (NOT round(640/0.5)=1280 — that would balloon)
    expect(dragRect({ x: 160, y: 90 }, { width: 640, height: 360 }, 0.5)).toEqual({
      x: 320,
      y: 180,
      width: 640,
      height: 360,
    });
  });
});

describe("isPointOutsideBox — cursor-out drag removal (pointer vs wall viewport rect)", () => {
  const box = { left: 100, top: 50, right: 300, bottom: 200 };

  it("false when the point is inside the box", () => {
    expect(isPointOutsideBox({ x: 200, y: 100 }, box)).toBe(false);
  });

  it("false on the boundary (boundary counts as inside)", () => {
    expect(isPointOutsideBox({ x: 100, y: 50 }, box)).toBe(false); // top-left corner
    expect(isPointOutsideBox({ x: 300, y: 200 }, box)).toBe(false); // bottom-right corner
  });

  it("true past each edge", () => {
    expect(isPointOutsideBox({ x: 99, y: 100 }, box)).toBe(true); // left
    expect(isPointOutsideBox({ x: 301, y: 100 }, box)).toBe(true); // right
    expect(isPointOutsideBox({ x: 200, y: 49 }, box)).toBe(true); // top
    expect(isPointOutsideBox({ x: 200, y: 201 }, box)).toBe(true); // bottom
  });
});

describe("isBelowMinSize — box-select rejection (strictly smaller than min)", () => {
  const min = { width: 200, height: 150 };

  it("false at or above min (allowed to open)", () => {
    expect(isBelowMinSize({ width: 200, height: 150 }, min)).toBe(false); // exactly min
    expect(isBelowMinSize({ width: 500, height: 500 }, min)).toBe(false); // above
  });

  it("true when either axis is strictly below min (rejected)", () => {
    expect(isBelowMinSize({ width: 199, height: 500 }, min)).toBe(true); // width under
    expect(isBelowMinSize({ width: 500, height: 149 }, min)).toBe(true); // height under
    expect(isBelowMinSize({ width: 10, height: 10 }, min)).toBe(true); // both under
  });
});

describe("minSizeToDom — physical minSize -> react-rnd DOM minWidth/minHeight", () => {
  it("converts physical to DOM at the scale (resize floor)", () => {
    // minSize 200x150 physical, scale 0.5 -> DOM 100x75
    expect(minSizeToDom({ width: 200, height: 150 }, 0.5)).toEqual({
      minWidth: 100,
      minHeight: 75,
    });
  });

  it("returns undefined when no minSize (no constraint)", () => {
    expect(minSizeToDom(undefined, 0.5)).toBeUndefined();
  });
});
