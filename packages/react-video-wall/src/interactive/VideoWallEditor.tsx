// VideoWallEditor (ADR-0013) — one-line convenience composition.
//
// Composes the core <VideoWall> with the interaction layer: box-select-to-open
// (BoxSelect) + drag/resize/drag-out (InteractionLayer). Consumers wanting control
// compose the primitives directly. Windows are a controlled prop (ADR-0010); every
// change is reported up via callbacks.

import type { CSSProperties, ReactNode } from "react";
import type { PhysicalRect, WallSize } from "../core";
import { VideoWall } from "../core";
import { BoxSelect } from "./BoxSelect";
import { InteractionLayer, type VideoWallWindow } from "./InteractionLayer";
import type { SizeConstraint } from "./geometry";

export interface VideoWallEditorProps {
  wall: WallSize;
  tiles: PhysicalRect[];
  windows: VideoWallWindow[];
  padding?: number;
  /** A box-selection completed -> open a new window at this physical rect. */
  onAdd?: (rect: PhysicalRect) => void;
  onMove?: (id: VideoWallWindow["id"], rect: PhysicalRect) => void;
  onResize?: (id: VideoWallWindow["id"], rect: PhysicalRect) => void;
  onRemove?: (id: VideoWallWindow["id"]) => void;
  renderTile?: (tile: PhysicalRect, index: number) => ReactNode;
  renderWindow?: (w: VideoWallWindow) => ReactNode;
  /** Minimum window size (physical-integer): box-select below this won't open; resize
   * can't go below this. Default: none. */
  minSize?: SizeConstraint;
  className?: string;
  style?: CSSProperties;
}

export function VideoWallEditor({
  wall,
  tiles,
  windows,
  padding,
  onAdd,
  onMove,
  onResize,
  onRemove,
  renderTile,
  renderWindow,
  minSize,
  className,
  style,
}: VideoWallEditorProps) {
  return (
    <VideoWall
      wall={wall}
      tiles={tiles}
      padding={padding}
      renderTile={renderTile}
      className={className}
      style={style}
    >
      {/* BoxSelect before InteractionLayer so windows render above it (later = on top);
          tiles are pointer-events:none so empty-area events reach the overlay. */}
      {onAdd && <BoxSelect onAdd={onAdd} minSize={minSize} />}
      <InteractionLayer
        windows={windows}
        onMove={onMove}
        onResize={onResize}
        onRemove={onRemove}
        renderWindow={renderWindow}
        minSize={minSize}
      />
    </VideoWall>
  );
}
