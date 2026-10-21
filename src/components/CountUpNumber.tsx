import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}

/** Counts up from 0 to `value` once scrolled into view (one-way, like Section's reveal). Skips the animation under prefers-reduced-motion. */
export function CountUpNumber({ value, decimals = 0, prefix = '', suffix = '', durationMs = 1200 }: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started.current) continue;
          started.current = true;
          const start = performance.now();

          const tick = (now: number) => {
            // rAF's timestamp is the frame's start, which can predate `start`, so clamp at 0 or the count dips below zero
            const t = Math.min(1, Math.max(0, (now - start) / durationMs));
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(value * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
