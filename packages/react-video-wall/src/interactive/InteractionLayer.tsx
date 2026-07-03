// InteractionLayer (ADR-0012) — per-window react-rnd wiring.
//
// Renders one controlled <Rnd> per window as a direct child of the wall box, so its
// position/size are wall-relative DOM px and convert via core toPhysicalRect with no
// offset. Gestures cross the DOM<->physical seam exactly here (ADR-0008): drag/resize
// DOM px -> physical -> clamp to wall -> callback. Drag-out: if the user drags a
// window's cursor outside the wall at release -> onRemove.
//
// Drag smoothness relies on the controlled `position` staying NUMERICALLY constant
// mid-drag (react-draggable's getDerivedStateFromProps has no dragging-guard, so any
// re-render that changes position snaps the element back, losing the grab point). That
// holds here because: (1) the wall container has a stable size (consumer app-shell ->
// the contain-fit `scale` does not recompute mid-drag), so `dom` is constant; (2) each
// window is its own memoized <RndWindow> with no per-frame state, so neither it nor
// the parent re-renders during a drag. With position constant, react-draggable drives
// the transform natively each frame and the grab point is preserved — no draft, no
// extra React round-trip per pointermove.

import { Fragment, memo } from "react";
import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import { toDomRect, toPhysicalRect, type PhysicalRect } from "../core/coords";
import { useWallContext } from "../core/WallContext";
import {
  clampRectToWall,
  clampToWall,
  dragRect,
  isPointOutsideBox,
  minSizeToDom,
  type SizeConstraint,
} from "./geometry";

/** A controlled window on the wall (ADR-0010): geometry + a stable id (+ optional z). */
export interface VideoWallWindow {
  id: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  z?: number;
}

export interface InteractionLayerProps {
  windows: VideoWallWindow[];
  /** Window moved (drag stop). Receives the new wall-clamped physical rect. */
  onMove?: (id: VideoWallWindow["id"], rect: PhysicalRect) => void;
  /** Window resized. Receives the new wall-clamped physical rect. */
  onResize?: (id: VideoWallWindow["id"], rect: PhysicalRect) => void;
  /** Window removed (cursor dragged out of the wall at release). */
  onRemove?: (id: VideoWallWindow["id"]) => void;
  /** Content per window (a <video>, <img>, ...). Default: none. */
  renderWindow?: (w: VideoWallWindow) => ReactNode;
  /** Minimum window size (physical-integer). Resize cannot go below this. Default: none. */
  minSize?: SizeConstraint;
}

type WindowCallbacks = Pick<
  InteractionLayerProps,
  "onMove" | "onResize" | "onRemove" | "renderWindow" | "minSize"
>;

/** One draggable/resizable window, memoized so a sibling's edit/add doesn't re-render
 * the others. It holds no per-frame state: during a drag nothing here re-renders, which
 * keeps the controlled `position` constant and lets react-draggable drive the transform
 * natively (smooth, grab point preserved). */
const RndWindow = memo(function RndWindow({
  w,
  onMove,
  onResize,
  onRemove,
  renderWindow,
  minSize,
}: WindowCallbacks & { w: VideoWallWindow }) {
  const { wall, scale } = useWallContext();
  const dom = toDomRect({ x: w.x, y: w.y, width: w.width, height: w.height }, scale);

  return (
    <Rnd
      className="rvw-window"
      position={{ x: dom.x, y: dom.y }}
      size={{ width: dom.width, height: dom.height }}
      {...(w.z !== undefined ? { style: { zIndex: w.z } } : {})}
      bounds="parent"
      {...minSizeToDom(minSize, scale)}
      onDragStop={(e, d) => {
        // The window is constrained to the wall by bounds="parent" (it never leaves
        // during drag). Drag-out removal is POINTER-based: if the cursor is outside the
        // wall at release -> onRemove. Cursor criterion (not window centre) keeps the
        // window on-screen, makes the gesture cancellable (out->back in = no remove),
        // and avoids a mid-drag Rnd unmount.
        const wallEl = d.node.closest(".rvw-wall") as HTMLElement | null;
        const rect = wallEl?.getBoundingClientRect();
        const cursor = e as unknown as { clientX: number; clientY: number };
        if (
          rect &&
          isPointOutsideBox(
            { x: cursor.clientX, y: cursor.clientY },
            { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
          )
        ) {
          onRemove?.(w.id);
        } else {
          // dragRect: convert the DOM position to physical, keep the (physical) size.
          onMove?.(
            w.id,
            clampToWall(
              dragRect({ x: d.x, y: d.y }, { width: w.width, height: w.height }, scale),
              wall,
            ),
          );
        }
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        const resized = toPhysicalRect(
          {
            x: pos.x,
            y: pos.y,
            width: (ref as HTMLElement).offsetWidth,
            height: (ref as HTMLElement).offsetHeight,
          },
          scale,
        );
        onResize?.(w.id, clampRectToWall(resized, wall));
      }}
    >
      {renderWindow?.(w)}
    </Rnd>
  );
});

export function InteractionLayer({
  windows,
  onMove,
  onResize,
  onRemove,
  renderWindow,
  minSize,
}: InteractionLayerProps) {
  return (
    <Fragment>
      {windows.map((w) => (
        <RndWindow
          key={w.id}
          w={w}
          onMove={onMove}
          onResize={onResize}
          onRemove={onRemove}
          renderWindow={renderWindow}
          minSize={minSize}
        />
      ))}
    </Fragment>
  );
}
