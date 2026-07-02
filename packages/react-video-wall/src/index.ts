// Entry "." (ADR-0013 core). The base CSS is a build side-effect import: it must
// sit at the entry so Vite lib mode extracts it to dist (a transitive `export *`
// does not preserve a side-effect import for tree-shaking). Consumers also
// `import 'react-video-wall/style.css'` if they need it explicitly.
import "./core/style.css";

export * from "./core";
