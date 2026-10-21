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
/** Each ring starts whirling a touch after the one outside it. */
const STAGGER = 0.025;

interface RingMotion {
  /** The pose it rests in, tipped slightly so the gyroscope never reads as a flat camera lens: [tilt about x, tilt about y] in degrees. */
  rest: [number, number];
  /** How far it tips at the height of the whirl, degrees. */
  tilt: number;
  /** Full turns about its own axis over the whole scroll (negative: the other way). */
  turns: number;
  /** Full turns its tilt direction sweeps round: the ring wobbles round like a gyroscope precessing. */
  sweeps: number;
  /** Degrees per second it keeps turning at rest, so it never looks stopped. */
  idle: number;
}

/**
 * Every ring keeps turning the whole way: the spin and the wobble are whole
 * numbers of revolutions over the scroll, so the scroll ends exactly where it
 * started, never caught mid-turn. The tilt swells to a whirl and settles back to
 * the assembled gyroscope, where the labels land. The outer frame and core stay put.
 */
const MOTION: Record<string, RingMotion> = {
  outer_frame: { rest: [0, 0], tilt: 0, turns: 0, sweeps: 0, idle: 0 },
  obsidian: { rest: [9, -4], tilt: 58, turns: -1, sweeps: 1, idle: -5 },
  copper: { rest: [-6, 11], tilt: 62, turns: 2, sweeps: -1, idle: 8 },
  frosted: { rest: [-10, -7], tilt: 52, turns: -2, sweeps: 1, idle: -11 },
  knurled: { rest: [8, 14], tilt: 60, turns: 3, sweeps: -2, idle: 14 },
  steel: { rest: [-14, 6], tilt: 66, turns: -3, sweeps: 2, idle: -18 },
  core: { rest: [0, 0], tilt: 0, turns: 0, sweeps: 0, idle: 0 },
};

/** Whirl strength, 0 at rest to 1 at full: swells in over the first part of the scroll, eases out before the labels. */
const whirl = (p: number) => smooth((p - 0.03) / 0.27) * (1 - smooth((p - 0.55) / 0.3));
/** When the labels come in. */
const labelsAt = (p: number) => clamp01((p - 0.82) / 0.16);

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;
const rad = (d: number) => (d * Math.PI) / 180;

/** Where a ring is at scroll progress `p` after `seconds` of idle turning: [spin, tilt about x, tilt about y] in degrees. */
function poseAt(name: string, index: number, p: number, seconds: number): Pose {
  const m = MOTION[name];
  if (!m) return [0, 0, 0];
  const w = whirl(p - index * STAGGER);
  const r0 = Math.hypot(m.rest[0], m.rest[1]);
  const a0 = Math.atan2(m.rest[1], m.rest[0]);
  const size = r0 + (m.tilt - r0) * w;
  const angle = a0 + rad(m.sweeps * 360 * clamp01(p));
  return [m.turns * 360 * p + m.idle * seconds, size * Math.cos(angle), size * Math.sin(angle)];
}

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
  const by = cx * ay;
  const bz = sx * ay;
  const X = cy * ax + sy * bz;
  const Y = by;
  const Z = -sy * ax + cy * bz;
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
 * Callouts: each ring is tagged at the point of its resting pose that sits furthest
 * to the side, alternating sides, and the tags are spread evenly down a column on
 * each side in the order of their anchors so the leader lines never cross.
 */
function buildCallouts(): Callout[] {
  const sides = G.rings.map((_, i) => (i % 2 === 0 ? 'right' : 'left') as 'left' | 'right');
  const anchors = G.rings.map((ring, i) => {
    const pose = poseAt(ring.name, i, 1, 0);
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

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A gyroscope that whirls as you scroll: each ring is a flat disc cut from one
 * render, spun and tipped in CSS 3D about its own centre, so the nested rings
 * wobble round like a gimbal. They never stop turning: scroll sets how hard they
 * whirl, and at rest they keep a slow spin. Each ring is one part of an agent.
 */
export const GyroObject = forwardRef<HeroObjectHandle, { initial?: number }>(function GyroObject({ initial = 0 }, ref) {
  const frameRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const progress = useRef(initial);
  const clock = useRef(0);
  const scale = useRef(1);

  const render = () => {
    const p = progress.current;
    G.rings.forEach((ring, k) => {
      const el = ringRefs.current[ring.name];
      if (!el) return;
      const [psi, tx, ty] = poseAt(ring.name, k, p, clock.current);
      // CSS looks down -z, the preview maths down +z, so the tilts flip sign
      el.style.transform = `perspective(${(FOCAL * scale.current).toFixed(1)}px) rotateY(${(-ty).toFixed(2)}deg) rotateX(${(-tx).toFixed(2)}deg) rotateZ(${psi.toFixed(2)}deg)`;
    });
    frameRef.current?.style.setProperty('--labels', labelsAt(p).toFixed(3));
  };

  useImperativeHandle(ref, () => ({
    apply: (p: number) => {
      progress.current = p;
      render();
    },
  }));

  // The perspective distance is in screen pixels, so it follows the frame's size.
  // The clock keeps the rings turning at rest, and only runs while the gyroscope is on screen.
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

    let raf = 0;
    let last = 0;
    let visible = true;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        last = 0;
        return;
      }
      if (last) clock.current += Math.min(0.1, (now - last) / 1000);
      last = now;
      render();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(frame);
    if (!reducedMotion()) raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-kind="gyro"
      style={{ '--ar': FRAME.w / FRAME.h, '--fit': FRAME.w / FRAME.h, '--labels': initial >= 1 ? 1 : 0 } as CSSProperties}
      role="img"
      aria-label="A gyroscope whose nested rings whirl as you scroll, each ring labelled as one part of a trustworthy AI agent"
    >
      {/* Outer ring first, so each inner ring sits on top of the one around it. */}
      {G.rings.map((ring, k) => {
        const [, tx, ty] = poseAt(ring.name, k, initial, 0);
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
              transform: `rotateY(${-ty}deg) rotateX(${-tx}deg)`,
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
