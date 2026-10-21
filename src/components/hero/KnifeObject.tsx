import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { knifeGeometry as G } from '@/data/hero/knifeGeometry';
import { knifeLabels } from '@/data/hero/labels';
import { clamp01, smooth, type HeroObjectHandle } from './types';
import styles from './HeroObject.module.css';

/** Room each side of the knife for the labels, in source pixels. */
const PAD_X = 470;
const FRAME = { w: G.size.w + PAD_X * 2, h: G.size.h };
/** Gap between a tool tip and its label. */
const GAP = 46;
const STAGGER = 0.07;
const COUNT = G.openOrder.length;

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

/**
 * A multi-tool knife that opens as you scroll: eight tools, each a sprite that
 * swings about its own hinge pin. Closed, it is a plain pocket knife; open, every
 * tool carries a label, because every tool is a thing I build with.
 */
export const KnifeObject = forwardRef<HeroObjectHandle, { initial?: number }>(function KnifeObject({ initial = 0 }, ref) {
  const frameRef = useRef<HTMLDivElement>(null);
  const toolRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const apply = (progress: number) => {
    const u = clamp01((progress - 0.05) / 0.62);
    const labels = clamp01((progress - 0.72) / 0.24);
    G.openOrder.forEach((name, rank) => {
      const el = toolRefs.current[name];
      const tool = G.tools[name];
      if (!el || !tool) return;
      const e = smooth((u - rank * STAGGER) / (1 - (COUNT - 1) * STAGGER));
      el.style.transform = `rotate(${(tool.delta * (1 - e)).toFixed(2)}deg)`;
    });
    frameRef.current?.style.setProperty('--labels', labels.toFixed(3));
  };

  useImperativeHandle(ref, () => ({ apply }));

  const labelled = G.openOrder.map((name) => G.tools[name]).filter((t): t is NonNullable<typeof t> => !!t);
  const left = labelled.filter((t) => t.name.startsWith('L_')).sort((a, b) => a.tipY - b.tipY);
  const right = labelled.filter((t) => t.name.startsWith('R_')).sort((a, b) => a.tipY - b.tipY);
  const ordered = [...left, ...right];

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-kind="knife"
      style={{ '--ar': FRAME.w / FRAME.h, '--fit': FRAME.w / G.size.w, '--yoff': (G.body.y + G.body.h / 2) / FRAME.h - 0.5, '--labels': initial >= 1 ? 1 : 0 } as CSSProperties}
      role="img"
      aria-label="A multi-tool knife with eight tools folded out, each labelled with something I build with"
    >
      {G.drawOrder.map((name) => {
        const t = G.tools[name];
        if (!t) return null;
        return (
          <div
            key={name}
            ref={(el) => {
              toolRefs.current[name] = el;
            }}
            className={styles.piece}
            style={{
              left: pct(t.x + PAD_X, FRAME.w),
              top: pct(t.y, FRAME.h),
              width: pct(t.w, FRAME.w),
              height: pct(t.h, FRAME.h),
              transformOrigin: `${pct(t.pinX, t.w)} ${pct(t.pinY, t.h)}`,
              transform: `rotate(${initial >= 1 ? 0 : t.delta}deg)`,
            }}
          >
            <img src={`/hero/knife/${name}.webp`} alt="" draggable={false} className={styles.sprite} />
          </div>
        );
      })}
      <div
        className={styles.piece}
        style={{ left: pct(G.body.x + PAD_X, FRAME.w), top: pct(G.body.y, FRAME.h), width: pct(G.body.w, FRAME.w), height: pct(G.body.h, FRAME.h) }}
      >
        <img src="/hero/knife/body.webp" alt="" draggable={false} className={styles.sprite} />
      </div>

      {/* The middle initial of the name, stamped on the handle: it is the "A" in Adiel A Daniel, and goes as the name does. */}
      <span
        className={styles.initial}
        style={{ left: pct(G.body.x + G.body.w / 2 + PAD_X, FRAME.w), top: pct(G.body.y + G.body.h / 2, FRAME.h) }}
        aria-hidden="true"
      >
        A
      </span>

      <svg className={styles.leaders} viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} aria-hidden="true">
        {ordered.map((t, i) => {
          const isLeft = t.name.startsWith('L_');
          const tipX = t.tipX + PAD_X;
          const endX = isLeft ? tipX - GAP : tipX + GAP;
          return (
            <g key={t.name} style={{ '--i': i } as CSSProperties}>
              <path d={`M ${tipX} ${t.tipY} H ${endX}`} pathLength={1} />
              <circle cx={tipX} cy={t.tipY} r="7" />
            </g>
          );
        })}
      </svg>

      {ordered.map((t, i) => {
        const isLeft = t.name.startsWith('L_');
        const label = knifeLabels[t.name];
        if (!label) return null;
        const x = t.tipX + PAD_X + (isLeft ? -GAP - 12 : GAP + 12);
        return (
          <div
            key={`tag-${t.name}`}
            className={styles.tag}
            data-side={isLeft ? 'left' : 'right'}
            style={{ left: pct(x, FRAME.w), top: pct(t.tipY, FRAME.h), '--i': i } as CSSProperties}
            aria-hidden="true"
          >
            <span className={styles.name}>{label.name}</span>
            <span className={styles.note}>{label.note}</span>
          </div>
        );
      })}
    </div>
  );
});
