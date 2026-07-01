import { useCounter } from "./useCounter";
import styles from "./Counter.module.css";

/** Props for {@link Counter}. */
export interface CounterProps {
  /** Initial count value (default `0`). */
  initial?: number;
  /** Step size for increment/decrement (default `1`). */
  step?: number;
}

/** A minimal accessible counter: decrement / count / increment / reset. */
export function Counter({ initial = 0, step = 1 }: CounterProps) {
  const { count, inc, dec, reset } = useCounter(initial, step);

  return (
    <div className={styles.counter}>
      <button type="button" aria-label="decrement" className={styles.btn} onClick={dec}>
        −
      </button>
      <output className={styles.count}>{count}</output>
      <button type="button" aria-label="increment" className={styles.btn} onClick={inc}>
        +
      </button>
      <button type="button" className={styles.reset} onClick={reset}>
        reset
      </button>
    </div>
  );
}
