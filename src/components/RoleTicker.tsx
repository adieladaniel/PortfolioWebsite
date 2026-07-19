import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './RoleTicker.module.css';

interface RoleTickerProps {
  roles: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
}

/** Types out each role character by character, pauses, deletes it back out, then types the next — a real typewriter, not a crossfade. Freezes on the first role (fully typed, no delete) under prefers-reduced-motion. */
export function RoleTicker({ roles, typingSpeedMs = 55, deletingSpeedMs = 30, pauseMs = 1800 }: RoleTickerProps) {
  const [displayText, setDisplayText] = useState('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (roles.length === 0) return;

    if (prefersReducedMotion.current) {
      setDisplayText(roles[0] ?? '');
      return;
    }

    let cancelled = false;
    let timeoutId: number;
    let roleIdx = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      if (cancelled) return;
      const role = roles[roleIdx % roles.length] ?? '';

      if (!deleting) {
        charIndex++;
        setDisplayText(role.slice(0, charIndex));
        if (charIndex >= role.length) {
          if (roles.length <= 1) return; // one role only — finish typed, stay put
          timeoutId = window.setTimeout(() => {
            deleting = true;
            tick();
          }, pauseMs);
          return;
        }
        timeoutId = window.setTimeout(tick, typingSpeedMs);
      } else {
        charIndex--;
        setDisplayText(role.slice(0, charIndex));
        if (charIndex <= 0) {
          deleting = false;
          roleIdx++;
          timeoutId = window.setTimeout(tick, typingSpeedMs);
          return;
        }
        timeoutId = window.setTimeout(tick, deletingSpeedMs);
      }
    };

    timeoutId = window.setTimeout(tick, typingSpeedMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  return (
    <span className={styles.ticker}>
      <span className={styles.text}>{displayText}</span>
      <span className={styles.cursor} aria-hidden="true" />
    </span>
  );
}
