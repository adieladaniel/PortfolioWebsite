import { useEffect } from 'react';

/**
 * Feeds the liquid-fill buttons (any `[data-liquid]` element, styled in
 * global.css) the pointer's position inside them, so the fill starts where
 * the cursor came in and retreats toward where it left. One pair of
 * delegated listeners for the whole page; renders nothing.
 */
export function LiquidButtons() {
  useEffect(() => {
    const track = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>('[data-liquid]');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      el.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };
    document.addEventListener('pointerover', track, { passive: true });
    document.addEventListener('pointerout', track, { passive: true });
    return () => {
      document.removeEventListener('pointerover', track);
      document.removeEventListener('pointerout', track);
    };
  }, []);

  return null;
}
