import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: "./tsconfig.json",
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test-setup.ts"],
    }),
  ],
  build: {
    lib: {
      entry: {
        core: "src/index.ts",
        interactive: "src/interactive/index.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      // react-rnd is a peerDep (ADR-0012): externalized, never bundled, so the core
      // entry never pulls it. Core-only consumers pay nothing for the interactive layer.
      external: ["react", "react-dom", "react/jsx-runtime", "react-rnd"],
      output: {
        assetFileNames: "rvw.[ext]",
        // Stable (hash-free) filenames. The two entries share core source (VideoWall,
        // WallContext, ...); Rollup extracts it into one shared chunk so BOTH entries
        // reference the SAME module instances — WallContext MUST stay a singleton across
        // entries or <VideoWall>'s context wouldn't reach <InteractionLayer>. Putting
        // core source in a named "shared" chunk keeps that contract explicit + stable.
        chunkFileNames: "shared.js",
        entryFileNames: "[name].js",
      },
    },
  },
});
