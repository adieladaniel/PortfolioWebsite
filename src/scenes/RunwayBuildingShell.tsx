import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { Color, Group, Mesh, MeshBasicMaterial, ShaderMaterial } from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { clamp01 } from '@/utils/math';
import { hashStringToSeed } from '@/utils/prng';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { vertexShader, fragmentShader } from '@/shaders/buildingFacade.glsl';
import { cubeGroups, FOOTPRINT, PROXIMITY_SPREAD, type CubeGroup } from './runwayCubes';

const MAX_SHELL_OPACITY = 0.94;
const MAX_FLOOR_LINE_OPACITY = 0.5;
const MAX_BEACON_OPACITY = 0.9;

// Real height per floor, in world units — floor *count* is derived from this
// rather than hardcoded, so a stubby 0.5-unit early-milestone building gets
// ~2 floors and a 3.4-unit "now" tower gets ~8, instead of every building
// squeezing/stretching the same fixed window grid across whatever height it
// happens to have.
const FLOOR_UNIT = 0.45;
const MIN_FLOORS = 2;
const MAX_FLOORS = 9;

function computeFloors(height: number): number {
  return Math.max(MIN_FLOORS, Math.min(MAX_FLOORS, Math.round(height / FLOOR_UNIT)));
}

/**
 * Answers "just a plain cuboid, no look of an actual building?" — this is
 * the fix: the shell's faces render an actual lit-window facade (dark
 * mullion grid, each window randomly lit/unlit with a slow per-window
 * flicker) via a custom shader, rather than a flat translucent tint. Kept
 * as a procedural shader — not a photographic texture — so it stays
 * consistent with the rest of the scene (wireframe/glow, nothing
 * photo-realistic anywhere else). Roof/floor caps render as a plain dark
 * panel (no windows) via a normal-based branch in the fragment shader.
 * Still only appears once a milestone's swarm is substantially assembled —
 * the individual cubes (RunwayCubeSwarm/Fill) handle the "materializing"
 * motion before that.
 *
 * Detailing pass 2: floor count now scales with actual height (see
 * `computeFloors`), the facade shader adds a fresnel rim-glow so edges catch
 * light like a glass curtain wall instead of reading as flat matte panels,
 * and each tower gets a thin rooftop antenna with a slowly pulsing beacon
 * tip — a distinct skyline silhouette detail, not just a bare box top.
 */
function Shell({ group }: { group: CubeGroup }) {
  const groupRef = useRef<Group>(null);
  const shellMaterialRef = useRef<ShaderMaterial>(null);
  const floorMaterialRefs = useRef<Array<MeshBasicMaterial | null>>([]);
  const beaconMaterialRef = useRef<MeshBasicMaterial>(null);
  const beaconMeshRef = useRef<Mesh>(null);
  const maxEased = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const floors = useMemo(() => computeFloors(group.height), [group.height]);
  // stable per-building phase so beacons don't all pulse in lockstep
  const beaconPhase = useMemo(() => (hashStringToSeed(group.milestoneId) % 1000) / 1000, [group.milestoneId]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(group.color) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uSeed: { value: hashStringToSeed(group.milestoneId) % 1000 },
      uFloors: { value: floors },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    const shellGroup = groupRef.current;
    const shellMaterial = shellMaterialRef.current;
    if (!shellGroup || !shellMaterial) return;

    const progress = useSceneStore.getState().progress;
    const proximity = clamp01(1 - Math.abs(progress - group.center) / (group.halfSpan * PROXIMITY_SPREAD));
    const raw = proximity * proximity * (3 - 2 * proximity);
    const eased = Math.max(maxEased.current, raw);
    maxEased.current = eased;

    // only appears once the swarm is substantially assembled — this is the
    // "finished facade" reveal, not something visible mid-flight
    const shellVisibility = clamp01((eased - 0.55) / 0.45);
    // Mutate the material's own uniforms, not the useMemo'd closure object —
    // R3F copies each uniform's initial value into a fresh per-key object on
    // the material at mount rather than keeping our object references, so
    // writing to the closure object was silently updating an orphaned copy
    // that the shader never read (uOpacity stayed stuck at its initial 0).
    const shellUniforms = shellMaterial.uniforms as typeof uniforms;
    shellUniforms.uOpacity.value = shellVisibility * MAX_SHELL_OPACITY;
    if (!prefersReducedMotion.current) shellUniforms.uTime.value = state.clock.elapsedTime;
    shellGroup.scale.y = 0.85 + shellVisibility * 0.15;

    for (const floorMaterial of floorMaterialRefs.current) {
      if (floorMaterial) floorMaterial.opacity = shellVisibility * MAX_FLOOR_LINE_OPACITY;
    }

    if (beaconMaterialRef.current) {
      const pulse = prefersReducedMotion.current
        ? 0.75
        : 0.55 + 0.45 * Math.sin(state.clock.elapsedTime * 2.1 + beaconPhase * Math.PI * 2);
      beaconMaterialRef.current.opacity = shellVisibility * MAX_BEACON_OPACITY * pulse;
    }
    if (beaconMeshRef.current) {
      const pulse = prefersReducedMotion.current
        ? 1
        : 0.85 + 0.3 * Math.sin(state.clock.elapsedTime * 2.1 + beaconPhase * Math.PI * 2);
      beaconMeshRef.current.scale.setScalar(pulse);
    }
  });

  const floorLineYs = Array.from(
    { length: floors - 1 },
    (_, i) => group.height * ((i + 1) / floors) - group.height / 2,
  );

  const antennaHeight = 0.18 + group.height * 0.05;

  return (
    <group
      ref={groupRef}
      position={[group.ground.x, group.ground.y + group.height / 2, group.ground.z]}
    >
      <mesh>
        <boxGeometry args={[FOOTPRINT, group.height, FOOTPRINT]} />
        <shaderMaterial
          ref={shellMaterialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
        <Edges color={group.color} />
      </mesh>
      {floorLineYs.map((y, i) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[FOOTPRINT * 1.04, 0.015, FOOTPRINT * 1.04]} />
          <meshBasicMaterial
            ref={(material) => {
              floorMaterialRefs.current[i] = material;
            }}
            color={group.color}
            transparent
            opacity={0}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* rooftop antenna + pulsing beacon tip — gives each tower a distinct
          silhouette against the skyline instead of a flat box top */}
      <mesh position={[0, group.height / 2 + antennaHeight / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.01, antennaHeight, 5]} />
        <meshBasicMaterial color={group.color} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh ref={beaconMeshRef} position={[0, group.height / 2 + antennaHeight, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshBasicMaterial ref={beaconMaterialRef} color={group.color} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function RunwayBuildingShell() {
  return (
    <>
      {cubeGroups.map((group) => (
        <Shell key={group.milestoneId} group={group} />
      ))}
    </>
  );
}
