import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("defaults count to 0", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments and decrements by step", () => {
    const { result } = renderHook(() => useCounter(10, 2));

    act(() => result.current.inc());
    expect(result.current.count).toBe(12);

    act(() => result.current.dec());
    expect(result.current.count).toBe(10);
  });

  it("resets to the initial value", () => {
    const { result } = renderHook(() => useCounter(5, 3));

    act(() => result.current.inc());
    act(() => result.current.reset());
    expect(result.current.count).toBe(5);
  });
});
