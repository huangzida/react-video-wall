# react-video-wall

> 可组合的 React 视频墙（大屏）布局、窗口与交互编辑组件库。

把一面**物理视频墙**映射到任意尺寸的 DOM，并在两个坐标空间之间**无损**转换。核心层零依赖；交互层（框选开窗 / 拖拽 / 八向缩放 / 拖出删除）基于 `react-rnd`，按子路径隔离。

```bash
pnpm add react-video-wall            # 核心：零运行时依赖
pnpm add react-rnd                    # 仅当使用 ./interactive 交互层时
```

---

## 特性

- **无损坐标模型** —— 墙与所有矩形（瓦片、窗口）都以**物理整数像素**建模，DOM 是派生的缩放视图。`toPhysical(toDom(phys)) === phys` 在两个轴上恒成立，跨编辑周期不会漂移（[ADR-0008](docs/adr/0008-coordinate-model.md)）。
- **精确分割** —— `splitWall` 把余数像素分配到末行末列，瓦片整数求和精确等于墙；瓦片用**边框**而非间隙绘制，不扰动坐标（[ADR-0009](docs/adr/0009-wall-tile-model.md)）。
- **可控窗口** —— 窗口是消费方的受控状态，库不持有；`<Window>` 只渲染外壳，内容由你提供（[ADR-0010](docs/adr/0010-window-model.md)）。
- **零依赖核心** —— `import "react-video-wall"` 永不拉入 `react-rnd`；只有 `import "react-video-wall/interactive"` 需要（[ADR-0013](docs/adr/0013-package-structure-and-api.md)）。
- **contain-fit 渲染** —— 墙按 `min(domView/wall)` 统一缩放、居中（letterbox），容器尺寸无关。

---

## 快速上手

### 核心：静态渲染

```tsx
import { VideoWall, Window, splitWall } from "react-video-wall";
import "react-video-wall/style.css";

const WALL = { width: 1920, height: 1080 };
const TILES = splitWall(WALL, 3, 2); // 3 列 × 2 行，精确覆盖

export function MyWall() {
  return (
    <div style={{ aspectRatio: "16 / 9", width: "100%" }}>
      <VideoWall wall={WALL} tiles={TILES} padding={8}>
        <Window rect={{ x: 0, y: 0, width: 1280, height: 540 }}>
          <video src="/cam1.mp4" />
        </Window>
      </VideoWall>
    </div>
  );
}
```

> ⚠️ `<VideoWall>` 填满父容器（`width/height: 100%`），**父容器必须有显式高度**（`aspect-ratio`、固定高度或 flex），否则墙会塌缩为 0。

### 交互：框选 / 拖拽 / 缩放 / 拖出删除

```tsx
import { useState } from "react";
import { splitWall, type PhysicalRect } from "react-video-wall";
import { VideoWallEditor, type VideoWallWindow } from "react-video-wall/interactive";

const WALL = { width: 1920, height: 1080 };
const TILES = splitWall(WALL, 3, 2);

export function MyEditor() {
  const [windows, setWindows] = useState<VideoWallWindow[]>([
    { id: "w1", x: 320, y: 180, width: 640, height: 360 },
  ]);

  return (
    <div style={{ aspectRatio: "16 / 9", width: "100%" }}>
      <VideoWallEditor
        wall={WALL}
        tiles={TILES}
        padding={8}
        windows={windows}
        minSize={{ width: 240, height: 160 }}
        onAdd={(rect) => setWindows((ws) => [...ws, { id: `w${ws.length + 1}`, ...rect }])}
        onMove={(id, rect) =>
          setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...rect } : w)))
        }
        onResize={(id, rect) =>
          setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...rect } : w)))
        }
        onRemove={(id) => setWindows((ws) => ws.filter((w) => w.id !== id))}
        renderWindow={(w) => <video src={`/cam-${w.id}.mp4`} />}
      />
    </div>
  );
}
```

交互行为：在空白处**框选**开新窗口（小于 `minSize` 的选区会被拒绝）· 拖拽移动 / 八向缩放（缩放不低于 `minSize`）· 拖拽时把**鼠标移出大屏松手**即删除（窗口本身始终约束在墙内）。

### ⚠️ Vite 消费者配置（交互层必需）

`react-rnd` 的依赖 `react-draggable@4.7.0` 用 `process.env.DRAGGABLE_DEBUG` 门控开发日志，而 Vite 不提供 Node 全局，会抛 `ReferenceError: process is not defined` 导致白屏。在你的 `vite.config.ts` 加两行静态替换（build 与 dev 各一层，缺一不可）：

```ts
export default defineConfig({
  // ...其余配置
  define: { "process.env.DRAGGABLE_DEBUG": JSON.stringify(false) }, // build（Rollup）
  optimizeDeps: { esbuildOptions: { define: { "process.env.DRAGGABLE_DEBUG": "false" } } }, // dev（esbuild 预打包）
});
```

> 待 `react-draggable` 移除对裸 `process` 的引用后，此配置即可删除。仅使用核心层（`.`）的消费者不受影响。

---

## 坐标模型（ADR-0008）

