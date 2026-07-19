import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

const MIN_DURATION = 1100;

/**
 * On-brand loading mask — a HUD-framed percentage readout with a scanning
 * bar, not a generic spinner. Purely cosmetic: masks the brief flash while
 * self-hosted fonts finish loading, doesn't gate mounting of the real
 * content underneath.
 */
export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // The rAF tick loop and the Promise.all completion handler are two
    // independent, uncoordinated timers — a tick() call already *queued*
    // via requestAnimationFrame before Promise.all resolved could still
    // fire afterward (rAF and setTimeout aren't strictly ordered against
    // each other), recomputing a capped `min(99, ...)` value and
    // overwriting progress back down after it had already reached 100.
    // That's the "loads to 100, then drops back to 99" bug. `done` is
    // checked at the very top of tick(), so once the real completion
    // handler runs, any late-firing tick() becomes a no-op instead of
    // clobbering the finished state.
    let done = false;
    const start = performance.now();

    const tick = () => {
      if (cancelled || done) return;
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
      done = true;
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
      <div className={styles.frame}>
        <span className={styles.bracket} data-corner="tl" />
        <span className={styles.bracket} data-corner="tr" />
        <span className={styles.bracket} data-corner="bl" />
        <span className={styles.bracket} data-corner="br" />

        <p className={styles.label}>Initializing</p>

        {/* padStart(2, '0') — was 3, which produced "099" for a 2-digit
            value instead of "99"; 3 digits should only ever appear for the
            genuine "100" case, not be forced padding. */}
        <div className={styles.percent}>
          {String(progress).padStart(2, '0')}
          <span className={styles.percentSign}>%</span>
        </div>

        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${progress}%` }} />
          <div className={styles.scanline} />
        </div>
      </div>
    </div>
  );
}
