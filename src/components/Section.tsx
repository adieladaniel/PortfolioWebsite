import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  id: string;
}

export function Section({ id, children }: PropsWithChildren<SectionProps>) {
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
      // Reveal as soon as any part is inside the viewport (minus a bottom margin),
      // not once a fraction of the section is: stacked on a phone, the projects
      // section is taller than a screen and a fractional threshold never fires.
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={styles.section} data-revealed={revealed}>
      {children}
    </section>
  );
}
