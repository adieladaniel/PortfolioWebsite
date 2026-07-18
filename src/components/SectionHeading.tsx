import { useEffect, useRef, useState } from 'react';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  index: string;
  title: string;
  dateRange?: string;
}

/** Self-contained one-way reveal (own IntersectionObserver, doesn't rely on the parent Section) so the character stagger only plays once this heading is actually in view. */
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

export function SectionHeading({ index, title, dateRange }: SectionHeadingProps) {
  const { ref, revealed } = useRevealed();

  return (
    <>
      <div className={styles.wrap}>
        <span className={styles.index}>{index}</span>
        <h2 ref={ref} className={styles.title}>
          {title.split('').map((char, i) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={styles.char}
              data-revealed={revealed}
              style={{ transitionDelay: `${i * 18}ms` }}
            >
              {char === ' ' ? ' ' : char}
            </span>
          ))}
        </h2>
        {dateRange && <span className={styles.dateRange}>{dateRange}</span>}
      </div>
      <div className={styles.rule} />
    </>
  );
}
