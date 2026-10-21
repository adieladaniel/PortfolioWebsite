import { useEffect, useRef, useState } from 'react';
import { DecodeChars } from './DecodeChars';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  /** Plain-colored lead-in, e.g. "My" */
  prefix: string;
  /** Accent-colored payoff, e.g. "Education" */
  accent: string;
}

/** Self-contained one-way reveal (own IntersectionObserver) so the decode only plays once this heading is actually in view. */
function useRevealed() {
  const ref = useRef<HTMLHeadingElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

/** Two-tone "My Education" style heading: plain prefix, accent payoff, each letter decoding out of random glyphs as it enters. */
export function SectionHeading({ prefix, accent }: SectionHeadingProps) {
  const { ref, revealed } = useRevealed();
  const full = `${prefix} ${accent}`;

  return (
    <h2 ref={ref} className={styles.title} aria-label={full}>
      <DecodeChars
        text={full}
        revealed={revealed}
        charClass={(i) => (i < prefix.length + 1 ? styles.prefixChar : styles.accentChar)}
        charStyle={(i) => ({ transitionDelay: `${i * 18}ms` })}
      />
    </h2>
  );
}
