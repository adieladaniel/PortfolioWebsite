import type Lenis from 'lenis';

let instance: Lenis | null = null;

/** The running Lenis instance, or null when smooth scroll is off (reduced motion). Set by SmoothScroll. */
export function getLenis(): Lenis | null {
  return instance;
}

export function setLenis(next: Lenis | null): void {
  instance = next;
}
