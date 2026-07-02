import { useEffect, useRef, useState } from "react";
import { Activity, Grid3x3, MousePointerClick, Sun, Moon } from "lucide-react";
import { VideoWall, Window, splitWall, type PhysicalRect } from "react-video-wall";
import { VideoWallEditor, type VideoWallWindow } from "react-video-wall/interactive";
import styles from "./App.module.css";

// The wall is modelled in physical-integer pixels (ADR-0008); the DOM is a derived,
// contain-fit view. 1920×1080 with a 3×2 tile grid (6 screens).
const WALL = { width: 1920, height: 1080 };
const TILES = splitWall(WALL, 3, 2);
// Minimum window size (physical-int px): box-select below this is rejected, resize can't go below.
const MIN_SIZE = { width: 240, height: 160 };

// Static read-only windows for the core-renderer panel (physical coords).
const STATIC_WINDOWS: VideoWallWindow[] = [
  { id: "CAM-01", x: 0, y: 0, width: 1280, height: 540 },
  { id: "CAM-02", x: 1280, y: 0, width: 640, height: 540 },
  { id: "CAM-03", x: 0, y: 540, width: 640, height: 540 },
];

const tile = (_t: PhysicalRect, i: number) => (
  <span className={styles.tileLabel}>{String(i + 1).padStart(2, "0")}</span>
);

const feed = (id: VideoWallWindow["id"]) => (
  <div className={styles.winContent}>
    <span className={styles.recDot} />
    <span className={styles.winId}>{id}</span>
  </div>
);

export function App() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    // ADR-0004: dark mode is class-driven via `.dark` on <html>.
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Interactive panel: windows are CONSUMER state (ADR-0010); the lib holds none.
  const [windows, setWindows] = useState<VideoWallWindow[]>([
    { id: "w1", x: 320, y: 180, width: 640, height: 360 },
  ]);
  const seq = useRef(1);
  const addWindow = (rect: PhysicalRect) =>
    setWindows((ws) => [...ws, { id: `w${++seq.current}`, ...rect }]);
  const updateWindow = (id: VideoWallWindow["id"], rect: PhysicalRect) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...rect } : w)));
  const removeWindow = (id: VideoWallWindow["id"]) =>
    setWindows((ws) => ws.filter((w) => w.id !== id));

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

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <Grid3x3 size={16} className={styles.panelIcon} />
            <h2>静态渲染</h2>
            <span className={styles.tag}>core</span>
          </div>
          <div className={styles.wallFrame}>
            <VideoWall wall={WALL} tiles={TILES} padding={8} renderTile={tile}>
              {STATIC_WINDOWS.map((w) => (
                <Window key={w.id} rect={w}>
                  {feed(w.id)}
                </Window>
              ))}
            </VideoWall>
          </div>
          <p className={styles.caption}>
            <code>&lt;VideoWall&gt;</code> + <code>&lt;Window&gt;</code> 把物理整数坐标无损映射到
            DOM，只读渲染墙格与窗口外壳（内容由消费方提供）。
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <MousePointerClick size={16} className={styles.panelIcon} />
            <h2>交互编辑</h2>
            <span className={styles.tag}>interactive</span>
            <span className={styles.count}>窗口 {windows.length}</span>
          </div>
          <div className={styles.wallFrame}>
            <VideoWallEditor
              wall={WALL}
              tiles={TILES}
              padding={8}
              windows={windows}
              onAdd={addWindow}
              onMove={updateWindow}
              onResize={updateWindow}
              onRemove={removeWindow}
              minSize={MIN_SIZE}
              renderTile={tile}
              renderWindow={(w) => feed(w.id)}
            />
          </div>
          <p className={styles.caption}>
            框选空白处新增窗口 · 拖拽移动 / 八向缩放 · 拖拽时把鼠标移出大屏松手即删除。
          </p>
        </article>
      </section>

      <section className={styles.data}>
        <div className={styles.panelHead}>
          <Activity size={16} className={styles.panelIcon} />
          <h2>数据 / DATA</h2>
          <span className={styles.tag}>physical int</span>
          <span className={styles.count}>窗口 {windows.length}</span>
        </div>

        <div className={styles.dataGrid}>
          <div className={`${styles.dataRow} ${styles.dataHeadRow}`}>
            <span>id</span>
            <span>x</span>
            <span>y</span>
            <span>w</span>
            <span>h</span>
          </div>
          {windows.length === 0 ? (
            <div className={styles.dataEmpty}>无窗口 — 在「交互编辑」面板框选空白处新增</div>
          ) : (
            windows.map((w) => (
              <div className={styles.dataRow} key={w.id}>
                <span className={styles.dataId}>{w.id}</span>
                <span>{w.x}</span>
                <span>{w.y}</span>
                <span>{w.width}</span>
                <span>{w.height}</span>
              </div>
            ))
          )}
        </div>

        <div className={styles.dataRef}>
          wall {WALL.width}×{WALL.height} · grid 3×2 · {TILES.length} tiles · min {MIN_SIZE.width}×
          {MIN_SIZE.height}
        </div>
        <p className={styles.caption}>
          所有坐标为<strong>物理整数像素</strong>
          （墙的原生网格，ADR-0008）。交互时实时更新——观察数值始终保持整数、且始终在墙内，即坐标无损。
        </p>
      </section>

      <footer className={styles.foot}>wall 1920×1080 · grid 3×2 · 坐标单位为物理整数像素</footer>
    </main>
  );
}
