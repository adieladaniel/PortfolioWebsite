import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

const MIN_DURATION = 600;

/**
 * On-brand loading mask — three tumbling cubes (matches the runway motif)
 * and a mono percentage counter, not a generic spinner. Purely cosmetic:
 * masks the brief flash while self-hosted fonts finish loading, doesn't
 * gate mounting of the real content underneath.
 */
export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = performance.now();

    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      const pct = Math.min(99, Math.round((elapsed / MIN_DURATION) * 100));
      setProgress(pct);
      if (elapsed < MIN_DURATION) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const minWait = new Promise<void>((resolve) => setTimeout(resolve, MIN_DURATION));

    Promise.all([fontsReady, minWait]).then(() => {
      if (cancelled) return;
      setProgress(100);
      setTimeout(() => {
        if (!cancelled) setHidden(true);
      }, 300);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={hidden ? `${styles.screen} ${styles.hidden}` : styles.screen} aria-hidden="true">
      <div className={styles.cubes}>
        <span className={styles.cube} />
        <span className={styles.cube} />
        <span className={styles.cube} />
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.percent}>{String(progress).padStart(3, '0')}%</div>
    </div>
  );
}
