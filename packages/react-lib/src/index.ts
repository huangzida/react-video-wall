export { Counter } from "./Counter";
export type { CounterProps } from "./Counter";
export { useCounter } from "./useCounter";
import "./style.css"; // ponytail: side-effect import so Vite lib emits dist/index.css; End Users also `import 'react-lib/style.css'`
