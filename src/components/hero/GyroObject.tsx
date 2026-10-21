import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { gyroGeometry as G } from '@/data/hero/gyroGeometry';
import { gyroLabels } from '@/data/hero/labels';
import { clamp01, smooth, type HeroObjectHandle } from './types';
import styles from './HeroObject.module.css';

type Pose = [spin: number, tiltX: number, tiltY: number];

/** Perspective distance, in source pixels: the same value the rings were previewed with. */
const FOCAL = 3000;
/** Room each side of the gyroscope for the labels, in source pixels. */
const PAD = 640;
const OUTER = Math.max(...G.rings.map((r) => r.half));
const FRAME = { w: OUTER * 2 + PAD * 2, h: OUTER * 2 };
const CX = FRAME.w / 2;
const CY = FRAME.h / 2;
const STAGGER = 0.05;

/**
 * Where each ring starts and ends, as [spin, tilt about x, tilt about y] in degrees.
 * The start pose is only slightly tipped, so the closed gyroscope never reads as a
 * flat camera lens; the end pose spreads the rings into a gimbal.
 */
const START: Record<string, Pose> = {
  outer_frame: [0, 0, 0],
  obsidian: [0, 9, -4],
  copper: [0, -6, 11],
  frosted: [0, -10, -7],
  knurled: [0, 8, 14],
  steel: [0, -14, 6],
  core: [0, 0, 0],
};
const END: Record<string, Pose> = {
  outer_frame: [0, 0, 0],
  obsidian: [-50, 58, 0],
  copper: [80, 0, 62],
  frosted: [-140, -42, 34],
  knurled: [200, 20, -58],
  steel: [-260, 66, 14],
  core: [0, 0, 0],
};

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * The same projection the preview renders used (see scripts/hero-sprites): rotate
 * a point on the ring's plane, then divide by distance. Returns where it lands, in
 * source pixels from the centre.
 */
function project(pose: Pose, x: number, y: number): [number, number] {
  const [psi, tx, ty] = pose;
  const cz = Math.cos(rad(psi));
  const sz = Math.sin(rad(psi));
  const cx = Math.cos(rad(tx));
  const sx = Math.sin(rad(tx));
  const cy = Math.cos(rad(ty));
  const sy = Math.sin(rad(ty));
  // R = Ry * Rx * Rz applied to (x, y, 0)
  const ax = cz * x - sz * y;
  const ay = sz * x + cz * y;
  const bx = ax;
  const by = cx * ay;
  const bz = sx * ay;
  const X = cy * bx + sy * bz;
  const Y = by;
  const Z = -sy * bx + cy * bz;
  const s = FOCAL / (FOCAL + Z);
  return [X * s, Y * s];
}

interface Callout {
  name: string;
  side: 'left' | 'right';
  ax: number;
  ay: number;
  lx: number;
  ly: number;
}

/**
 * Callouts: each ring is tagged at the point of its open pose that sits furthest
 * to the side, alternating sides, and the tags are spread evenly down a column on
 * each side in the order of their anchors so the leader lines never cross.
 */
function buildCallouts(): Callout[] {
  const sides = G.rings.map((_, i) => (i % 2 === 0 ? 'right' : 'left') as 'left' | 'right');
  const anchors = G.rings.map((ring, i) => {
    const pose = END[ring.name] ?? [0, 0, 0];
    const radius = ring.name === 'core' ? ring.outer * 0.6 : (ring.inner + ring.outer) / 2;
    let best: [number, number] = [0, 0];
    let bestX = -Infinity;
    for (let a = 0; a < 360; a += 2) {
      const [px, py] = project(pose, Math.cos(rad(a)) * radius, Math.sin(rad(a)) * radius);
      const score = sides[i] === 'right' ? px : -px;
      if (score > bestX) {
        bestX = score;
        best = [px, py];
      }
    }
    return { name: ring.name, side: sides[i] as 'left' | 'right', ax: CX + best[0], ay: CY + best[1] };
  });
  const out: Callout[] = [];
  (['left', 'right'] as const).forEach((side) => {
    const group = anchors.filter((a) => a.side === side).sort((a, b) => a.ay - b.ay);
    group.forEach((a, k) => {
      const ly = FRAME.h * (0.12 + (0.76 * (k + 0.5)) / group.length);
      const lx = side === 'right' ? PAD + OUTER * 2 + 40 : PAD - 40;
      out.push({ ...a, lx, ly });
    });
  });
  return out;
}
const CALLOUTS = buildCallouts();

