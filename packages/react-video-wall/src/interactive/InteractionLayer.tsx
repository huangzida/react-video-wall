// InteractionLayer (ADR-0012) — per-window react-rnd wiring.
//
// Renders one controlled <Rnd> per window as a direct child of the wall box, so its
// position/size are wall-relative DOM px and convert via core toPhysicalRect with no
// offset. Gestures cross the DOM<->physical seam exactly here (ADR-0008): drag/resize
// DOM px -> physical -> clamp to wall -> callback. Drag-out: if the user drags a
// window's CENTRE outside the wall (checked on the UNCLAMPED position, before
// clamping would force it back) -> onRemove.

import { Fragment } from "react";
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
  /** Window removed (centre dragged out of the wall). */
  onRemove?: (id: VideoWallWindow["id"]) => void;
  /** Content per window (a <video>, <img>, ...). Default: none. */
  renderWindow?: (w: VideoWallWindow) => ReactNode;
  /** Minimum window size (physical-integer). Resize cannot go below this. Default: none. */
  minSize?: SizeConstraint;
}

export function InteractionLayer({
  windows,
  onMove,
  onResize,
  onRemove,
  renderWindow,
  minSize,
}: InteractionLayerProps) {
  const { wall, scale } = useWallContext();

  return (
    <Fragment>
      {windows.map((w) => {
        const dom = toDomRect({ x: w.x, y: w.y, width: w.width, height: w.height }, scale);
        return (
          <Rnd
            key={w.id}
            className="rvw-window"
            position={{ x: dom.x, y: dom.y }}
            size={{ width: dom.width, height: dom.height }}
            {...(w.z !== undefined ? { zIndex: w.z } : {})}
            bounds="parent"
            {...minSizeToDom(minSize, scale)}
            onDragStop={(e, d) => {
              // The window is constrained to the wall by bounds="parent" (it never
              // leaves during drag). Drag-out removal is POINTER-based: if the cursor is
              // outside the wall at release -> onRemove. Cursor criterion (not window
              // centre) keeps the window on-screen, makes the gesture cancellable
              // (out->back in = no remove), and avoids a mid-drag Rnd unmount.
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
      })}
    </Fragment>
  );
}
