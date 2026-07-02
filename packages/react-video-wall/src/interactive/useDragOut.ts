import { useCallback } from "react";
import type { PhysicalRect } from "../core/coords";
import { useWallContext } from "../core/WallContext";
import { isCentreOutside } from "./geometry";

/**
 * Returns a stable predicate `(rect) => boolean` that's true when the rect's centre
 * has exited the wall (ADR-0012 drag-out-to-remove). Reads the wall from context.
 */
export function useDragOut(): (rect: PhysicalRect) => boolean {
  const { wall } = useWallContext();
  return useCallback((rect: PhysicalRect) => isCentreOutside(rect, wall), [wall]);
}
