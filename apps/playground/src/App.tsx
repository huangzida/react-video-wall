import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCopy, Grid3x3, Moon, RotateCcw, Sun, Upload } from "lucide-react";
import { VideoWall, Window, splitWall, type PhysicalRect, type WallSize } from "react-video-wall";
import {
  VideoWallEditor,
  clampRectToWall,
  type SizeConstraint,
  type VideoWallWindow,
} from "react-video-wall/interactive";
import { EditableTable } from "./components/EditableTable";
import { Slider } from "./components/Slider";
import styles from "./App.module.css";

const DEFAULT_WALL: WallSize = { width: 1920, height: 1080 };
const DEFAULT_MIN: SizeConstraint = { width: 240, height: 160 };
const DEFAULT_WINDOWS: VideoWallWindow[] = [{ id: "w1", x: 320, y: 180, width: 640, height: 360 }];

const PRESETS: { label: string; wall: WallSize }[] = [
  { label: "1080p", wall: { width: 1920, height: 1080 } },
  { label: "2K", wall: { width: 2560, height: 1440 } },
  { label: "4K", wall: { width: 3840, height: 2160 } },
  { label: "1024×768", wall: { width: 1024, height: 768 } },
  { label: "1366×768", wall: { width: 1366, height: 768 } },
];

const MODES = ["interactive", "core"] as const;
type Mode = (typeof MODES)[number];

const tile = (_t: PhysicalRect, i: number) => (
  <span className={styles.tileLabel}>{String(i + 1).padStart(2, "0")}</span>
);

