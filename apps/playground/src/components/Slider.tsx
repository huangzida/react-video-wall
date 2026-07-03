// Large rounded-rect slider: label inside-left, value inside-right. No knob — the
// bright (left of value) and dark (right of value) luminance regions meet at the
// current value, so their hard edge IS the handle position. Monochrome luminance,
// not a color gradient.
//
// Pointer-driven (not a native range thumb): the whole bar is the drag surface, so
// there is no fragile appearance-none thumb to collapse. Click anywhere jumps;
// drag tracks; keyboard (arrows/PgUp/PgDn/Home/End) + role=slider keep it a11y-safe.
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./Slider.module.css";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const span = max - min;
  const pct = span > 0 ? ((value - min) / span) * 100 : 0;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const setValueFromX = (clientX: number) => {
    const el = barRef.current;
    if (!el || span <= 0) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const snapped = Math.round((min + ratio * span) / step) * step;
    const next = clamp(Math.round(snapped));
    if (next !== value) onChange(next);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // left-button only
    e.currentTarget.setPointerCapture(e.pointerId);
    setValueFromX(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!(e.buttons & 1)) return; // only while dragging
    setValueFromX(e.clientX);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const bigStep = Math.max(step, Math.round(span / 10));
    let next: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + step;
    else if (e.key === "PageDown") next = value - bigStep;
    else if (e.key === "PageUp") next = value + bigStep;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    onChange(clamp(Math.round(next / step) * step));
  };

  return (
    <div
      ref={barRef}
      className={styles.slider}
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  );
}
