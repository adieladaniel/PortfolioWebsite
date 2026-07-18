import { useEffect, useState } from 'react';
import styles from './RoleTicker.module.css';

interface RoleTickerProps {
  roles: string[];
  intervalMs?: number;
}

/** Cycles through a list of role labels with a fade-slide transition; freezes on the first entry under prefers-reduced-motion. */
export function RoleTicker({ roles, intervalMs = 2600 }: RoleTickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (roles.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % roles.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [roles.length, intervalMs]);

  const role = roles[index] ?? roles[0];

  return (
    <span className={styles.ticker}>
      <span key={index} className={styles.role}>
        {role}
      </span>
    </span>
  );
}
