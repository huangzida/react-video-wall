import { describe, expect, it } from "vitest";
import {
  computeScale,
  toDom,
  toDomRect,
  toPhysical,
  toPhysicalRect,
  type DomView,
  type PhysicalRect,
  type WallSize,
} from "./coords";

// ADR-0008: physical-integer coordinates are authoritative; DOM px are a derived,
// scaled view. The headline guarantee is the LOSSLESS ROUND-TRIP
// toPhysical(toDom(phys)) === phys for integer physical rects. These tests encode
// that invariant plus contain-fit scale derivation (ADR-0009).

describe("computeScale", () => {
  const wall: WallSize = { width: 1920, height: 1080 };

  it("is the contain-fit min of the per-axis ratios (width binds)", () => {
    // 960/1920 = 0.5, 600/1080 = 0.5556 -> min = 0.5 (width is the binding axis)
    expect(computeScale(wall, { width: 960, height: 600 })).toBeCloseTo(0.5, 10);
  });

  it("is the contain-fit min (height binds)", () => {
    // 2000/1920 = 1.0417, 540/1080 = 0.5 -> min = 0.5 (height is the binding axis)
    expect(computeScale(wall, { width: 2000, height: 540 })).toBeCloseTo(0.5, 10);
  });
});

describe("ADR-0008 lossless round-trip", () => {
  it("toPhysical(toDom(phys)) === phys for integer rects (width-binding scale)", () => {
    // wall 1920x1080, domView 960x540 -> uniform scale 0.5 (both axes bind equally).
    const scale = computeScale({ width: 1920, height: 1080 }, { width: 960, height: 540 });
    expect(scale).toBeCloseTo(0.5, 10);

    const phys: PhysicalRect = { x: 137, y: 999, width: 512, height: 7 };
    // expected == the integers we put in (independent truth), not a recomputation
    expect(toPhysicalRect(toDomRect(phys, scale), scale)).toEqual(phys);
  });

  it("holds on BOTH axes including the NON-binding axis (height binds)", () => {
    // The subtle case ADR-0008 must honour under contain-fit (ADR-0009):
    // wall 10000x6000, domView 1280x720 -> scale = min(0.128, 0.12) = 0.12.
    // Height binds, so the WIDTH axis is non-binding. The round-trip on x still
    // holds because toPhysical divides by the SAME uniform scale toDom used.
    const wall: WallSize = { width: 10000, height: 6000 };
    const domView: DomView = { width: 1280, height: 720 };
    const scale = computeScale(wall, domView);
    expect(scale).toBeCloseTo(0.12, 10);

    const phys: PhysicalRect = { x: 9999, y: 1, width: 4242, height: 5999 };
    expect(toPhysicalRect(toDomRect(phys, scale), scale)).toEqual(phys);
  });

  it("holds for every integer rect on a fine grid across the whole wall", () => {
    // Exhaustive-ish: sweep a non-divisible wall + odd domView, many rects.
    const scale = computeScale({ width: 3840, height: 2160 }, { width: 1000, height: 777 });
    for (let x = 0; x < 3840; x += 7) {
      for (let y = 0; y < 2160; y += 13) {
        const phys: PhysicalRect = { x, y, width: 11, height: 23 };
        expect(toPhysicalRect(toDomRect(phys, scale), scale)).toEqual(phys);
        expect(toPhysical(toDom(phys.x, scale), scale)).toBe(phys.x);
        expect(toPhysical(toDom(phys.y, scale), scale)).toBe(phys.y);
        expect(toPhysical(toDom(phys.width, scale), scale)).toBe(phys.width);
        expect(toPhysical(toDom(phys.height, scale), scale)).toBe(phys.height);
      }
    }
  }, 20000); // exhaustive sweep (~91k rects) — intentionally heavy; needs headroom under load
});

describe("toPhysical snaps to the physical grid", () => {
  it("rounds a DOM delta to the nearest physical integer", () => {
    const scale = computeScale({ width: 1920, height: 1080 }, { width: 960, height: 540 });
    // 1 physical px = 0.5 DOM px at scale 0.5.
    expect(toPhysical(0.0, scale)).toBe(0);
    expect(toPhysical(0.24, scale)).toBe(0); // below 0.5 dom -> 0 phys
    expect(toPhysical(0.3, scale)).toBe(1); // rounds up to 1 phys
    expect(toPhysical(1.0, scale)).toBe(2); // exactly 2 phys
  });
});
