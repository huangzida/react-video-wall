// Interactive sub-export (ADR-0012/0013).
//
// Opt-in layer on top of the core <VideoWall>/<Window> renderers: box-select-to-open,
// drag / resize (react-rnd, a peerDependency), and drag-out-to-remove. react-rnd is
// externalized (ADR-0013) so importing the core "." never pulls it — only this
// sub-export does.

export { BoxSelect } from "./BoxSelect";
export type { BoxSelectProps } from "./BoxSelect";

export { InteractionLayer } from "./InteractionLayer";
export type { InteractionLayerProps, VideoWallWindow } from "./InteractionLayer";

export { VideoWallEditor } from "./VideoWallEditor";
export type { VideoWallEditorProps } from "./VideoWallEditor";

export { useDragOut } from "./useDragOut";

// Policy utils of the DOM<->physical seam, for consumers building custom interaction.
export {
  clampRectToWall,
  clampToWall,
  isBelowMinSize,
  isCentreOutside,
  isPointOutsideBox,
  minSizeToDom,
} from "./geometry";
export type { SizeConstraint } from "./geometry";
