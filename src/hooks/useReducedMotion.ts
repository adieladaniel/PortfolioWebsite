import { useEffect, useRef } from 'react';

/**
 * Returns a ref (not React state) tracking `prefers-reduced-motion` —
 * consumed inside useFrame loops, so a live subscription without
 * triggering React re-renders on change.
 */
export function useReducedMotion() {
  const prefersReduced = useRef(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReduced.current = query.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      prefersReduced.current = event.matches;
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