export function App() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    // ADR-0004: dark mode is class-driven via `.dark` on <html>.
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const [wall, setWall] = useState<WallSize>({ ...DEFAULT_WALL });
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(2);
  const [padding, setPadding] = useState(8);
  const [minSize, setMinSize] = useState<SizeConstraint>({ ...DEFAULT_MIN });
  const [mode, setMode] = useState<Mode>("interactive");
  const [windows, setWindows] = useState<VideoWallWindow[]>(DEFAULT_WINDOWS);
  const [highlightedId, setHighlightedId] = useState<VideoWallWindow["id"] | null>(null);
  const seq = useRef(1);

  const tiles = useMemo(() => splitWall(wall, cols, rows), [wall, cols, rows]);

  // Q4: wall resolution change -> clamp every window back inside (windows kept).
  // Used by presets (a deliberate jump clamps immediately).
  function changeWall(next: WallSize) {
    setWall(next);
    setWindows((ws) =>
      ws.map((w) => ({
        ...w,
        ...clampRectToWall({ x: w.x, y: w.y, width: w.width, height: w.height }, next),
      })),
    );
  }
  // Wall number inputs: live-resize the wall only (windows may overflow mid-type =
  // cropped, same philosophy as the table), then clamp every window back on blur.
  function clampAllWindows() {
    setWindows((ws) =>
      ws.map((w) => ({
        ...w,
        ...clampRectToWall({ x: w.x, y: w.y, width: w.width, height: w.height }, wall),
      })),
    );
  }

  // table: live edit (round, NO clamp — out-of-wall shows cropped + red)
  function patchWindow(id: VideoWallWindow["id"], patch: Partial<VideoWallWindow>) {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  // table: blur -> clamp this window's rect back inside (self-heal)
  function commitWindow(id: VideoWallWindow["id"]) {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        const c = clampRectToWall({ x: w.x, y: w.y, width: w.width, height: w.height }, wall);
        return { ...w, ...c };
      }),
    );
  }
  // table "+": center + minSize + cascade offset, z empty
  function addCentered() {
    const id = `w${++seq.current}`;
    const off = (seq.current - 1) * 16;
    const c = clampRectToWall(
      {
        x: Math.round((wall.width - minSize.width) / 2) + off,
        y: Math.round((wall.height - minSize.height) / 2) + off,
        width: minSize.width,
        height: minSize.height,
      },
      wall,
    );
    setWindows((ws) => [...ws, { id, ...c }]);
    setHighlightedId(id);
  }
  // box-select: rect comes from the selection (already physical)
  function addFromRect(rect: PhysicalRect) {
    const id = `w${++seq.current}`;
    setWindows((ws) => [...ws, { id, ...rect }]);
    setHighlightedId(id);
  }
  // drag / resize: lib already clamped the rect
  function moveWindow(id: VideoWallWindow["id"], rect: PhysicalRect) {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...rect } : w)));
  }
  function deleteWindow(id: VideoWallWindow["id"]) {
    setWindows((ws) => ws.filter((w) => w.id !== id));
    setHighlightedId((h) => (h === id ? null : h));
  }

  // JSON import/export (Q8.2)
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErr, setImportErr] = useState<string | null>(null);

  async function exportJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(windows, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setImportErr("剪贴板不可用");
    }
  }

  function doImport() {
    const r = parseWindows(importText, () => `w${++seq.current}`);
    if (!r.ok) {
      setImportErr(r.error);
      return;
    }
    setImportErr(null);
    setWindows(
      r.windows.map((w) => ({
        ...w,
        ...clampRectToWall({ x: w.x, y: w.y, width: w.width, height: w.height }, wall),
      })),
    );
    setImportText("");
    setImportOpen(false);
  }

  function reset() {
    setWall({ ...DEFAULT_WALL });
    setCols(3);
    setRows(2);
    setPadding(8);
    setMinSize({ ...DEFAULT_MIN });
    setMode("interactive");
    setWindows(DEFAULT_WINDOWS);
    setHighlightedId(null);
    seq.current = 1;
  }

  // window content: rec dot + id + z badge; click highlights (interactive only)
  const feed = (w: VideoWallWindow, clickable: boolean) => (
    <div
      className={`${styles.winContent} ${w.id === highlightedId ? styles.winHighlight : ""}`}
      {...(clickable ? { onClick: () => setHighlightedId(w.id) } : {})}
    >
      <span className={styles.recDot} />
      <span className={styles.winId}>{w.id}</span>
      {w.z !== undefined && <span className={styles.winZ}>z{w.z}</span>}
    </div>
  );

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Grid3x3 className={styles.brandIcon} size={22} />
          <div className={styles.brandText}>
            <h1>react-video-wall</h1>
            <p>可组合的视频墙布局与交互编辑组件库 · playground</p>
          </div>
          <span className={styles.live}>
            <span className={styles.liveDot} />
            LIVE
          </span>
        </div>
        <button className={styles.toggle} onClick={() => setDark((d) => !d)} aria-label="切换主题">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          <span>{dark ? "亮色" : "暗色"}</span>
        </button>
      </header>

      <div className={styles.workspace}>
        {/* ---------- canvas (hero) ---------- */}
        <section className={styles.hero}>
          <div className={styles.heroHead}>
            <span className={`${styles.tag} ${styles.tagMode}`}>
              {mode === "interactive" ? "interactive" : "core"}
            </span>
            <span className={styles.dim}>
              {wall.width}×{wall.height}
            </span>
            <span className={styles.dim}>
              {cols}×{rows} · {tiles.length} tiles
            </span>
            <span className={styles.count}>窗口 {windows.length}</span>
          </div>

          <div className={styles.wallFrame}>
            {mode === "interactive" ? (
              <VideoWallEditor
                wall={wall}
                tiles={tiles}
                padding={padding}
                windows={windows}
                minSize={minSize}
                onAdd={addFromRect}
                onMove={moveWindow}
                onResize={moveWindow}
                onRemove={deleteWindow}
                renderTile={tile}
                renderWindow={(w) => feed(w, true)}
              />
            ) : (
              <VideoWall wall={wall} tiles={tiles} padding={padding} renderTile={tile}>
                {windows.map((w) => (
                  <Window
                    key={w.id}
                    rect={w}
                    className="rvw-window"
                    style={w.z !== undefined ? { zIndex: w.z } : undefined}
                  >
                    {feed(w, false)}
                  </Window>
                ))}
              </VideoWall>
            )}
          </div>

          <p className={styles.caption}>
            {mode === "interactive" ? (
              <>
                框选空白处新增 · 拖拽移动 / 八向缩放 · 拖出大屏松手即删除。点窗口或表行可双向高亮。
              </>
            ) : (
              <>
                <code>&lt;VideoWall&gt;</code> + <code>&lt;Window&gt;</code>{" "}
                零依赖只读路径。窗口不可交互，仅展示物理整数坐标的无损映射。
              </>
            )}
          </p>
        </section>

        {/* ---------- inspector (sidebar) ---------- */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            {/* render mode */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>渲染模式</h3>
              <div className={styles.seg} role="tablist" aria-label="渲染模式">
                {MODES.map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    className={`${styles.segBtn} ${mode === m ? styles.segActive : ""}`}
                    onClick={() => setMode(m)}
                  >
                    {m === "interactive" ? "交互" : "纯core"}
                  </button>
                ))}
              </div>
            </section>

            {/* wall + grid config */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>墙与网格</h3>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>墙分辨率 (px)</span>
                <div className={styles.wallInputs}>
                  <input
                    className={styles.num}
                    type="number"
                    min={1}
                    value={wall.width}
                    aria-label="墙宽"
                    onChange={(e) =>
                      setWall({
                        width: Math.max(cols, Math.round(Number(e.target.value) || cols)),
                        height: wall.height,
                      })
                    }
                    onBlur={clampAllWindows}
                  />
                  <span className={styles.cross}>×</span>
                  <input
                    className={styles.num}
                    type="number"
                    min={1}
                    value={wall.height}
                    aria-label="墙高"
                    onChange={(e) =>
                      setWall({
                        width: wall.width,
                        height: Math.max(rows, Math.round(Number(e.target.value) || rows)),
                      })
                    }
                    onBlur={clampAllWindows}
                  />
                </div>
              </div>
              <div className={styles.presets}>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    className={styles.preset}
                    onClick={() => changeWall(p.wall)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Slider
                label="列数 cols"
                value={cols}
                min={1}
                max={12}
                onChange={(v) => setCols(Math.min(v, wall.width))}
              />
              <Slider
                label="行数 rows"
                value={rows}
                min={1}
                max={12}
                onChange={(v) => setRows(Math.min(v, wall.height))}
              />
              <Slider
                label="内边距 padding"
                value={padding}
                min={0}
                max={48}
                onChange={setPadding}
              />
              <Slider
                label="最小宽 minW"
                value={minSize.width}
                min={0}
                max={800}
                step={10}
                onChange={(v) => setMinSize((m) => ({ ...m, width: v }))}
              />
              <Slider
                label="最小高 minH"
                value={minSize.height}
                min={0}
                max={800}
                step={10}
                onChange={(v) => setMinSize((m) => ({ ...m, height: v }))}
              />
            </section>

            {/* windows table */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>窗口 · DATA</h3>
              <EditableTable
                windows={windows}
                wall={wall}
                minSize={minSize}
                highlightedId={highlightedId}
                onChange={patchWindow}
                onCommit={commitWindow}
                onAdd={addCentered}
                onDelete={deleteWindow}
                onSelect={setHighlightedId}
              />
            </section>

            {/* JSON import/export + reset */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>数据 · IO</h3>
              <div className={styles.ioRow}>
                <button className={styles.ioBtn} onClick={exportJson}>
                  <ClipboardCopy size={13} />
                  {copied ? "已复制" : "复制 JSON"}
                </button>
                <button
                  className={styles.ioBtn}
                  onClick={() => {
                    setImportOpen((v) => !v);
                    setImportErr(null);
                  }}
                >
                  <Upload size={13} />
                  {importOpen ? "收起" : "导入"}
                </button>
                <button className={styles.ioBtn} onClick={reset}>
                  <RotateCcw size={13} />
                  重置
                </button>
              </div>
              {importOpen && (
                <div className={styles.importBox}>
                  <textarea
                    className={styles.jsonArea}
                    rows={5}
                    spellCheck={false}
                    placeholder={'[{"id":"w1","x":0,"y":0,"width":640,"height":360}]'}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  {importErr && <p className={styles.importErr}>{importErr}</p>}
                  <button className={styles.ioBtnPrimary} onClick={doImport}>
                    落地导入
                  </button>
                </div>
              )}
            </section>

            <div className={styles.status}>
              wall {wall.width}×{wall.height} · grid {cols}×{rows} · {tiles.length} tiles · min{" "}
              {minSize.width}×{minSize.height}
            </div>
          </div>
        </aside>
      </div>

      <footer className={styles.foot}>坐标单位为物理整数像素 · 表格是真相源，墙是派生视图</footer>
    </main>
  );
}

/** Parse + validate an imported windows JSON. Assigns ids for items lacking one. */
function parseWindows(
  raw: string,
  nextId: () => VideoWallWindow["id"],
): { ok: true; windows: VideoWallWindow[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "JSON 解析失败" };
  }
  if (!Array.isArray(data)) return { ok: false, error: "期望一个数组" };
  const out: VideoWallWindow[] = [];
  for (let i = 0; i < data.length; i++) {
    const it = data[i];
    if (!it || typeof it !== "object") {
      return { ok: false, error: `第 ${i + 1} 项不是对象` };
    }
    const o = it as Record<string, unknown>;
    const { x, y, width, height } = o;
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof width !== "number" ||
      typeof height !== "number" ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return { ok: false, error: `第 ${i + 1} 项缺少有效的 x/y/width/height` };
    }
    const id =
      typeof o.id === "string" || typeof o.id === "number"
        ? (o.id as VideoWallWindow["id"])
        : nextId();
    const z = typeof o.z === "number" && Number.isFinite(o.z) ? Math.round(o.z) : undefined;
    out.push({
      id,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      ...(z !== undefined ? { z } : {}),
    });
  }
  return { ok: true, windows: out };
}
