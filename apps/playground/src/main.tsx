import { createRoot } from "react-dom/client";
import { App } from "./App";
// Consume the pre-compiled CSS exactly like an End User would — the whole point of
// the playground (CONTEXT.md). The alias in vite.config.ts points this at source or
// dist depending on PREVIEW.
import "react-lib/style.css";

createRoot(document.getElementById("root")!).render(<App />);
