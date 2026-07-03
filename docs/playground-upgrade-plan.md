# Playground 升级方案

Status: design AGREED (grilling session, 8/8 branches resolved). Ready to implement.
Scope: `apps/playground` only — **zero library changes**. All logic is consumer-side.

## 目标

把 playground 从"静态展示 + 只读数据表"升级为**可调试的控制台**：墙分辨率/网格/约束全可配，窗口数据表可编辑、实时双向驱动墙，行↔窗口高亮联动，JSON 导入导出。专业、聚焦、有趣味。

## 读前必看

- `docs/adr/0008-coordinate-model.md` — 物理整数权威，DOM 是派生视图。校验/夹回都围绕它。
- `docs/adr/0009` tiles / `0010` window（窗口独立漂浮，不吸附 tile）/ `0013` 双子导出。
- `packages/react-video-wall/src/interactive/geometry.ts` — 复用 `clampRectToWall`（四边夹）。
- `packages/react-video-wall/src/core/splitWall.ts` — 网格生成器。

---

## 决策清单（grilling 已锁）

### 布局（Q1+Q2）：画布 + 检查器

- **左 = 主交互墙**（hero，吃满高度，大屏气势）。
- **右 = 可滚动控制侧栏**：顶部渲染模式分段控件 → 配置区 → 可编辑表 → 状态条。
- 窄屏（< 某断点）自动堆叠成"墙在上 / 控件在下"。
- **渲染模式分段控件** `交互 | 纯core`：
  - 交互 = `<VideoWallEditor>`（框选/拖拽/缩放/拖出删 全开）。
  - 纯core = `<VideoWall> + <Window>` 只读渲染；表/框选失效（纯展示双子导出里的零依赖路径）。
  - 两种模式**共享同一份 windows 状态**（切模式不丢数据）。
- 顶栏：品牌 + LIVE + **主题开关**（沿用现有 Sun/Moon，class 驱动 `.dark`）。

### 配置控件（Q3）

- **墙分辨率** `width` / `height`：数字输入框。
- **预设行**：`1080p(1920×1080)` / `2K(2560×1440)` / `4K(3840×2160)` / `1024×768` / `1366×768`。点预设即填入两个输入框。
- **可复用圆角矩形滑块**（样式：矩形 + 圆角，内部左 = 名称，右 = 当前值）：
  - `cols` 1–12（整数）
  - `rows` 1–12（整数）
  - `padding` 0–48（DOM px）
  - `minSize.width` 0–800（step 10）
  - `minSize.height` 0–800（step 10）

### 墙/网格变化行为（Q4）

- **墙分辨率变** → 对所有窗口跑一遍 `clampRectToWall`（消费方一行 `.map`）。保留窗口、保整数、保持在墙内。
- **网格 cols/rows 变** → 窗口**不动**（窗口独立漂浮，不吸附 tile；只重铺背景格）。

### 可编辑表（Q5）

列结构（表头）：`id · x · y · w · h · z · 🗑`

| 列            | 可编辑  | 说明                                                            |
| ------------- | ------- | --------------------------------------------------------------- |
| id            | ❌ 锁定 | 自动自增 `w1, w2, …`（灰底只读）。编辑只会制造 React key 冲突。 |
| x / y / w / h | ✅      | 数字 input，物理整数。                                          |
| z             | ✅      | z-index 数字，**可空**（空 = 不传 z，react-rnd 走默认栈序）。   |
| 🗑            | 图标    | 删除该行。                                                      |

### 增删语义（Q6）

- **新增**（表头「+ 新增」按钮）：新窗口 = 墙中心 + `minSize` 尺寸 + **16px 级联偏移**（防重叠），z 空。
  - 中心公式：`x = (wall.w - minSize.w)/2 + cascade*16`，y 同理。
- **删除**：即时，**无确认弹窗**（playground 快优先，误删重加成本极低）。
- **minSize > 墙** 边界：新窗口仍按 `clampRectToWall` 夹回（可能小于 minSize，属配置矛盾，不另加防护）。

### 编辑校验（Q7）—— 表是真相源，墙是派生视图

- **onChange**：`Math.round(Number(v))` 取整后**直接提交，不夹**。
  - 墙内时：墙实时跟着动（live）。
  - 越界时：窗口被 `overflow:hidden` 裁掉——**可视化"出墙=被裁"的后果（教学性）**。
  - 越界单元格 → **红框高亮**。
- **onBlur**：对该窗口跑 `clampRectToWall` 夹回（自愈）。
- **非数字 / 空**：红框，**不提交**；失焦若仍空则**回填上一个有效值**。
- **z**：同样取整；空 = 不传。

### Extras（Q8）

1. **行↔窗口高亮联动**（调试闭环灵魂）：
   - 点表行 → 对应窗口在墙上**描边/脉冲**高亮。
   - 点窗口（交互模式） → 对应表行**高亮**。
   - 纯 core 模式：窗口不可点，只保留"点行 → 高亮窗口"单向。
