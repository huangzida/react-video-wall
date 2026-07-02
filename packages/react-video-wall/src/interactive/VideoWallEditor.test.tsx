import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { splitWall } from "../core/splitWall";
import { VideoWallEditor } from "./VideoWallEditor";

const WALL = { width: 1920, height: 1080 };
// container 960x600 -> scale 0.5.
const SIZE = (): DOMRect =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 960,
    bottom: 600,
    width: 960,
    height: 600,
    toJSON: () => {},
  }) as DOMRect;

let originalRO: typeof ResizeObserver | undefined;
beforeEach(() => {
  originalRO = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(SIZE);
});
afterEach(() => {
  vi.restoreAllMocks();
  if (originalRO) globalThis.ResizeObserver = originalRO;
});

// Light smoke test: react-rnd <Rnd> renders one element per controlled window inside
// the composed editor. The drag/resize/drag-out INVARIANTS are proven at the pure
// geometry/coords level (happy-dom cannot drive react-rnd gestures meaningfully).

describe("VideoWallEditor composition (ADR-0013)", () => {
  it("renders tiles + one window per controlled window", () => {
    const { container } = render(
      <VideoWallEditor
        wall={WALL}
        tiles={splitWall(WALL, 2, 2)}
        windows={[
          { id: "a", x: 0, y: 0, width: 960, height: 540 },
          { id: "b", x: 960, y: 540, width: 960, height: 540 },
        ]}
      />,
    );
    expect(container.querySelectorAll(".rvw-tile")).toHaveLength(4);
    expect(container.querySelectorAll(".rvw-window")).toHaveLength(2);
  });

  it("does not render the box-select overlay when onAdd is absent", () => {
    const { container } = render(
      <VideoWallEditor wall={WALL} tiles={splitWall(WALL, 2, 2)} windows={[]} />,
    );
    // BoxSelect overlay has cursor: crosshair; absent without onAdd
    expect(container.querySelector('[style*="crosshair"]')).toBeNull();
  });
});
