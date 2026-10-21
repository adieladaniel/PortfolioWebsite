import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  ShaderMaterial,
  Vector2,
  Vector3,
  type PerspectiveCamera,
} from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { deviceTier } from '@/utils/deviceTier';
import { linesFragment, linesVertex, pointsFragment, pointsVertex } from './fieldShaders';

const PARTICLE_COUNT = { low: 1600, mid: 3000, high: 4500 }[deviceTier];
/** Share of particles that make up the travelling ball; the rest are background cloud. */
const BALL_SHARE = 0.55;
const NODE_COUNT = deviceTier === 'low' ? 110 : 170;
const FAR_AWAY = 1e4;

/**
 * The ball's route through the page. Each anchor is an element in the DOM
 * that says where the ball stands in that scene (its centre), plus how big,
 * which shape and how bright it is there. Listed in document order; as the
 * viewport's midline passes from one anchor to the next, the ball glides
 * between them. Layout owns the placement, so moving a marker element moves
 * the ball.
 */
interface Anchor {
  id: string;
  /** Blend of [sphere, spine, orbit]. */
  shape: [number, number, number];
  /** Radius as a fraction of the anchor's smaller side ('min') or of the viewport height ('vh'). */
  fit: 'min' | 'vh';
  k: number;
  alpha: number;
  /** 0 to 1: how strongly the ball beats like a heart in this scene. */
  pulse?: number;
  /**
   * Where inside the anchor's box the ball stands, as [x, y] fractions from
   * its top-left. Defaults to the centre. Which anchor the ball is "at"
   * is always decided by the box's centre, so a big box can host a ball
   * parked in one corner without disturbing the timing.
   */
  at?: [number, number];
}

const ANCHORS: Anchor[] = [
  { id: 'hero-stage', shape: [1, 0, 0], fit: 'min', k: 0.42, alpha: 1 },
  { id: 'ball-about', shape: [1, 0, 0], fit: 'min', k: 0.42, alpha: 0.85 },
  { id: 'ball-experience', shape: [0, 1, 0], fit: 'vh', k: 0.3, alpha: 0.7 },
  { id: 'ball-projects', shape: [0, 0, 1], fit: 'vh', k: 0.11, alpha: 0.85, at: [0.93, 0.13] },
  { id: 'ball-education', shape: [0, 0, 1], fit: 'vh', k: 0.11, alpha: 0.85, at: [0.93, 0.13] },
  { id: 'ball-contact', shape: [1, 0, 0], fit: 'min', k: 0.34, alpha: 1, pulse: 1 },
];

interface AnchorSample {
  /** Where the ball stands. */
  cx: number;
  cy: number;
  /** Vertical centre of the anchor's box: decides which scene the viewport midline is in. */
  mid: number;
  radius: number;
  shape: [number, number, number];
  alpha: number;
  pulse: number;
}

interface BallState {
  x: number;
  y: number;
  radius: number;
  w0: number;
  w1: number;
  w2: number;
  alpha: number;
  pulse: number;
}

interface FieldGeometry {
  points: BufferGeometry;
  lines: BufferGeometry;
}

function cssColor(token: string, fallback: string): Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return new Color(raw || fallback);
}

function sphereShape(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 0.3 + 0.7 * Math.pow(Math.random(), 0.45);
    out[i * 3] = s * Math.cos(theta) * r * 1.25;
    out[i * 3 + 1] = u * r;
    out[i * 3 + 2] = s * Math.sin(theta) * r;
  }
  return out;
}

/**
 * The other two shapes are continuous remaps of the sphere, so particles that
 * are neighbours in the ball stay neighbours, and the network's edges never
 * turn into long streaks mid-morph. Spine: a tall thin helix (Experience's
 * timeline). Orbit: a flat tilted band (Projects and Education).
 */
function spineShape(sphere: Float32Array): Float32Array {
  const out = new Float32Array(sphere.length);
  for (let i = 0; i < sphere.length; i += 3) {
    const x = sphere[i] ?? 0;
    const y = sphere[i + 1] ?? 0;
    const z = sphere[i + 2] ?? 0;
    out[i] = x * 0.16 + 0.05 * Math.sin(y * 5);
    out[i + 1] = y * 1.9;
    out[i + 2] = z * 0.16 + 0.05 * Math.cos(y * 5);
  }
  return out;
}