| 空间                 | 说明                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Physical（物理）** | 真实墙的整数像素网格，**权威模型**。所有公开 API（墙尺寸、瓦片、窗口、事件载荷）都用物理整数。                                              |
| **DOM**              | 浏览器浮点像素，派生视图。每次布局按整数对 `(wall, domView)` 现算 `scale = min(domView.w/wall.w, domView.h/wall.h)`，从不缓存陈旧浮点比例。 |

转换只在一个地方跨边界：交互手势的 DOM px → `round(dom / scale)` → 物理整数。模型只存整数，子物理像素在真实墙上本就不可表示，故**无漂移、无精度损失**。

---

## API 参考

### `react-video-wall`（核心，零依赖）

| 导出                                                                     | 说明                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `<VideoWall wall tiles padding renderTile>`                              | 渲染墙格 + contain-fit + 通过 context 提供 scale     |
| `<Window rect>`                                                          | 物理整数 rect 外壳，消费方提供 children              |
| `useWallScale()` / `useWallContext()`                                    | 当前渲染 scale / 完整 context（交互层用）            |
| `splitWall(wall, cols, rows)`                                            | N×N 生成器，余数分配到末行末列                       |
| `boundingBox(rects)` / `validateTiles(tiles, wall)`                      | 瓦片便利工具 / 精确覆盖校验（不合规抛 `RangeError`） |
| `computeWallLayout(wall, container, padding)`                            | contain-fit + 居中布局推导                           |
| `computeScale` / `toDom` / `toPhysical` / `toDomRect` / `toPhysicalRect` | 坐标转换原语                                         |

类型：`WallSize`、`PhysicalRect`、`DomView`、`DomRect`、`ContainerSize`、`WallBox`、`WallLayout`。

### `react-video-wall/interactive`（peerDep `react-rnd`）

| 导出                                                               | 说明                                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `<VideoWallEditor wall tiles windows ...handlers>`                 | 一行组合（VideoWall + 框选 + 拖拽缩放）；`minSize?` 限制窗口最小尺寸 |
| `<InteractionLayer windows onMove onResize onRemove>`              | 每窗口一个受控 `<Rnd>`，在边界做 DOM↔物理转换                        |
| `<BoxSelect onAdd>`                                                | 透明覆盖层，框选完成发射物理+夹紧 rect                               |
| `useDragOut()`                                                     | 窗口中心出墙谓词（rect 判据；`<InteractionLayer>` 默认用光标判据）   |
| `clampToWall` / `clampRectToWall` / `isCentreOutside` / `dragRect` | 交互策略纯函数（高级消费者可用）                                     |

类型：`VideoWallWindow = { id, x, y, width, height, z? }`。

Props：`renderTile?(tile, i)`、`renderWindow?(window)`；窗口为受控 prop，所有变更经 `onAdd`/`onMove`/`onResize`/`onRemove` 上报。

---

## 架构

```
packages/react-video-wall
├── src/core/          # 零依赖：坐标模型 + 墙/瓦片 + 渲染器
│   ├── coords.ts            # ADR-0008 转换原语（无损往返）
│   ├── splitWall.ts         # ADR-0009 N×N 精确分割
│   ├── validateTiles.ts     # 精确覆盖边界校验
│   ├── layout.ts            # contain-fit + 居中
│   ├── VideoWall.tsx        # 渲染器（边框非间隙 + ResizeObserver）
│   ├── Window.tsx           # 物理外壳
│   └── WallContext.tsx      # useWallScale
└── src/interactive/   # peerDep react-rnd
    ├── InteractionLayer.tsx # 每窗口 <Rnd> + DOM↔物理 seam
    ├── BoxSelect.tsx        # 框选开窗
    ├── useDragOut.ts        # 中心出墙删除
    ├── VideoWallEditor.tsx  # 便利组合
    └── geometry.ts          # clampToWall / isCentreOutside / dragRect
```

构建产物（多入口，ADR-0013）：`dist/core.js` + `dist/interactive.js` + `dist/shared.js`（两入口共用的 WallContext 单例）+ `dist/rvw.css`。

---

## 开发

```bash
corepack enable && pnpm install        # Node 24 / pnpm 10
pnpm test                               # vitest（库，含坐标往返不变量）
pnpm build:lib                          # Vite 多入口库构建
pnpm --filter playground dev            # 演示站（控制室风格 UI）
pnpm release:dry-run                    # verdaccio 发布 + 消费者安装门禁
pnpm lint / pnpm fmt / pnpm lint:ci     # oxlint / oxfmt
```

React peerDep `>=17.0.2`；CI 矩阵 React 17/18/19 × Node 22/24。

## 设计决策

领域词汇见 [CONTEXT.md](CONTEXT.md)，实现计划见 [docs/PLAN.md](docs/PLAN.md)。本项目关键决策：

- [ADR-0008](docs/adr/0008-coordinate-model.md) 坐标模型：物理整数权威
- [ADR-0009](docs/adr/0009-wall-tile-model.md) 墙与瓦片数据模型
- [ADR-0010](docs/adr/0010-window-model.md) 窗口：受控、外壳渲染
- [ADR-0012](docs/adr/0012-interaction-impl.md) 交互层：react-rnd + 自定义框选/拖出
- [ADR-0013](docs/adr/0013-package-structure-and-api.md) 包结构：双子导出

## License

MIT
