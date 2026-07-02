import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type PhysicalRect } from "../core/coords";
import { WallContext, type WallContextValue } from "../core/WallContext";
import { BoxSelect } from "./BoxSelect";

// happy-dom does no layout and lacks PointerEvent details the handler path needs.
const OVERLAY_RECT = (): DOMRect =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 480,
    bottom: 270,
    width: 480,
    height: 270,
    toJSON: () => {},
  }) as DOMRect;

const ctxValue: WallContextValue = {
  wall: { width: 1920, height: 1080 },
  scale: 0.5,
  wallBox: { x: 0, y: 0, width: 960, height: 540 },
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <WallContext.Provider value={ctxValue}>{children}</WallContext.Provider>
);

let originalCapture: typeof Element.prototype.setPointerCapture | undefined;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(OVERLAY_RECT);
  originalCapture = Element.prototype.setPointerCapture;
  Element.prototype.setPointerCapture = () => {};
});
afterEach(() => {
  vi.restoreAllMocks();
  if (originalCapture) Element.prototype.setPointerCapture = originalCapture;
  else delete (Element.prototype as Partial<Element>).setPointerCapture;
});

describe("BoxSelect — box-select-to-open (ADR-0012)", () => {
  it("emits the physical, wall-clamped rect on a drag", () => {
    const onAdd = vi.fn();
    const { container } = render(<BoxSelect onAdd={onAdd} />, { wrapper });
    const el = container.firstChild as HTMLElement;
    fireEvent.pointerDown(el, { clientX: 10, clientY: 10, button: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 60, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(el, { pointerId: 1 });
    // wall-relative DOM {10,10,50,50} x scale 0.5 -> physical {20,20,100,100}, in-bounds
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith<PhysicalRect[]>({
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("does not emit on a click without a drag", () => {
    const onAdd = vi.fn();
    const { container } = render(<BoxSelect onAdd={onAdd} />, { wrapper });
    const el = container.firstChild as HTMLElement;
    fireEvent.pointerDown(el, { clientX: 10, clientY: 10, button: 0, pointerId: 1 });
    fireEvent.pointerUp(el, { pointerId: 1 }); // same point -> zero-area
    expect(onAdd).not.toHaveBeenCalled();
  });
});