function orbitShape(sphere: Float32Array): Float32Array {
  const out = new Float32Array(sphere.length);
  const tilt = 0.5;
  for (let i = 0; i < sphere.length; i += 3) {
    const x = (sphere[i] ?? 0) / 1.25;
    const y = sphere[i + 1] ?? 0;
    const z = sphere[i + 2] ?? 0;
    const angle = Math.atan2(z, x);
    const radius = 0.72 + 0.28 * Math.min(1, Math.hypot(x, z));
    const px = Math.cos(angle) * radius * 1.35;
    const pz = Math.sin(angle) * radius * 1.35;
    const py = y * 0.1;
    out[i] = px;
    out[i + 1] = py * Math.cos(tilt) - pz * Math.sin(tilt);
    out[i + 2] = py * Math.sin(tilt) + pz * Math.cos(tilt);
  }
  return out;
}

/** Joins each node to its two nearest neighbours in the sphere; returns de-duplicated index pairs. */
function nearestEdges(sphere: Float32Array, nodeCount: number): Array<[number, number]> {
  const seen = new Set<string>();
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < nodeCount; i++) {
    const near: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < nodeCount; j++) {
      if (j === i) continue;
      const dx = (sphere[i * 3] ?? 0) - (sphere[j * 3] ?? 0);
      const dy = (sphere[i * 3 + 1] ?? 0) - (sphere[j * 3 + 1] ?? 0);
      const dz = (sphere[i * 3 + 2] ?? 0) - (sphere[j * 3 + 2] ?? 0);
      near.push({ j, d: dx * dx + dy * dy + dz * dz });
    }
    near.sort((a, b) => a.d - b.d);
    for (const { j } of near.slice(0, 2)) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([i, j]);
    }
  }
  return edges;
}

function buildField(): FieldGeometry {
  const n = PARTICLE_COUNT;
  const ballCount = Math.round(n * BALL_SHARE);
  const shape0 = sphereShape(n);
  const shape1 = spineShape(shape0);
  const shape2 = orbitShape(shape0);

  const cloud = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const size = new Float32Array(n);
  const warm = new Float32Array(n);
  const group = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    cloud[i * 3] = Math.random() * 2 - 1;
    cloud[i * 3 + 1] = Math.random() * 2 - 1;
    cloud[i * 3 + 2] = (Math.random() - 0.5) * 5;
    seed[i] = Math.random();
    const isNode = i < NODE_COUNT;
    size[i] = isNode ? 2.4 + Math.random() * 0.6 : 0.8 + Math.random() * 0.9;
    warm[i] = Math.random() < (isNode ? 0.12 : 0.03) ? 1 : 0;
    group[i] = i < ballCount ? 0 : 1;
  }

  const points = new BufferGeometry();
  points.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  points.setAttribute('aShape0', new BufferAttribute(shape0, 3));
  points.setAttribute('aShape1', new BufferAttribute(shape1, 3));
  points.setAttribute('aShape2', new BufferAttribute(shape2, 3));
  points.setAttribute('aCloud', new BufferAttribute(cloud, 3));
  points.setAttribute('aSeed', new BufferAttribute(seed, 1));
  points.setAttribute('aSize', new BufferAttribute(size, 1));
  points.setAttribute('aWarm', new BufferAttribute(warm, 1));
  points.setAttribute('aGroup', new BufferAttribute(group, 1));

  const edges = nearestEdges(shape0, NODE_COUNT);
  const v = edges.length * 2;
  const e0 = new Float32Array(v * 3);
  const e1 = new Float32Array(v * 3);
  const e2 = new Float32Array(v * 3);
  const eCloud = new Float32Array(v * 3);
  const eSeed = new Float32Array(v);
  const eT = new Float32Array(v);
  const eEdge = new Float32Array(v);
  edges.forEach(([a, b], k) => {
    const edgeId = Math.random();
    [a, b].forEach((idx, end) => {
      const o = k * 2 + end;
      for (let c = 0; c < 3; c++) {
        e0[o * 3 + c] = shape0[idx * 3 + c] ?? 0;
        e1[o * 3 + c] = shape1[idx * 3 + c] ?? 0;
        e2[o * 3 + c] = shape2[idx * 3 + c] ?? 0;
        eCloud[o * 3 + c] = cloud[idx * 3 + c] ?? 0;
      }
      eSeed[o] = seed[idx] ?? 0;
      eT[o] = end;
      eEdge[o] = edgeId;
    });
  });

  const lines = new BufferGeometry();
  lines.setAttribute('position', new BufferAttribute(new Float32Array(v * 3), 3));
  lines.setAttribute('aShape0', new BufferAttribute(e0, 3));
  lines.setAttribute('aShape1', new BufferAttribute(e1, 3));
  lines.setAttribute('aShape2', new BufferAttribute(e2, 3));
  lines.setAttribute('aCloud', new BufferAttribute(eCloud, 3));
  lines.setAttribute('aSeed', new BufferAttribute(eSeed, 1));
  lines.setAttribute('aT', new BufferAttribute(eT, 1));
  lines.setAttribute('aEdge', new BufferAttribute(eEdge, 1));
  lines.setAttribute('aGroup', new BufferAttribute(new Float32Array(v), 1));
  return { points, lines };
}

