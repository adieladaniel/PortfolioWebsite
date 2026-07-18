import styles from './NoWebGLFallback.module.css';

/**
 * Stands in for the 3D canvas when WebGL2 isn't available — a static,
 * on-brand backdrop (no JS animation, no draw calls) rather than a blank
 * page. The DOM sections are content-complete independent of the 3D layer
 * (Stage 1), so this is the only thing that needs to change.
 */
export function NoWebGLFallback() {
  return <div className={styles.fallback} aria-hidden="true" />;
}
