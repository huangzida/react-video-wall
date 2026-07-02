// Wall render context (ADR-0008/0009/0013).
//
// VideoWall derives the uniform contain-fit scale + the wall's DOM box every layout
// and publishes them here, so descendants (<Window>, the interaction layer) can
// convert physical <-> DOM at the same scale the wall was rendered with. This is the
// single in-flight scale value per layout (recomputed, never a stale cached ratio).

import { createContext, useContext } from "react";
import type { WallSize } from "./coords";
import type { WallBox } from "./layout";

export interface WallContextValue {
  wall: WallSize;
  scale: number;
  wallBox: WallBox;
}

export const WallContext = createContext<WallContextValue | null>(null);

/** The wall's current render scale (ADR-0008). Throws if used outside a `<VideoWall>`. */
export function useWallScale(): number {
  const ctx = useContext(WallContext);
  if (!ctx) throw new Error("useWallScale: must be used within a <VideoWall>");
  return ctx.scale;
}

/** Full wall context (scale + wall + DOM box). For the interaction layer (ADR-0012). */
export function useWallContext(): WallContextValue {
  const ctx = useContext(WallContext);
  if (!ctx) throw new Error("useWallContext: must be used within a <VideoWall>");
  return ctx;
}