function smoothstep(t: number): number {
  const c = MathUtils.clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

/**
 * Works out where the ball should be this frame: finds the two anchors the
 * viewport's midline sits between and blends them. Position's y uses the
 * linear fraction (for centred anchors that keeps the ball vertically
 * centred while it travels), everything else uses an eased fraction so the
 * ball lingers in each scene and moves mostly in the gaps. Before the first
 * anchor and after the last, the ball rides with that anchor as the page
 * scrolls.
 */
function targetBall(samples: AnchorSample[], mid: number): BallState | null {
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last) return null;

  let a = first;
  let b = first;
  let u = 0;
  if (mid >= last.mid) {
    a = last;
    b = last;
  } else if (mid > first.mid) {
    for (let i = 0; i < samples.length - 1; i++) {
      const s0 = samples[i];
      const s1 = samples[i + 1];
      if (s0 && s1 && s0.mid <= mid && mid < s1.mid) {
        a = s0;
        b = s1;
        u = (mid - s0.mid) / (s1.mid - s0.mid);
        break;
      }
    }
  }

  const e = smoothstep(u);
  return {
    x: MathUtils.lerp(a.cx, b.cx, e),
    y: MathUtils.lerp(a.cy, b.cy, u),
    radius: MathUtils.lerp(a.radius, b.radius, e),
    w0: MathUtils.lerp(a.shape[0], b.shape[0], e),
    w1: MathUtils.lerp(a.shape[1], b.shape[1], e),
    w2: MathUtils.lerp(a.shape[2], b.shape[2], e),
    alpha: MathUtils.lerp(a.alpha, b.alpha, e),
    pulse: MathUtils.lerp(a.pulse, b.pulse, e),
  };
}

/**
 * The page-wide background and the travelling centrepiece, one particle
 * system. A neural-network ball assembles in the hero, then follows the
 * scroll from scene to scene (see ANCHORS), reshaping as it goes, while a
 * dim cloud of particles stays behind it as the background. The cursor
 * pushes particles aside. Everything is GPU-side (see fieldShaders.ts), so
 * the per-frame JS work is a few DOM reads and uniform writes.
 */
