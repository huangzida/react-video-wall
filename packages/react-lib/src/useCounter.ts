import { useCallback, useState } from "react";

/**
 * A small counter primitive. Returns the current count plus `inc`/`dec`/`reset`
 * updaters; each updater is stable across renders.
 *
 * @param initial starting value, default `0`
 * @param step    amount added/removed per inc/dec, default `1`
 */
export function useCounter(initial = 0, step = 1) {
  const [count, setCount] = useState(initial);

  const inc = useCallback(() => setCount((c) => c + step), [step]);
  const dec = useCallback(() => setCount((c) => c - step), [step]);
  const reset = useCallback(() => setCount(initial), [initial]);

  return { count, inc, dec, reset };
}
