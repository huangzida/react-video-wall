// Window shell (ADR-0010).
//
// A Window is a controlled, shell-only rectangle positioned on the wall in
// physical-integer coordinates. The consumer provides the content (a <video>,
// <img>, chart, anything); the library never assumes content type. Geometry is
// the consumer's state — the lib holds none.

import type { CSSProperties, ReactNode } from "react";
import { toDomRect, type PhysicalRect } from "./coords";
import { useWallScale } from "./WallContext";

export interface WindowProps {
  /** Window geometry in physical-integer wall coordinates (origin = wall top-left). */
  rect: PhysicalRect;
  /** Window content — rendered inside the shell (video / image / chart / ...). */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** A rectangular shell positioned on the wall via the current render scale. */
export function Window({ rect, children, className, style }: WindowProps) {
  const scale = useWallScale();
  const dom = toDomRect(rect, scale);
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: dom.x,
        top: dom.y,
        width: dom.width,
        height: dom.height,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