export function ParticleField() {
  const prefersReducedMotion = useReducedMotion();
  const sim = useRef({ assemble: 0, startAt: 0.9, mx: FAR_AWAY, my: FAR_AWAY, ball: null as BallState | null });
  const anchorEls = useRef<Array<HTMLElement | null>>(ANCHORS.map(() => null));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uSpin: { value: 0 },
      uBallScale: { value: 1 },
      uBallAlpha: { value: 1 },
      uCloudScroll: { value: 0 },
      uPulse: { value: 0 },
      uPx: { value: 1 },
      uBall: { value: new Vector3() },
      uShapeW: { value: new Vector3(1, 0, 0) },
      uCloudHalf: { value: new Vector2(5, 3) },
      uMouse: { value: new Vector2(FAR_AWAY, FAR_AWAY) },
      uColor: { value: cssColor('--color-accent', '#22d3ee') },
      uWarmColor: { value: cssColor('--color-signal', '#ffb454') },
    }),
    [],
  );

  const field = useMemo(buildField, []);

  const pointsMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: pointsVertex,
        fragmentShader: pointsFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [uniforms],
  );

  const linesMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: linesVertex,
        fragmentShader: linesFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [uniforms],
  );

  useEffect(
    () => () => {
      field.points.dispose();
      field.lines.dispose();
    },
    [field],
  );

  useEffect(
    () => () => {
      pointsMaterial.dispose();
      linesMaterial.dispose();
    },
    [pointsMaterial, linesMaterial],
  );

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      sim.current.mx = event.clientX;
      sim.current.my = event.clientY;
    };
    const handleLeave = () => {
      sim.current.mx = FAR_AWAY;
      sim.current.my = FAR_AWAY;
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  useFrame((state, delta) => {
    // Raw delta, not clamped: every use below (exponential damps and a
    // time-based intro) is frame-rate independent, so a slow frame just
    // advances them further instead of stretching things out.
    const dt = delta;
    const s = sim.current;
    const reduced = prefersReducedMotion.current;
    const { width: vw, height: vh } = state.size;

    const camera = state.camera as PerspectiveCamera;
    const worldH = 2 * camera.position.z * Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const pxToWorld = worldH / vh;

    const samples: AnchorSample[] = [];
    ANCHORS.forEach((anchor, i) => {
      let el = anchorEls.current[i];
      if (!el || !el.isConnected) {
        el = document.getElementById(anchor.id);
        anchorEls.current[i] = el;
      }
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const [fx, fy] = anchor.at ?? [0.5, 0.5];
      samples.push({
        cx: rect.left + rect.width * fx,
        cy: rect.top + rect.height * fy,
        mid: rect.top + rect.height / 2,
        radius: (anchor.fit === 'vh' ? vh : Math.min(rect.width, rect.height)) * anchor.k,
        shape: anchor.shape,
        alpha: anchor.alpha,
        pulse: anchor.pulse ?? 0,
      });
    });

    const target = targetBall(samples, vh / 2);
    if (target) {
      const cur = s.ball ?? target;
      if (reduced || !s.ball) {
        s.ball = target;
      } else {
        const rate = 8;
        s.ball = {
          x: MathUtils.damp(cur.x, target.x, rate, dt),
          y: MathUtils.damp(cur.y, target.y, rate, dt),
          radius: MathUtils.damp(cur.radius, target.radius, rate, dt),
          w0: MathUtils.damp(cur.w0, target.w0, rate, dt),
          w1: MathUtils.damp(cur.w1, target.w1, rate, dt),
          w2: MathUtils.damp(cur.w2, target.w2, rate, dt),
          alpha: MathUtils.damp(cur.alpha, target.alpha, rate, dt),
          pulse: MathUtils.damp(cur.pulse, target.pulse, rate, dt),
        };
      }
      const ball = s.ball;
      uniforms.uBall.value.set((ball.x - vw / 2) * pxToWorld, -(ball.y - vh / 2) * pxToWorld, 0);
      uniforms.uBallScale.value = ball.radius * pxToWorld;
      uniforms.uShapeW.value.set(ball.w0, ball.w1, ball.w2);
      uniforms.uBallAlpha.value = ball.alpha;
      uniforms.uPulse.value = reduced ? 0 : ball.pulse;
    }

    uniforms.uCloudHalf.value.set(((worldH * vw) / vh / 2) * 1.05, (worldH / 2) * 1.05);
    uniforms.uCloudScroll.value = window.scrollY * pxToWorld * 0.35;

    if (reduced) s.assemble = 1;
    else if (state.clock.elapsedTime >= s.startAt) s.assemble = Math.min(1, s.assemble + dt / 2.8);
    uniforms.uAssemble.value = s.assemble;

    uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime;
    uniforms.uSpin.value = reduced ? 0 : 1;
    uniforms.uPx.value = state.gl.getPixelRatio();

    const mouse = uniforms.uMouse.value;
    if (s.mx >= FAR_AWAY || reduced) {
      mouse.set(FAR_AWAY, FAR_AWAY);
    } else {
      const tx = (s.mx - vw / 2) * pxToWorld;
      const ty = -(s.my - vh / 2) * pxToWorld;
      if (mouse.x >= FAR_AWAY) mouse.set(tx, ty);
      else mouse.set(MathUtils.damp(mouse.x, tx, 14, dt), MathUtils.damp(mouse.y, ty, 14, dt));
    }
  });

  return (
    <>
      <points geometry={field.points} material={pointsMaterial} frustumCulled={false} />
      <lineSegments geometry={field.lines} material={linesMaterial} frustumCulled={false} />
    </>
  );
}
