import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
import { sampleTextPoints } from '@/utils/textPoints';
import { linesFragment, linesVertex, pointsFragment, pointsVertex } from './fieldShaders';

/** Which shape the hero stage assembles: a rotating neural network, or the "AD" monogram. */
export type HeroLook = 'network' | 'name';

const PARTICLE_COUNT = { low: 1600, mid: 3000, high: 4500 }[deviceTier];
const NODE_COUNT = deviceTier === 'low' ? 110 : 170;
const MONOGRAM = 'AD';
const FAR_AWAY = 1e4;

interface FieldGeometry {
  points: BufferGeometry;
  lines: BufferGeometry | null;
}

function cssColor(token: string, fallback: string): Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return new Color(raw || fallback);
}

function networkShape(count: number): Float32Array {
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

/** Joins each node to its two nearest neighbours; returns de-duplicated index pairs. */
function nearestEdges(formed: Float32Array, nodeCount: number): Array<[number, number]> {
  const seen = new Set<string>();
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < nodeCount; i++) {
    const near: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < nodeCount; j++) {
      if (j === i) continue;
      const dx = (formed[i * 3] ?? 0) - (formed[j * 3] ?? 0);
      const dy = (formed[i * 3 + 1] ?? 0) - (formed[j * 3 + 1] ?? 0);
      const dz = (formed[i * 3 + 2] ?? 0) - (formed[j * 3 + 2] ?? 0);
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

function buildField(look: HeroLook, textPoints: Float32Array | null): FieldGeometry {
  const n = PARTICLE_COUNT;
  const formed = look === 'name' && textPoints ? textPoints : networkShape(n);

  const cloud = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const size = new Float32Array(n);
  const warm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    cloud[i * 3] = Math.random() * 2 - 1;
    cloud[i * 3 + 1] = Math.random() * 2 - 1;
    cloud[i * 3 + 2] = (Math.random() - 0.5) * 5;
    seed[i] = Math.random();
    const isNode = i < NODE_COUNT;
    size[i] = isNode ? 2.4 + Math.random() * 0.6 : 0.8 + Math.random() * 0.9;
    warm[i] = Math.random() < (isNode ? 0.12 : 0.03) ? 1 : 0;
  }

  const points = new BufferGeometry();
  points.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  points.setAttribute('aFormed', new BufferAttribute(formed, 3));
  points.setAttribute('aCloud', new BufferAttribute(cloud, 3));
  points.setAttribute('aSeed', new BufferAttribute(seed, 1));
  points.setAttribute('aSize', new BufferAttribute(size, 1));
  points.setAttribute('aWarm', new BufferAttribute(warm, 1));

  if (look !== 'network') return { points, lines: null };

  const edges = nearestEdges(formed, NODE_COUNT);
  const v = edges.length * 2;
  const eFormed = new Float32Array(v * 3);
  const eCloud = new Float32Array(v * 3);
  const eSeed = new Float32Array(v);
  const eT = new Float32Array(v);
  const eEdge = new Float32Array(v);
  edges.forEach(([a, b], k) => {
    const edgeId = Math.random();
    [a, b].forEach((idx, end) => {
      const o = k * 2 + end;
      for (let c = 0; c < 3; c++) {
        eFormed[o * 3 + c] = formed[idx * 3 + c] ?? 0;
        eCloud[o * 3 + c] = cloud[idx * 3 + c] ?? 0;
      }
      eSeed[o] = seed[idx] ?? 0;
      eT[o] = end;
      eEdge[o] = edgeId;
    });
  });

  const lines = new BufferGeometry();
  lines.setAttribute('position', new BufferAttribute(new Float32Array(v * 3), 3));
  lines.setAttribute('aFormed', new BufferAttribute(eFormed, 3));
  lines.setAttribute('aCloud', new BufferAttribute(eCloud, 3));
  lines.setAttribute('aSeed', new BufferAttribute(eSeed, 1));
  lines.setAttribute('aT', new BufferAttribute(eT, 1));
  lines.setAttribute('aEdge', new BufferAttribute(eEdge, 1));
  return { points, lines };
}

interface ParticleFieldProps {
  look: HeroLook;
  /** Text points need the display font loaded first, so the monogram waits on this. */
  fontsReady: boolean;
}

/**
 * The page-wide background and the hero centerpiece, one particle system.
 * Near the top it assembles into the hero shape at `#hero-stage`; scrolling
 * dissolves it into a dim cloud that fills the viewport. The cursor pushes
 * particles aside. Everything is GPU-side (see fieldShaders.ts), so the
 * per-frame JS work is just writing a few uniforms.
 */
export function ParticleField({ look, fontsReady }: ParticleFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const clock = useThree((state) => state.clock);
  const sim = useRef({ morph: 0, assemble: 0, startAt: 0.9, mx: FAR_AWAY, my: FAR_AWAY, first: true });
  const stageEl = useRef<HTMLElement | null>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uAssemble: { value: 0 },
      uSpin: { value: 0 },
      uFormedScale: { value: 1 },
      uDim: { value: 1 },
      uPx: { value: 1 },
      uStage: { value: new Vector3() },
      uCloudHalf: { value: new Vector2(5, 3) },
      uMouse: { value: new Vector2(FAR_AWAY, FAR_AWAY) },
      uColor: { value: cssColor('--color-accent', '#22d3ee') },
      uWarmColor: { value: cssColor('--color-signal', '#ffb454') },
    }),
    [],
  );

  const textPoints = useMemo(
    () => (fontsReady ? sampleTextPoints(MONOGRAM, PARTICLE_COUNT, '"Space Grotesk", sans-serif') : null),
    [fontsReady],
  );

  const field = useMemo(() => buildField(look, textPoints), [look, textPoints]);

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
      field.lines?.dispose();
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

  // Replay the assemble intro whenever the hero look changes (and once on load).
  useEffect(() => {
    const s = sim.current;
    s.assemble = 0;
    s.startAt = clock.elapsedTime + (s.first ? 0.9 : 0.1);
    s.first = false;
  }, [look, clock]);

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
    // Raw delta, not clamped: both uses below (an exponential damp and a
    // time-based intro) are frame-rate independent, so a slow frame just
    // advances them further instead of stretching the intro out.
    const dt = delta;
    const s = sim.current;
    const reduced = prefersReducedMotion.current;
    const { width: vw, height: vh } = state.size;

    const camera = state.camera as PerspectiveCamera;
    const worldH = 2 * camera.position.z * Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const pxToWorld = worldH / vh;

    if (!stageEl.current || !stageEl.current.isConnected) {
      stageEl.current = document.getElementById('hero-stage');
    }
    const rect = stageEl.current?.getBoundingClientRect();
    if (rect) {
      uniforms.uStage.value.set(
        (rect.left + rect.width / 2 - vw / 2) * pxToWorld,
        -(rect.top + rect.height / 2 - vh / 2) * pxToWorld,
        0,
      );
      const stageH = rect.height * pxToWorld;
      uniforms.uFormedScale.value =
        look === 'name' ? Math.min(stageH * 0.55, rect.width * pxToWorld * 0.4) : stageH * 0.42;
    }

    uniforms.uCloudHalf.value.set(((worldH * vw) / vh / 2) * 1.05, (worldH / 2) * 1.05);

    const target = MathUtils.clamp(window.scrollY / (vh * 0.8), 0, 1);
    s.morph = reduced ? target : MathUtils.damp(s.morph, target, 6, dt);
    uniforms.uMorph.value = s.morph;

    if (reduced) s.assemble = 1;
    else if (state.clock.elapsedTime >= s.startAt) s.assemble = Math.min(1, s.assemble + dt / 2.8);
    uniforms.uAssemble.value = s.assemble;

    uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime;
    uniforms.uSpin.value = look === 'network' && !reduced ? 1 : 0;
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
      {field.lines && <lineSegments geometry={field.lines} material={linesMaterial} frustumCulled={false} />}
    </>
  );
}
