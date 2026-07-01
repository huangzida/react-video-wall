#!/usr/bin/env node
// ponytail: this rewrites pnpm-workspace.yaml to inject pnpm `overrides` for ONE CI
// matrix run (React 17/18/19 — ADR-0002). The file is regenerated per run on a clean
// checkout and is NOT committed. Minimal string YAML handling is fine here: the
// workspace file is a known, small shape (`packages: [...]` + maybe a prior overrides
// block we own), so a regex strip-and-append beats pulling in a YAML dep.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/pin-react.mjs <react-version>");
  process.exit(1);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const file = `${root}pnpm-workspace.yaml`;

let text = readFileSync(file, "utf8");
// Drop any overrides block we previously appended (it's the last top-level key), then
// re-append a fresh one. Also collapses trailing whitespace.
text = text.replace(/\noverrides:[\s\S]*$/, "").replace(/\s+$/, "");

const next = `${text}\n\noverrides:\n  react: ${version}\n  react-dom: ${version}\n`;
writeFileSync(file, next);
console.log(`✔ pinned react + react-dom to ${version} via pnpm overrides → ${file}`);
