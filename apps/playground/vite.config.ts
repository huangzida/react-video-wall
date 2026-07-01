import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const libRoot = fileURLToPath(new URL("../../packages/react-lib", import.meta.url));

// PREVIEW=1 resolves react-lib to its BUILT dist — the CI dist-verification path
// (ADR-0006). The default (dev) resolves to SOURCE so HMR edits the lib live.
const preview = process.env.PREVIEW === "1";

export default defineConfig({
  // ponytail: GitHub Pages project pages serve under /<repo>/, so the deploy sets
  // PAGES_BASE=/starter-react/ and assets resolve correctly. Default '/' for dev/CI.
  base: process.env.PAGES_BASE ?? "/",
  plugins: [react()],
  resolve: {
    alias: [
      // ponytail: more specific subpath MUST come before the bare specifier, or the
      // bare 'react-lib' prefix would swallow 'react-lib/style.css'.
      {
        find: "react-lib/style.css",
        replacement: preview ? `${libRoot}/dist/index.css` : `${libRoot}/src/style.css`,
      },
      {
        find: "react-lib",
        replacement: preview ? `${libRoot}/dist/index.js` : `${libRoot}/src/index.ts`,
      },
    ],
  },
  server: { port: 5173 },
});
