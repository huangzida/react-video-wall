import { describe, expect, it } from "vitest";
import { computeWallLayout } from "./layout";

// ADR-0009: render is contain-fit with padding. The wall's DOM box is
// `phys x scale` (uniform contain-fit), centred in the padded view (letterboxing
// expected when aspect ratios differ). This pure seam carries the layout math so
// VideoWall stays a thin measurement shell; it is the testable inverse of rendering.

describe("computeWallLayout — contain-fit + centering", () => {
  it("width binds: wall letterboxes vertically inside the container", () => {
    // wall 1920x1080, container 960x600 (no padding):
    // scale = min(960/1920=0.5, 600/1080=0.5556) = 0.5 (width binds)
    // wallDom = 960x540; centred: x=(960-960)/2=0, y=(600-540)/2=30
    const layout = computeWallLayout({ width: 1920, height: 1080 }, { width: 960, height: 600 }, 0);
    expect(layout.scale).toBeCloseTo(0.5, 10);
    expect(layout.wallBox).toEqual({ x: 0, y: 30, width: 960, height: 540 });
  });

  it("height binds: wall letterboxes horizontally", () => {
    // wall 1920x1080, container 2000x540:
    // scale = min(2000/1920=1.0417, 540/1080=0.5) = 0.5 (height binds)
    // wallDom = 960x540; centred: x=(2000-960)/2=520, y=(540-540)/2=0
    const layout = computeWallLayout(
      { width: 1920, height: 1080 },
      { width: 2000, height: 540 },
      0,
    );
    expect(layout.scale).toBeCloseTo(0.5, 10);
    expect(layout.wallBox).toEqual({ x: 520, y: 0, width: 960, height: 540 });
  });

  it("accounts for padding (the view = container minus padding, then centre)", () => {
    // wall 1000x1000, container 500x500, padding 50 -> view 400x400
    // scale = min(400/1000, 400/1000) = 0.4; wallDom = 400x400
    // centred in view: x = 50 + (400-400)/2 = 50, y = 50
    const layout = computeWallLayout(
      { width: 1000, height: 1000 },
      { width: 500, height: 500 },
      50,
    );
    expect(layout.scale).toBeCloseTo(0.4, 10);
    expect(layout.wallBox).toEqual({ x: 50, y: 50, width: 400, height: 400 });
  });

  it("equal aspect: wall fills the view, no letterbox", () => {
    // wall 100x100, container 200x200 -> scale 2, wallDom 200x200, centred at 0,0
    const layout = computeWallLayout({ width: 100, height: 100 }, { width: 200, height: 200 }, 0);
    expect(layout.scale).toBe(2);
    expect(layout.wallBox).toEqual({ x: 0, y: 0, width: 200, height: 200 });
  });

  it("degenerate (view <= 0 after padding) yields scale 0 and a zero wall box", () => {
    // container 80x80, padding 50 -> view would be -20x-20 (negative). Must not NaN.
    const layout = computeWallLayout({ width: 1920, height: 1080 }, { width: 80, height: 80 }, 50);
    expect(layout.scale).toBe(0);
    expect(layout.wallBox).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });
});
