// Core sub-export (ADR-0013): zero-dependency coordinate model, wall/tile model,
// and the <VideoWall> / <Window> renderers. Everything here is dependency-free;
// react-rnd lives only in the "./interactive" sub-export.

export { computeScale, toDom, toDomRect, toPhysical, toPhysicalRect } from "./coords";
export type { DomRect, DomView, PhysicalRect, WallSize } from "./coords";

export { splitWall } from "./splitWall";
export { boundingBox } from "./boundingBox";
export { validateTiles } from "./validateTiles";

export { computeWallLayout } from "./layout";
export type { ContainerSize, WallBox, WallLayout } from "./layout";

export { VideoWall } from "./VideoWall";
export type { VideoWallProps } from "./VideoWall";
export { Window } from "./Window";
export type { WindowProps } from "./Window";
export { WallContext, useWallContext, useWallScale } from "./WallContext";
export type { WallContextValue } from "./WallContext";
