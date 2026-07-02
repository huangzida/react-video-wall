#!/usr/bin/env node
// ponytail: local mirror of CI's release dry-run gate (ADR-0006). The SAME script runs
// in `release.yml` and under `pnpm release:dry-run`, so local and CI validate identical
// artifacts — that kills the "local builds but CI publish fails" drift this pattern
// exists to prevent.
//
// Two known-fragile spots, handled inline:
//  - npm CLI refuses to publish without credentials even when verdaccio allows anonymous;
//    we hand it a fake token via a throwaway .npmrc (NPM_CONFIG_USERCONFIG). Verdaccio's
//    anonymous auth accepts the request regardless of the bearer value.
//  - `pnpm add` fighting a `workspace:*` dep is unreliable, so we prove the real
//    npm install path in a throwaway temp project instead of mutating the playground.
//  - The interactive entry imports react-rnd (a browser peerDep), which cannot execute
//    under plain `node`; so we IMPORT the core entry (zero-dep, no module-load DOM) and
//    only RESOLVE (not execute) the ./interactive and ./style.css subpaths.
import { execSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const libDir = `${root}packages/react-video-wall`;
const REGISTRY = "http://127.0.0.1:4873";

const log = (n, msg) => console.log(`\n[${n}] ${msg}`);
const run = (cmd, opts) => execSync(cmd, { stdio: "inherit", ...opts });
const capture = (cmd, opts) => execSync(cmd, { encoding: "utf8", ...opts }).trim();

function startVerdaccio() {
  const configPath = join(tmpdir(), `verdaccio-${process.pid}.yaml`);
  const storageDir = join(tmpdir(), "verdaccio-storage");
  // ponytail: wipe storage each run so re-runs never hit a 409 on an already-published
  // throwaway version, and never collide with a real upstream package cached previously.
  rmSync(storageDir, { recursive: true, force: true });
  // ponytail: 'react-video-wall' is local-only (NO proxy) so the dry-run never resolves
  // the real npm package of that name and never clashes with a higher published version.
  // peer deps (react/react-dom/react-rnd) still proxy to npmjs via the '**' fallback.
  writeFileSync(
    configPath,
    `storage: ${storageDir}
auth:
  anonymous:
    enabled: true
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  'react-video-wall':
    access: $anonymous
    publish: $anonymous
    unpublish: $anonymous
  '@*/*':
    access: $anonymous
    publish: $anonymous
    unpublish: $anonymous
    proxy: npmjs
  '**':
    access: $anonymous
    publish: $anonymous
    unpublish: $anonymous
    proxy: npmjs
log: { type: stdout, format: pretty, level: warn }
`,
  );
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["verdaccio", "--config", configPath, "--listen", "127.0.0.1:4873"],
    { detached: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  child.unref();
  return { child, configPath };
}

async function waitForReady(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`verdaccio not ready at ${url} within ${timeoutMs}ms`);
}

function killVerdaccio({ child, configPath }) {
  try {
    // detached: true made the child its own group leader, so -pid kills npx + verdaccio.
    if (child.pid) process.kill(-child.pid);
  } catch {
    // already gone / no permission — best effort
  }
  try {
    rmSync(configPath);
  } catch {
    // ignore
  }
}

async function main() {
  let verdaccio = null;
  let npmrcPath = null;

  try {
    // (1) Build the Consumer Library.
    log(1, "pnpm build:lib");
    run("pnpm build:lib", { cwd: root });

    // (2) Assert the publishable artifact (npm pack --dry-run + contracts).
    log(2, "assert-tarball");
    run(`node "${root}scripts/assert-tarball.mjs"`, { cwd: root });

    // (3) Start verdaccio (local npm mirror) and wait until it answers.
    log(3, "verdaccio on 127.0.0.1:4873");
    verdaccio = startVerdaccio();
    await waitForReady(`${REGISTRY}/-/ping`);

    // npm CLI needs SOME credential to publish; write a fake token to a throwaway
    // userconfig. Verdaccio anonymous auth ignores the bearer value.
    npmrcPath = join(tmpdir(), `verdaccio-npmrc-${process.pid}`);
    writeFileSync(npmrcPath, `//127.0.0.1:4873/:_authToken=dry-run-token\n`);
    const regEnv = { ...process.env, NPM_CONFIG_USERCONFIG: npmrcPath };

    // (4) Pack a REAL tarball and publish it to the local registry.
    log(4, `npm pack + publish → ${REGISTRY}`);
    const tgz = capture("npm pack", { cwd: libDir }).split("\n").pop();
    run(`npm publish "${tgz}" --registry ${REGISTRY} --tag dry-run`, { cwd: libDir, env: regEnv });

    // (5) Prove the real End-User install path in a throwaway project (not the
    // playground — `pnpm add` fighting `workspace:*` is unreliable). Install the lib
    // + its react peer from verdaccio, then exercise the published entries.
    log(5, "throwaway consumer install + import (from verdaccio)");
    const version = JSON.parse(readFileSync(`${libDir}/package.json`, "utf8")).version;
    const consumerDir = join(tmpdir(), `consumer-${process.pid}`);
    rmSync(consumerDir, { recursive: true, force: true });
    mkdirSync(consumerDir, { recursive: true });
    writeFileSync(
      join(consumerDir, "package.json"),
      JSON.stringify({ name: "consumer", type: "module", private: true }),
    );
    run(`npm install react-video-wall@${version} react@19 react-dom@19 --registry ${REGISTRY}`, {
      cwd: consumerDir,
      env: regEnv,
    });
    // IMPORT the core entry (safe: no module-load DOM) and RESOLVE the ./interactive and
    // ./style.css subpaths (resolve-only — react-rnd is a browser peerDep, not node-runnable).
    writeFileSync(
      join(consumerDir, "smoke.mjs"),
      `import * as core from 'react-video-wall'\nimport { existsSync } from 'node:fs'\nconst interactiveUrl = import.meta.resolve('react-video-wall/interactive')\nconst cssUrl = import.meta.resolve('react-video-wall/style.css')\nfor (const name of ['VideoWall', 'Window', 'splitWall', 'useWallScale', 'computeScale']) {\n  if (typeof core[name] !== 'function') throw new Error(name + ' export missing')\n}\nif (!existsSync(new URL(interactiveUrl))) throw new Error('interactive subpath file missing: ' + interactiveUrl)\nif (!existsSync(new URL(cssUrl))) throw new Error('style.css subpath file missing: ' + cssUrl)\nconsole.log('consumer OK:', Object.keys(core).join(','))\nconsole.log('interactive:', interactiveUrl)\nconsole.log('css:', cssUrl)\n`,
    );
    run("node smoke.mjs", { cwd: consumerDir });

    console.log("\n✔ release dry-run passed");
  } finally {
    // (6) Teardown: verdaccio dies, throwaway userconfig removed — on success OR failure.
    if (verdaccio) killVerdaccio(verdaccio);
    if (npmrcPath) {
      try {
        rmSync(npmrcPath);
      } catch {
        // ignore
      }
    }
    log(6, "teardown: killed verdaccio, removed throwaway npmrc");
  }
}

main().catch((err) => {
  console.error("\n✖ release dry-run failed:", err?.message ?? err);
  process.exitCode = 1;
});
