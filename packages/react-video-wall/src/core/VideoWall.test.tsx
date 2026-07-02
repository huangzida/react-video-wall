import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhysicalRect, WallSize } from "./coords";
import { splitWall } from "./splitWall";
import { VideoWall } from "./VideoWall";
import { Window } from "./Window";

const WALL: WallSize = { width: 1920, height: 1080 };
// container 960x600 -> scale min(960/1920, 600/1080) = 0.5 (width binds); wall DOM 960x540,
// centred vertically -> wall box top 30.
const SIZE_960x600 = (): DOMRect =>
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
const SIZE_0x0 = (): DOMRect =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => {},
  }) as DOMRect;

let originalRO: typeof ResizeObserver | undefined;

beforeEach(() => {
  // happy-dom ships no ResizeObserver and does no layout; provide both.
  originalRO = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(SIZE_960x600);
});
afterEach(() => {
  vi.restoreAllMocks();
  if (originalRO) globalThis.ResizeObserver = originalRO;
});

describe("VideoWall renderer (ADR-0009)", () => {
  it("renders one positioned tile div per tile (borders, not gaps)", () => {
    const tiles = splitWall(WALL, 2, 2); // 4 tiles, each 960x540 phys
    const { container } = render(<VideoWall wall={WALL} tiles={tiles} />);
    const tileEls = container.querySelectorAll<HTMLElement>(".rvw-tile");
    expect(tileEls).toHaveLength(4);

    // tile[0] {0,0,960,540} x scale 0.5 -> dom {0,0,480,270}
    expect(tileEls[0].style.left).toBe("0px");
    expect(tileEls[0].style.top).toBe("0px");
    expect(tileEls[0].style.width).toBe("480px");
    expect(tileEls[0].style.height).toBe("270px");
    // tile[1] {960,0,960,540} -> dom left 480
    expect(tileEls[1].style.left).toBe("480px");
    // border-box keeps the border INSIDE the rect so coords never shift (ADR-0009)
    expect(tileEls[0].style.boxSizing).toBe("border-box");
  });

  it("centres the wall box (letterbox) when the aspects differ", () => {
    const { container } = render(<VideoWall wall={WALL} tiles={splitWall(WALL, 2, 2)} />);
    const wallEl = container.querySelector<HTMLElement>(".rvw-wall");
    // wallDom 960x540 centred in 960x600 -> left 0, top 30
    expect(wallEl!.style.left).toBe("0px");
    expect(wallEl!.style.top).toBe("30px");
    expect(wallEl!.style.width).toBe("960px");
    expect(wallEl!.style.height).toBe("540px");
  });

  it("positions a child Window via the wall scale context (ADR-0008/0010)", () => {
    const { container } = render(
      <VideoWall wall={WALL} tiles={splitWall(WALL, 2, 2)}>
        <Window className="mywin" rect={{ x: 100, y: 100, width: 500, height: 500 }}>
          <span>src</span>
        </Window>
      </VideoWall>,
    );
    const win = container.querySelector<HTMLElement>(".mywin");
    expect(win).not.toBeNull();
    // rect {100,100,500,500} x scale 0.5 -> {50,50,250,250}
    expect(win!.style.left).toBe("50px");
    expect(win!.style.top).toBe("50px");
    expect(win!.style.width).toBe("250px");
    expect(win!.style.height).toBe("250px");
  });

  it("rejects tiles that do not exactly partition the wall (ADR-0009 boundary)", () => {
    const bad: PhysicalRect[] = [{ x: 0, y: 0, width: 100, height: 1080 }]; // leaves a gap
    expect(() => render(<VideoWall wall={WALL} tiles={bad} />)).toThrow(/validateTiles/);
  });

  it("renders nothing until the container is measured (scale 0)", () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(SIZE_0x0);
    const { container } = render(<VideoWall wall={WALL} tiles={splitWall(WALL, 2, 2)} />);
    expect(container.querySelectorAll(".rvw-tile")).toHaveLength(0);
  });
});
