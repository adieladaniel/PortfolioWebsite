import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  id: string;
  /** Zigzags content against the runway visible on the other side; 'center' keeps the old full-width layout. */
  align?: 'left' | 'right' | 'center';
}

export function Section({ id, align = 'center', children }: PropsWithChildren<SectionProps>) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={styles.section} data-revealed={revealed} data-align={align}>
      {children}
    </section>
  );
}
