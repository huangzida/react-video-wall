## 改动说明

<!-- 这个 PR 做了什么、为什么这么做？一两句话讲清楚。 -->

## 关联 issue

<!-- Closes #123 -->

## 自测

- [ ] `pnpm lint:ci` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm build:lib` + `pnpm build:playground` 通过
- [ ] 若改动发布相关：本地 `pnpm release:dry-run` 通过

## 是否需要发版

- [ ] 否（仅文档 / CI / 内部改动）
- [ ] 是（含 `feat` / `fix` / BREAKING CHANGE，发布时会自动打 tag）

---

> Commit message 必须符合 [Conventional Commits](https://www.conventionalcommits.org/)（`feat` / `fix` / `docs` / `refactor` / …），commitlint 会强制校验。