2. **JSON 导出/导入**：一键复制 windows 数组为 JSON；粘贴文本框导入（校验后落地）。
3. **重置**按钮：回到默认配置（墙 1920×1080、网格 3×2、padding 8、minSize 240×160、单窗口 w1）。

---

## 文件计划（ponytail：最少文件）

```
apps/playground/src/
├── App.tsx                      # 主组合：状态 + 布局 + 配置面板 + 模式切换
├── App.module.css               # 在现有 control-room 主题上扩展（CSS 变量/亮暗/响应式）
├── components/
│   ├── Slider.tsx               # 可复用圆角矩形滑块（左名右值）
│   └── EditableTable.tsx        # 可编辑窗口表（增删/校验/高亮联动）
```

- `Slider` 被 6 处复用（cols/rows/padding/minW/minH）→ 值得抽组件。
- `EditableTable` 体量大（增删/校验/红框/联动）→ 值得抽组件。
- 配置面板内联在 App.tsx（不另开 Controls 组件）。

## 组件契约

### `<Slider>`

```ts
interface SliderProps {
  label: string; // 左侧名称
  value: number;
  min: number;
  max: number;
  step?: number; // default 1
  onChange: (v: number) => void;
}
```

视觉：圆角矩形轨道，左侧 label，右侧实时数值；填充条用主题强调色。

### `<EditableTable>`

```ts
interface EditableTableProps {
  windows: VideoWallWindow[];
  wall: WallSize;
  minSize: SizeConstraint;
  highlightedId: VideoWallWindow["id"] | null;
  onChange: (id, patch: Partial<VideoWallWindow>) => void;  // 实时（取整不夹）
  onCommit: (id) => void;        // onBlur → 夹回该窗口
  onAdd: () => void;             // 中心+minSize+级联
  onDelete: (id) => void;
  onSelect: (id | null) => void; // 行高亮联动
}
```

## 状态模型（App.tsx 持有）

```ts
const [wall, setWall] = useState({ width: 1920, height: 1080 });
const [cols, setCols] = useState(3);
const [rows, setRows] = useState(2);
const [padding, setPadding] = useState(8);
const [minSize, setMinSize] = useState({ width: 240, height: 160 });
const [mode, setMode] = useState<"interactive" | "core">("interactive");
const [dark, setDark] = useState(true);
const [windows, setWindows] = useState<VideoWallWindow[]>([
  /* w1 默认 */
]);
const [highlightedId, setHighlightedId] = useState<string | number | null>(null);
const seq = useRef(1);

const tiles = useMemo(() => splitWall(wall, cols, rows), [wall, cols, rows]);

// 墙变 → 夹回全部（Q4）
function changeWall(next: WallSize) {
  setWall(next);
  setWindows((ws) => ws.map((w) => clampRectToWall({ ...w }, next)));
}
```

- 框选 onAdd / 拖拽 onMove / 缩放 onResize / 拖出 onRemove → 直接操作 windows state（库回调）。
- 表 onChange → `setWindows` 取整不夹；onCommit(blur) → `clampRectToWall` 夹回。
- 高亮：表 onSelect 设 highlightedId；交互模式点窗口 → 同；`renderWindow` 里按 highlightedId 加描边 class。

## 实现要点

- **零库改动**。复用 `clampRectToWall`、`splitWall`、`VideoWallWindow`（都从 `react-video-wall` / `react-video-wall/interactive` 导入）。
- **沿用现有 control-room 美学**：App.module.css 已有的 CSS 变量、亮/暗主题、`.rvw-tile`/`.rvw-window` 主题覆写要保留并扩展，不推倒重来。
- 窗口内容 `feed(id)` 沿用（rec 圆点 + id）；z 生效后可在 feed 里显示层级数字（可选 polish）。
- 红框校验：单元格 `aria-invalid` + CSS；越界判定 `x<0 || y<0 || x+w>wall.w || y+h>wall.h`。
- JSON 导入：`JSON.parse` → 校验为数组、每项有 x/y/w/h（id 缺则补、z 可空）→ 落地。
- 级联偏移：`seq.current` 驱动；删除不回退 seq（简单防重）。

## 不做（YAGNI）

- 布局预设（2×2/主+侧/画中画）—— 与墙分辨率预设重叠，先不做。
- 撤销/重做、键盘快捷键、侧栏可拖拽调宽。
- 表格虚拟滚动（窗口数量 playground 级不会爆）。

## 验证

- `pnpm lint`（oxlint）+ `pnpm fmt`。
- `pnpm --filter playground build` 通过。
- dev 烟测：改分辨率窗口夹回 / 改网格窗口不动 / 表编辑实时 + 失焦夹回 / 越界红框 / 增删 / 高亮联动 / JSON 导入导出 / 主题切换 / 模式切换。
