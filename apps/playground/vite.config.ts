import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const libRoot = fileURLToPath(new URL("../../packages/react-video-wall", import.meta.url));

// PREVIEW=1 resolves react-video-wall to its BUILT dist — the CI dist-verification path
// (ADR-0006). The default (dev) resolves to SOURCE so HMR edits the lib live.
const preview = process.env.PREVIEW === "1";

export default defineConfig({
  // ponytail: GitHub Pages project pages serve under /<repo>/, so the deploy sets
  // PAGES_BASE=/react-video-wall/ and assets resolve correctly. Default '/' for dev/CI.
  base: process.env.PAGES_BASE ?? "/",
  plugins: [react()],
  // react-draggable (react-rnd's dep) gates its dev logger on `process.env.DRAGGABLE_DEBUG`,
  // which throws "process is not defined" in the browser (Vite ships no Node globals).
  // Replace it statically so the log() call is dead code. Required by any consumer of
  // the ./interactive entry until react-draggable drops the bare `process` reference.
  // NOTE the two layers: top-level `define` covers the production BUILD (Rollup); dev
  // serves deps from Vite's esbuild pre-bundle, which ignores top-level define, so the
  // SAME replacement must be passed via optimizeDeps.esbuildOptions.define for dev.
  define: { "process.env.DRAGGABLE_DEBUG": JSON.stringify(false) },
  optimizeDeps: {
    esbuildOptions: { define: { "process.env.DRAGGABLE_DEBUG": "false" } },
  },
  resolve: {
    alias: [
      // ponytail: more specific subpaths MUST come before the bare specifier, or the
      // bare 'react-video-wall' prefix would swallow 'react-video-wall/...' (multi-entry).
      {
        find: "react-video-wall/style.css",
        replacement: preview ? `${libRoot}/dist/rvw.css` : `${libRoot}/src/core/style.css`,
      },
      {
        find: "react-video-wall/interactive",
        replacement: preview
          ? `${libRoot}/dist/interactive.js`
          : `${libRoot}/src/interactive/index.ts`,
      },
      {
        find: "react-video-wall",
        replacement: preview ? `${libRoot}/dist/core.js` : `${libRoot}/src/index.ts`,
      },
    ],
  },
  server: { port: 5173 },
});
