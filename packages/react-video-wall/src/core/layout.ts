// Contain-fit layout derivation — ADR-0009.
//
// Pure seam for the wall renderer: given the authoritative physical wall, the
// measured container, and padding, derive the uniform contain-fit scale (ADR-0008)
// and the wall's centred DOM box (letterbox offset). VideoWall is a thin measurement
// shell around this; all layout math lives here so it is unit-testable without a DOM.

import { computeScale, type WallSize } from "./coords";

/** A measured container size, in DOM pixels. */
export interface ContainerSize {
  width: number;
  height: number;
}

/** The wall's centred DOM box (origin = container top-left). */
export interface WallBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A resolved render layout: the scale plus the wall's DOM box in the container. */
export interface WallLayout {
  scale: number;
  wallBox: WallBox;
}

/**
 * Contain-fit the wall into the container (minus padding on every side), then centre
 * it (letterboxing the slack). Returns scale 0 and a zero box if the padded view is
 * not positive (degenerate container) so callers never divide by zero / NaN.
 */
export function computeWallLayout(
  wall: WallSize,
  container: ContainerSize,
  padding: number,
): WallLayout {
  const viewW = container.width - padding * 2;
  const viewH = container.height - padding * 2;

  if (viewW <= 0 || viewH <= 0) {
    return { scale: 0, wallBox: { x: padding, y: padding, width: 0, height: 0 } };
  }

  const scale = computeScale(wall, { width: viewW, height: viewH });
  const wallW = wall.width * scale;
  const wallH = wall.height * scale;
  return {
    scale,
    wallBox: {
      x: padding + (viewW - wallW) / 2,
      y: padding + (viewH - wallH) / 2,
      width: wallW,
      height: wallH,
    },
  };
}
