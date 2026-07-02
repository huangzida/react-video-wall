import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { WallContext } from "../core/WallContext";
import type { WallContextValue } from "../core/WallContext";
import { useDragOut } from "./useDragOut";

const ctxValue: WallContextValue = {
  wall: { width: 1000, height: 1000 },
  scale: 1,
  wallBox: { x: 0, y: 0, width: 1000, height: 1000 },
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <WallContext.Provider value={ctxValue}>{children}</WallContext.Provider>
);

describe("useDragOut — centre-exits-wall predicate (ADR-0012)", () => {
  it("returns false while the centre stays inside the wall", () => {
    const { result } = renderHook(() => useDragOut(), { wrapper });
    expect(result.current({ x: 400, y: 400, width: 100, height: 100 })).toBe(false);
  });

  it("returns true once the centre is dragged past the wall edge", () => {
    const { result } = renderHook(() => useDragOut(), { wrapper });
    expect(result.current({ x: 1000, y: 1000, width: 100, height: 100 })).toBe(true);
  });
});
