import { useEffect, useRef, useState } from 'react';
import styles from './CustomCursor.module.css';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const SPARK_MIN_DISTANCE = 26; // px of mouse movement before spawning a new spark
const SPARK_LIFETIME_MS = 700;
const RIPPLE_LIFETIME_MS = 600;
const MAGNETIC_STRENGTH = 0.35;

/**
 * The cursor system: a precise dot at the exact pointer position, a
 * trailing HUD-style reticle (four corner brackets, like the loading
 * screen's frame) that locks tight around any `[data-cursor]` target
 * instead of just growing into a bigger circle, a spark trail peeling off
 * as the pointer moves, a click ripple, and a site-wide magnetic pull on
 * any `[data-magnetic]` element. Desktop-only (`pointer: fine`) — skipped
 * entirely on touch devices where a persistent cursor doesn't apply.
 *
 * `[data-magnetic]` is deliberately a *separate* attribute from
 * `[data-cursor]`, not reused — `MagneticLink` (Contact's links, the hero
 * résumé tab) already implements its own local pull independently; if this
 * global handler also grabbed every `[data-cursor]` element, the two would
 * fight over the same element's `transform`. `[data-magnetic]` is only
 * added to plain links that don't already use `MagneticLink`.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const effectsLayerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [domHover, setDomHover] = useState<string | null>(null);

  const raw = useRef({ x: 0, y: 0 });
  const trailPos = useRef({ x: 0, y: 0 });
  const lastSparkPos = useRef({ x: 0, y: 0 });
  const magneticTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const canHover = window.matchMedia('(pointer: fine)').matches;
    setEnabled(canHover);
    if (!canHover) return;

    document.documentElement.classList.add('customCursorActive');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const spawnParticle = (x: number, y: number, kind: 'spark' | 'ripple') => {
      const layer = effectsLayerRef.current;
      if (!layer) return;
      const el = document.createElement('span');
      el.className = (kind === 'spark' ? styles.spark : styles.ripple) ?? '';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      layer.appendChild(el);
      window.setTimeout(() => el.remove(), kind === 'spark' ? SPARK_LIFETIME_MS : RIPPLE_LIFETIME_MS);
    };

    const handleMove = (event: MouseEvent) => {
      raw.current.x = event.clientX;
      raw.current.y = event.clientY;
      const dot = dotRef.current;
      if (dot) {
        dot.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
      }

      if (!reducedMotion) {
        const dx = event.clientX - lastSparkPos.current.x;
        const dy = event.clientY - lastSparkPos.current.y;
        if (Math.hypot(dx, dy) > SPARK_MIN_DISTANCE) {
          lastSparkPos.current = { x: event.clientX, y: event.clientY };
          spawnParticle(event.clientX, event.clientY, 'spark');
        }

        const target = magneticTarget.current;
        if (target) {
          const rect = target.getBoundingClientRect();
          const relX = event.clientX - (rect.left + rect.width / 2);
          const relY = event.clientY - (rect.top + rect.height / 2);
          target.style.transform = `translate(${relX * MAGNETIC_STRENGTH}px, ${relY * MAGNETIC_STRENGTH}px)`;
        }
      }
    };

    const handleOver = (event: MouseEvent) => {
      const el = event.target as HTMLElement;
      const cursorTarget = el?.closest?.('[data-cursor]');
      if (cursorTarget) setDomHover(cursorTarget.getAttribute('data-cursor') || '');

      if (reducedMotion) return;
      const magTarget = el?.closest?.('[data-magnetic]') as HTMLElement | null;
      if (magTarget && magTarget !== magneticTarget.current) {
        if (magneticTarget.current) magneticTarget.current.style.transform = '';
        magneticTarget.current = magTarget;
      }
    };

    const handleOut = (event: MouseEvent) => {
      const el = event.target as HTMLElement;
      const related = event.relatedTarget as HTMLElement | null;

      // Compare against the element being entered, not just "did this one
      // element fire mouseout" — mouseout fires when moving between nested
      // children of the same target too, which would otherwise reset the
      // label/pull and immediately re-trigger it, reading as a flicker.
      const cursorTarget = el?.closest?.('[data-cursor]');
      const cursorRelated = related?.closest?.('[data-cursor]');
      if (cursorTarget && cursorTarget !== cursorRelated) setDomHover(null);

      if (reducedMotion) return;
      const magTarget = el?.closest?.('[data-magnetic]') as HTMLElement | null;
      const magRelated = related?.closest?.('[data-magnetic]') as HTMLElement | null;
      if (magTarget && magTarget !== magRelated) {
        magTarget.style.transform = '';
        if (magneticTarget.current === magTarget) magneticTarget.current = null;
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (reducedMotion) return;
      spawnParticle(event.clientX, event.clientY, 'ripple');
    };

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseover', handleOver);
    document.addEventListener('mouseout', handleOut);
    window.addEventListener('click', handleClick);

    let raf: number;
    const tick = () => {
      trailPos.current.x = lerp(trailPos.current.x, raw.current.x, 0.18);
      trailPos.current.y = lerp(trailPos.current.y, raw.current.y, 0.18);
      const reticle = reticleRef.current;
      if (reticle) {
        reticle.style.transform = `translate(${trailPos.current.x}px, ${trailPos.current.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mouseout', handleOut);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('customCursorActive');
      if (magneticTarget.current) magneticTarget.current.style.transform = '';
    };
  }, []);

  if (!enabled) return null;

  const isHovering = domHover !== null;

  return (
    <>
      <div ref={dotRef} className={styles.dot} />
      <div ref={reticleRef} className={styles.reticle} data-hovering={isHovering}>
        <span className={styles.bracket} data-corner="tl" />
        <span className={styles.bracket} data-corner="tr" />
        <span className={styles.bracket} data-corner="bl" />
        <span className={styles.bracket} data-corner="br" />
        <span className={styles.label}>{domHover}</span>
      </div>
      <div ref={effectsLayerRef} className={styles.effectsLayer} aria-hidden="true" />
    </>
  );
}
