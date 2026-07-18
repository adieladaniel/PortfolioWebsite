import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '@/store/sceneStore';
import styles from './CustomCursor.module.css';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * A small dot + trailing ring cursor. Grows and shows a label on hover of
 * any `[data-cursor]` DOM element (label text comes from the attribute
 * value), or when a 3D object sets `hoveredProjectId`/`hoveredTopicId` in
 * the scene store (ProjectObject, CodingStatsCluster) — the canvas has no
 * real DOM elements to attach `data-cursor` to, so that hover state has to
 * come from the store instead. Desktop-only: skipped entirely on
 * touch/coarse-pointer devices where a persistent cursor doesn't apply.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [domHover, setDomHover] = useState<string | null>(null);

  const hoveredProjectId = useSceneStore((s) => s.hoveredProjectId);
  const hoveredTopicId = useSceneStore((s) => s.hoveredTopicId);

  const raw = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canHover = window.matchMedia('(pointer: fine)').matches;
    setEnabled(canHover);
    if (!canHover) return;

    document.documentElement.classList.add('customCursorActive');

    const handleMove = (event: MouseEvent) => {
      raw.current.x = event.clientX;
      raw.current.y = event.clientY;
      const dot = dotRef.current;
      if (dot) {
        dot.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
      }
    };

    const handleOver = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest?.('[data-cursor]');
      if (target) setDomHover(target.getAttribute('data-cursor') || '');
    };
    const handleOut = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest?.('[data-cursor]');
      if (target) setDomHover(null);
    };

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseover', handleOver);
    document.addEventListener('mouseout', handleOut);

    let raf: number;
    const tick = () => {
      ringPos.current.x = lerp(ringPos.current.x, raw.current.x, 0.2);
      ringPos.current.y = lerp(ringPos.current.y, raw.current.y, 0.2);
      const ring = ringRef.current;
      if (ring) {
        ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mouseout', handleOut);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('customCursorActive');
    };
  }, []);

  if (!enabled) return null;

  const canvasLabel = hoveredProjectId ? 'view' : hoveredTopicId ? 'explore' : null;
  const label = domHover || canvasLabel;
  const isHovering = label !== null;

  return (
    <>
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring} data-hovering={isHovering}>
        <span className={styles.label}>{label}</span>
      </div>
    </>
  );
}
