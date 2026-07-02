import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toPhysicalRect, type PhysicalRect } from "../core/coords";
import { useWallContext } from "../core/WallContext";
import { clampRectToWall, isBelowMinSize, type SizeConstraint } from "./geometry";

export interface BoxSelectProps {
  /** Emitted (physical-integer, wall-clamped) when a non-empty selection completes. */
  onAdd: (rect: PhysicalRect) => void;
  /** Optional minimum window size (physical-integer). A selection smaller than this is
   * rejected (no onAdd) — prevents opening tiny windows. */
  minSize?: SizeConstraint;
  className?: string;
  style?: CSSProperties;
}

export function BoxSelect({ onAdd, minSize, className, style }: BoxSelectProps) {
  const { wall, scale } = useWallContext();
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [cur, setCur] = useState<{ x: number; y: number } | null>(null);

  const local = (clientX: number, clientY: number) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // ponytail: left-button only; add modifiers if needed later
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e.clientX, e.clientY);
    setStart(p);
    setCur(p);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!start) return;
    setCur(local(e.clientX, e.clientY));
  };
  const onPointerUp = () => {
    if (!start || !cur) {
      setStart(null);
      setCur(null);
      return;
    }
    const dom = {
      x: Math.min(start.x, cur.x),
      y: Math.min(start.y, cur.y),
      width: Math.abs(cur.x - start.x),
      height: Math.abs(cur.y - start.y),
    };
    setStart(null);
    setCur(null);
    if (dom.width <= 0 || dom.height <= 0) return; // a click, not a drag
    const rect = clampRectToWall(toPhysicalRect(dom, scale), wall);
    if (minSize && isBelowMinSize(rect, minSize)) return; // too small -> don't open
    onAdd(rect);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "crosshair",
        touchAction: "none",
        ...style,
      }}
    >
      {start && cur && (
        <div
          style={{
            position: "absolute",
            left: Math.min(start.x, cur.x),
            top: Math.min(start.y, cur.y),
            width: Math.abs(cur.x - start.x),
            height: Math.abs(cur.y - start.y),
            border: "1px dashed rgba(0, 120, 215, 0.8)",
            background: "rgba(0, 120, 215, 0.12)",
          }}
        />
      )}
    </div>
  );
}
