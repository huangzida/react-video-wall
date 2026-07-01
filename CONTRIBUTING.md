# 贡献指南

感谢参与！这是一份**最短上手清单**，让你 5 分钟跑起来并知道规矩。

## 环境要求

- **Node 24**（由 `.nvmrc` 锁定；最低 `>=22.14`，这是 OIDC / npm CLI 的发布底线）
- **pnpm 10**（通过 Corepack 启用，版本由根 `packageManager` 锁定）

```bash
corepack enable        # 启用 corepack，pnpm 自动按锁定版本就绪
```

> Windows 上跑 oxc 工具链若遇 OOM，请使用 WSL。

## 克隆与安装

```bash
git clone <OWNER>/starter-react.git
cd starter-react
corepack enable
pnpm install
```

## 常用脚本

| 命令                    | 作用                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`              | 启动 playground（End User 视角预览组件）                                         |
| `pnpm build:lib`        | 构建库产物（`packages/react-lib`）                                               |
| `pnpm build:playground` | 构建 playground                                                                  |
| `pnpm test`             | 运行库单元测试（Vitest + Testing Library）                                       |
| `pnpm lint`             | oxlint 检查（`oxlint .`）                                                        |
| `pnpm fmt`              | oxfmt 格式化（`oxfmt --write .`）                                                |
| `pnpm lint:ci`          | lint + 格式化检查（CI 等价命令）                                                 |
| `pnpm release:dry-run`  | 发布前校验（npm pack + tarball 断言 + verdaccio 模拟发布 + playground 安装构建） |

## Commit 规范

**必须遵守 [Conventional Commits](https://www.conventionalcommits.org/)**。lefthook 的 `commit-msg` 钩子会用 commitlint 强制校验，不合规的提交会被拒绝。

允许的 `type`：

| type       | 用途                 |
| ---------- | -------------------- |
| `feat`     | 新功能（→ minor）    |
| `fix`      | Bug 修复（→ patch）  |
| `docs`     | 文档                 |
| `style`    | 代码风格（不改逻辑） |
| `refactor` | 重构                 |
| `perf`     | 性能优化             |
| `test`     | 测试                 |
| `build`    | 构建 / 依赖          |
| `ci`       | CI 配置              |
| `chore`    | 杂项                 |
| `revert`   | 回滚                 |

破坏性变更：在 `type` 后加 `!`（如 `feat!: drop Node 18`），或在 footer 写 `BREAKING CHANGE: <说明>`（→ major）。

## 发版流程

> 详见 [ADR-0006](docs/adr/0006-release-it.md) 与 [ADR-0007](docs/adr/0007-conventional-commits.md)。

1. **发版从 CI 触发**，不在本地跑。维护者到 Actions 页面 dispatch `release.yml`。
2. 版本号由 release-it 从 Conventional Commits **自动推导**，dispatch 时**不需要**选 patch/minor/major。
3. 若要发预发布（beta/rc），在 `preRelease` 输入框填 `beta` 或 `rc`。
4. 发布走 **OIDC trusted publishing**（`id-token: write`，无需 `NPM_TOKEN`）：release-it 先 `npm publish --provenance`，成功后才 commit/tag/创建 GitHub Release。失败则不留任何痕迹，重新 dispatch 即可。
5. **首次发布需要一次性引导**：npm 的 OIDC trusted publishing 无法发布一个还不存在的包。需先用一次性细粒度发布令牌手动发第一版，之后在 npm 后台把该包的 Trusted Publisher 绑定到本仓库的 `release.yml`，后续发版即免令牌。

## 如何加 ADR（架构决策记录）

当一个决策需要被记录时，在 `docs/adr/` 新建一个文件，序号自增：

```bash
# 假设当前最大序号是 0007
docs/adr/0008-<short-slug>.md
```

模板要点：标题写 `序号 — 决策一句话`；正文写**背景 / 选项 / 决定 / 结果**；若有替代方案，说明为何不选。ADR 不求完美，只求把当时的取舍讲清楚。
