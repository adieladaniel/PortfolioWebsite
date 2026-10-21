import { useEffect, useRef, useState } from 'react';
import styles from './CopyEmailButton.module.css';

const BURST_COUNT = 16;
const BURST_LIFETIME_MS = 800;
const COPIED_RESET_MS = 2200;

/** Falls back to a hidden textarea where the async clipboard API is unavailable (older browsers, insecure origins). */
async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

/** Copies `value` to the clipboard and answers with a small burst of particles from the button. */
export function CopyEmailButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const burstRef = useRef<HTMLSpanElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const burst = () => {
    const layer = burstRef.current;
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 36 + Math.random() * 44;
      const spark = document.createElement('span');
      spark.className = styles.spark ?? '';
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      if (i % 5 === 0) spark.dataset.warm = 'true';
      layer.appendChild(spark);
      window.setTimeout(() => spark.remove(), BURST_LIFETIME_MS);
    }
  };

  const handleClick = async () => {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    burst();
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  // The burst layer is a sibling of the button, not a child: liquid buttons
  // clip their contents, which would cut the sparks off.
  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        data-liquid
        data-cursor="copy"
        data-magnetic
        data-copied={copied}
        onClick={handleClick}
      >
        <span aria-live="polite">{copied ? 'copied ✓' : 'copy email'}</span>
      </button>
      <span className={styles.burst} ref={burstRef} aria-hidden="true" />
    </span>
  );
}
