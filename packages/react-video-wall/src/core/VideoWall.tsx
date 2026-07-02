// <VideoWall> renderer (ADR-0009).
//
// Maps the authoritative physical-integer wall to the DOM at the current contain-fit
// scale. Measures its container, derives the layout (scale + centred wall box) via
// computeWallLayout, renders tiles with CSS borders (NOT gaps — ADR-0009), and
// publishes scale via context so <Window> and the interaction layer share one
// in-flight scale. Tile partitions are validated at this boundary (ADR-0009).

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { toDomRect, type PhysicalRect, type WallSize } from "./coords";
import { computeWallLayout, type ContainerSize } from "./layout";
import { validateTiles } from "./validateTiles";
import { WallContext, type WallContextValue } from "./WallContext";

export interface VideoWallProps {
  /** The authoritative wall, in physical-integer pixels (origin 0,0). */
  wall: WallSize;
  /** Tiles that must exactly partition the wall (ADR-0009). Use splitWall() to build them. */
  tiles: PhysicalRect[];
  /** Padding (DOM px) inside the container on every side. Default 0. */
  padding?: number;
  /** Windows (or any content) rendered inside the wall box, above the tiles. */
  children?: ReactNode;
  /** Render-prop placing custom content inside tile `i` (background per tile). */
  renderTile?: (tile: PhysicalRect, index: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function VideoWall({
  wall,
  tiles,
  padding = 0,
  children,
  renderTile,
  className,
  style,
}: VideoWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ width: r.width, height: r.height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return; // ponytail: non-DOM/SSR guard
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ADR-0009 boundary check: tiles must exactly partition the wall (throws on violation).
  validateTiles(tiles, wall);

  const { scale, wallBox } = computeWallLayout(wall, containerSize, padding);
  const ctx: WallContextValue = { wall, scale, wallBox };

  return (
    <WallContext.Provider value={ctx}>
      <div
        ref={containerRef}
        className={className ? `rvw-container ${className}` : "rvw-container"}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          ...style,
        }}
      >
        {scale > 0 && (
          <div
            className="rvw-wall"
            style={{
              position: "absolute",
              left: wallBox.x,
              top: wallBox.y,
              width: wallBox.width,
              height: wallBox.height,
            }}
          >
            {tiles.map((tile, i) => {
              const dom = toDomRect(tile, scale);
              return (
                <div
                  key={i}
                  className="rvw-tile"
                  style={{
                    position: "absolute",
                    left: dom.x,
                    top: dom.y,
                    width: dom.width,
                    height: dom.height,
                    // border-box keeps the border INSIDE the tile rect so the outer edge
                    // stays at its coordinate -> adjacent tiles meet at the seam with no
                    // coordinate gap or shift (ADR-0009).
                    boxSizing: "border-box",
                  }}
                >
                  {renderTile?.(tile, i)}
                </div>
              );
            })}
            {children}
          </div>
        )}
      </div>
    </WallContext.Provider>
  );
}
