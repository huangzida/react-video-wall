// Interaction-layer geometry helpers (ADR-0012).
//
// The DOM<->physical seam lives here. These are the pure, react-rnd-free policy
// functions the interaction components are thin shells over: clamping a physical
// rect to the wall and detecting drag-out (centre exits). Both BoxSelect and the
// Rnd windows render as children of the wall box, so their pointer/gesture coords
// are already wall-relative DOM -> they convert via core toPhysicalRect directly
// (no offset handling needed here).

import { toDom, toPhysical, type PhysicalRect, type WallSize } from "../core/coords";

/**
 * Clamp a rect's origin so it stays within [0,0,W,H] (the far edge may still
 * meet the wall exactly). Keeps the SIZE — correct for DRAG (a move never resizes).
 * Best-effort when the rect is larger than the wall (origin 0).
 */
export function clampToWall(rect: PhysicalRect, wall: WallSize): PhysicalRect {
  const x = Math.max(0, Math.min(rect.x, wall.width - rect.width));
  const y = Math.max(0, Math.min(rect.y, wall.height - rect.height));
  return { ...rect, x, y };
}

/**
 * Clamp ALL FOUR edges of a rect into [0,0,W,H] — the rect may SHRINK to fit. Use this
 * for RESIZE and box-select-create: it caps the far edge so a window can never grow or
 * be placed past the wall. (clampToWall keeps the size and clamps only the origin,
 * which is right for drag but WRONG for resize — a bottom-right pull would overflow.)
 */
export function clampRectToWall(rect: PhysicalRect, wall: WallSize): PhysicalRect {
  const left = Math.max(0, rect.x);
  const top = Math.max(0, rect.y);
  const right = Math.min(wall.width, rect.x + rect.width);
  const bottom = Math.min(wall.height, rect.y + rect.height);
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/** ADR-0012 drag-out: true when the window CENTRE has exited the wall rect. */
export function isCentreOutside(rect: PhysicalRect, wall: WallSize): boolean {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return cx < 0 || cx > wall.width || cy < 0 || cy > wall.height;
}

/**
 * True when a point lies outside a box (any edge). Used for cursor-out drag removal:
 * the window stays clamped inside the wall during drag (bounds=parent), and removal
 * fires when the POINTER is outside the wall at drag-release — so the window itself
 * never flies off-screen, the gesture is cancellable, and there's no mid-drag unmount.
 * (`box` is a viewport rect from getBoundingClientRect; `point` is clientX/clientY.)
 */
export function isPointOutsideBox(
  point: { x: number; y: number },
  box: { left: number; top: number; right: number; bottom: number },
): boolean {
  return point.x < box.left || point.x > box.right || point.y < box.top || point.y > box.bottom;
}

/**
 * Resolve a window's physical rect after a DRAG. The gesture gives a new DOM position
 * (wall-relative), which converts to physical; the SIZE is already physical and must NOT
 * re-convert — a drag moves, it never resizes. (Passing the size through toPhysicalRect
 * here would double-convert it and make the window balloon — a real bug we regressed on.)
 */
export function dragRect(
  domPos: { x: number; y: number },
  physSize: { width: number; height: number },
  scale: number,
): PhysicalRect {
  return {
    x: toPhysical(domPos.x, scale),
    y: toPhysical(domPos.y, scale),
    width: physSize.width,
    height: physSize.height,
  };
}

/** A min/max size constraint, in physical-integer pixels (matches the wall's grid). */
export interface SizeConstraint {
  width: number;
  height: number;
}

/**
 * True when a physical rect is STRICTLY smaller than minSize on either axis (a rect AT
 * minSize is allowed). Used by box-select: a selection below min does not open a window.
 */
export function isBelowMinSize(
  rect: { width: number; height: number },
  min: SizeConstraint,
): boolean {
  return rect.width < min.width || rect.height < min.height;
}

/**
 * Convert a physical minSize to the DOM-px {minWidth, minHeight} react-rnd's <Rnd>
 * expects (it constrains the resize handle). Returns undefined when no minSize is set
 * (no constraint). Physical->DOM, never the reverse — passing physical as DOM would
 * make the floor ~1/scale off (the unit-mixup class).
 */
export function minSizeToDom(
  minSize: SizeConstraint | undefined,
  scale: number,
): { minWidth: number; minHeight: number } | undefined {
  if (!minSize) return undefined;
  return { minWidth: toDom(minSize.width, scale), minHeight: toDom(minSize.height, scale) };
}