/**
 * A gyroscope that comes apart as you scroll: each ring is a flat disc cut from
 * one render, tilted and spun in CSS 3D about its own centre, so the nested rings
 * swing into a gimbal. The core stays put. Each ring is one part of an agent.
 */
export const GyroObject = forwardRef<HeroObjectHandle, { initial?: number }>(function GyroObject({ initial = 0 }, ref) {
  const frameRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const progress = useRef(initial);
  const scale = useRef(1);

  const render = () => {
    const p = progress.current;
    const u = clamp01((p - 0.05) / 0.62);
    const labels = clamp01((p - 0.72) / 0.24);
    G.rings.forEach((ring, k) => {
      const el = ringRefs.current[ring.name];
      if (!el) return;
      const e = smooth((u - k * STAGGER) / 0.7);
      const a = START[ring.name] ?? [0, 0, 0];
      const b = END[ring.name] ?? [0, 0, 0];
      const [psi, tx, ty] = [0, 1, 2].map((n) => (a[n] as number) + ((b[n] as number) - (a[n] as number)) * e);
      // CSS looks down -z, the preview maths down +z, so the tilts flip sign
      el.style.transform = `perspective(${(FOCAL * scale.current).toFixed(1)}px) rotateY(${(-(ty as number)).toFixed(2)}deg) rotateX(${(-(tx as number)).toFixed(2)}deg) rotateZ(${(psi as number).toFixed(2)}deg)`;
    });
    frameRef.current?.style.setProperty('--labels', labels.toFixed(3));
  };

  useImperativeHandle(ref, () => ({
    apply: (p: number) => {
      progress.current = p;
      render();
    },
  }));

  // The perspective distance is in screen pixels, so it follows the frame's size.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      scale.current = frame.clientWidth / FRAME.w;
      render();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-kind="gyro"
      style={{ '--ar': FRAME.w / FRAME.h, '--fit': FRAME.w / FRAME.h, '--labels': initial >= 1 ? 1 : 0 } as CSSProperties}
      role="img"
      aria-label="A gyroscope whose nested rings tilt apart, each ring labelled as one part of a trustworthy AI agent"
    >
      {/* Outer ring first, so each inner ring sits on top of the one around it. */}
      {G.rings.map((ring) => {
        const start = START[ring.name] ?? [0, 0, 0];
        return (
          <div
            key={ring.name}
            ref={(el) => {
              ringRefs.current[ring.name] = el;
            }}
            className={styles.piece}
            style={{
              left: pct(CX - ring.half, FRAME.w),
              top: pct(CY - ring.half, FRAME.h),
              width: pct(ring.half * 2, FRAME.w),
              height: pct(ring.half * 2, FRAME.h),
              transform: `rotateY(${-start[2]!}deg) rotateX(${-start[1]!}deg)`,
            }}
          >
            <img src={`/hero/gyro/${ring.file}`} alt="" draggable={false} className={styles.sprite} />
          </div>
        );
      })}

      <svg className={styles.leaders} viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} aria-hidden="true">
        {CALLOUTS.map((c, i) => {
          const bend = c.side === 'right' ? PAD + OUTER * 2 - 40 : PAD + 40;
          const toLabel = c.side === 'right' ? c.lx - 8 : c.lx + 8;
          return (
            <g key={c.name} style={{ '--i': i } as CSSProperties}>
              <path d={`M ${c.ax} ${c.ay} H ${bend} L ${toLabel} ${c.ly}`} pathLength={1} />
              <circle cx={c.ax} cy={c.ay} r="7" />
            </g>
          );
        })}
      </svg>

      {CALLOUTS.map((c, i) => {
        const label = gyroLabels[c.name];
        if (!label) return null;
        return (
          <div
            key={`tag-${c.name}`}
            className={styles.tag}
            data-side={c.side}
            style={{ left: pct(c.lx, FRAME.w), top: pct(c.ly, FRAME.h), '--i': i } as CSSProperties}
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
