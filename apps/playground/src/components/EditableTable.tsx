// Editable window table — the source of truth (Q7). Per-cell local draft lets the
// user type freely; numeric commits round-but-don't-clamp (so out-of-wall values
// show as cropped + red), blur clamps back. Row <-> window highlight via onSelect.
import { useState, type KeyboardEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { WallSize } from "react-video-wall";
import type { SizeConstraint, VideoWallWindow } from "react-video-wall/interactive";
import styles from "./EditableTable.module.css";

type NumField = "x" | "y" | "width" | "height";
type Field = NumField | "z";

export interface EditableTableProps {
  windows: VideoWallWindow[];
  wall: WallSize;
  minSize: SizeConstraint;
  highlightedId: VideoWallWindow["id"] | null;
  onChange: (id: VideoWallWindow["id"], patch: Partial<VideoWallWindow>) => void;
  onCommit: (id: VideoWallWindow["id"]) => void;
  onAdd: () => void;
  onDelete: (id: VideoWallWindow["id"]) => void;
  onSelect: (id: VideoWallWindow["id"] | null) => void;
}

const NUM_FIELDS: readonly { f: NumField; label: string }[] = [
  { f: "x", label: "x" },
  { f: "y", label: "y" },
  { f: "width", label: "w" },
  { f: "height", label: "h" },
];

const keyOf = (id: VideoWallWindow["id"], f: Field) => `${id}#${f}`;

const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
};

export function EditableTable({
  windows,
  wall,
  minSize,
  highlightedId,
  onChange,
  onCommit,
  onAdd,
  onDelete,
  onSelect,
}: EditableTableProps) {
  // transient per-cell editing text, so typing "", "-", "1.4" doesn't snap away.
  const [draft, setDraft] = useState<Record<string, string>>({});

  const display = (w: VideoWallWindow, f: Field, key: string): string => {
    const d = draft[key];
    if (d !== undefined) return d;
    if (f === "z") return w.z === undefined ? "" : String(w.z);
    return String(w[f]);
  };

  const handleField = (w: VideoWallWindow, f: Field, raw: string, key: string) => {
    setDraft((d) => ({ ...d, [key]: raw }));
    const t = raw.trim();
    if (f === "z") {
      if (t === "")
        onChange(w.id, { z: undefined }); // empty z = no z-index (valid)
      else {
        const n = Number(t);
        if (Number.isFinite(n)) onChange(w.id, { z: Math.round(n) });
      }
      return;
    }
    if (t === "" || !Number.isFinite(Number(t))) return; // bad → red, no commit
    onChange(w.id, { [f]: Math.round(Number(t)) } as Partial<VideoWallWindow>);
  };

  const handleBlur = (id: VideoWallWindow["id"], key: string) => {
    setDraft((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
    onCommit(id); // clamp this window's rect back inside
  };

  // a cell is invalid when its draft is bad, OR the window edge is past the wall
  const invalid = (w: VideoWallWindow, f: Field, key: string): boolean => {
    const d = draft[key];
    if (d !== undefined) {
      const t = d.trim();
      if (f === "z") return t !== "" && !Number.isFinite(Number(t));
      if (t === "" || !Number.isFinite(Number(t))) return true;
    }
    if (f === "x") return w.x < 0;
    if (f === "y") return w.y < 0;
    if (f === "width") return w.x + w.width > wall.width;
    if (f === "height") return w.y + w.height > wall.height;
    return false;
  };

  const cell = (w: VideoWallWindow, f: Field) => {
    const key = keyOf(w.id, f);
    return (
      <input
        className={styles.cell}
        inputMode="numeric"
        placeholder={f === "z" ? "–" : ""}
        value={display(w, f, key)}
        aria-invalid={invalid(w, f, key)}
        aria-label={`${w.id} ${f}`}
        onChange={(e) => handleField(w, f, e.target.value, key)}
        onBlur={() => handleBlur(w.id, key)}
        onKeyDown={onKey}
      />
    );
  };

  return (
    <div className={styles.table}>
      <div className={`${styles.row} ${styles.head}`}>
        <span className={styles.idHead}>id</span>
        {NUM_FIELDS.map(({ label }) => (
          <span key={label}>{label}</span>
        ))}
        <span>z</span>
        <span className={styles.actCol}>
          <button
            className={styles.addBtn}
            onClick={onAdd}
            title="新增窗口（居中 + minSize + 级联偏移）"
            aria-label="新增窗口"
          >
            <Plus size={13} />
          </button>
        </span>
      </div>

      {windows.length === 0 ? (
        <div className={styles.empty}>无窗口 — 点右上 ＋ 新增</div>
      ) : (
        windows.map((w) => (
          <div
            key={w.id}
            className={`${styles.row} ${w.id === highlightedId ? styles.active : ""}`}
            onClick={() => onSelect(w.id)}
          >
            <span className={styles.idCell}>{w.id}</span>
            {NUM_FIELDS.map(({ f }) => (
              <span key={f} className={styles.cellWrap}>
                {cell(w, f)}
              </span>
            ))}
            <span className={styles.cellWrap}>{cell(w, "z")}</span>
            <span className={styles.actCol}>
              <button
                className={styles.delBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(w.id);
                }}
                title="删除窗口"
                aria-label={`删除 ${w.id}`}
              >
                <Trash2 size={13} />
              </button>
            </span>
          </div>
        ))
      )}

      <p className={styles.hint}>
        ＋ 居中 · {minSize.width}×{minSize.height} · 16px 级联 ·
        单元格实时取整不夹，越界红框，失焦夹回
      </p>
    </div>
  );
}
