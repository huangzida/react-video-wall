#!/usr/bin/env node
// ponytail: this catches the #1 publish failure — the build succeeds but the tarball
// is missing files (bad `files`/`.npmignore`, a forgotten .d.ts, a missing exports
// entry). Dry-run so nothing is written; the exports/sideEffects contract is checked
// against the source package.json (the exact file npm packs).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const libDir = `${root}packages/react-video-wall`;

const fail = (msg) => {
  console.error(`✖ tarball assertion failed: ${msg}`);
  process.exit(1);
};

// 1) Packed file list. `npm pack --dry-run --json` reports source-relative paths
//    (e.g. "dist/core.js"); inside the tarball they live under `package/`. Normalize
//    by stripping any leading `package/` so this works regardless of which npm reports.
const raw = execSync("npm pack --dry-run --json", { cwd: libDir, encoding: "utf8" });
const packed = JSON.parse(raw)[0];
const paths = new Set((packed.files ?? []).map((f) => f.path.replace(/^package\//, "")));

// Multi-entry build (ADR-0013): two self-referencing entries + a shared chunk (holds
// the WallContext singleton both entries must use) + one CSS + per-entry types.
const expectedFiles = [
  "dist/core.js",
  "dist/interactive.js",
  "dist/shared.js",
  "dist/rvw.css",
  "dist/core.d.ts",
  "dist/interactive.d.ts",
  "package.json",
];
for (const f of expectedFiles) {
  if (!paths.has(f))
    fail(`tarball missing package/${f} (packed: ${[...paths].join(", ") || "nothing"})`);
}

// 2) Exports + sideEffects contract from the package.json that actually ships.
const pkg = JSON.parse(readFileSync(`${libDir}/package.json`, "utf8"));
const exports = pkg.exports ?? {};
if (!exports["."]) fail(`package.json exports has no '.' entry`);
if (!exports["./interactive"]) fail(`package.json exports has no './interactive' entry (ADR-0013)`);
if (!exports["./style.css"]) fail(`package.json exports has no './style.css' entry`);
const se = pkg.sideEffects;
const cssCovered = Array.isArray(se) ? se.some((s) => s.endsWith(".css")) : se === true;
if (!cssCovered) fail(`package.json sideEffects does not cover css (got ${JSON.stringify(se)})`);

console.log(
  `✔ tarball OK — ${expectedFiles.length} required files present; exports + sideEffects contract holds`,
);
