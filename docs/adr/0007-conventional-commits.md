# 0007 — Conventional Commits + automated changelog + lefthook

Commit messages follow **Conventional Commits** (`feat`/`fix`/`docs`/`refactor`/..., with a `!` or a `BREAKING CHANGE:` footer for majors). A lefthook `commit-msg` hook runs `commitlint` with `@commitlint/config-conventional` to reject non-conforming messages. At release time, `@release-it/conventional-changelog` reads the commits since the last tag, derives the semver bump automatically (feat→minor, fix→patch, breaking→major), and regenerates `CHANGELOG.md` grouped by type.

Adopted because (a) `CHANGELOG.md` writes itself with structure End Users can read, (b) the version level is principled — derived from what actually changed — instead of a maintainer's guess, and (c) the maintainer no longer picks `patch/minor/major` in the release dispatch. The cost is commit discipline; lefthook enforces it rather than relying on memory.

## Consequences

- `release.yml`'s `workflow_dispatch` no longer needs the `increment` input — release-it derives it. A `preRelease` input (beta/rc) stays, since Conventional Commits has no syntax for prerelease channels.
- lefthook (`lefthook.yml`) also runs `oxlint` + `oxfmt` on staged files in `pre-commit`, so format/lint is enforced before push, not only in CI.
- `CHANGELOG.md` is committed by release-it and shipped in the repo.
- Downstream teams that dislike the convention can drop the hook + plugin; the release-it + OIDC publish core (ADR-0006) is unaffected.
