import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, MathUtils, Object3D } from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { clamp01 } from '@/utils/math';
import { cubeSpecs, cubeGroups, PROXIMITY_SPREAD } from './runwayCubes';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const dummy = new Object3D();
const tempColor = new Color();

/**
 * The runway's "buildings," Ra.One-style: each milestone is a swarm of
 * small wireframe cubes that fly in from a scattered cloud and assemble
 * into a stacked tower as the camera approaches — referencing the 2011
 * film's "Q-Bricks" VFX (thousands of intelligent cubes assembling into a
 * form). One InstancedMesh for every cube across the whole runway; colors
 * are set once (static), positions/rotation/scale animate every frame.
 * The wireframe shell stays visible throughout — see RunwayCubeFill for the
 * solid material that fades in underneath once a cube is assembled.
 *
 * Assembly is a one-way ratchet per milestone (tracks the max proximity
 * ever reached, per group) — without this, a building would fall back
 * apart into tumbling debris once you scrolled past it, since proximity to
 * a scroll-range center naturally falls on both sides of it. The intent is
 * a skyline that accumulates behind you, matching the DOM sections'
 * one-way reveal.
 */
export function RunwayCubeSwarm() {
  const meshRef = useRef<InstancedMesh>(null);
  const maxEased = useRef<Float32Array>(new Float32Array(cubeGroups.length));
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    cubeSpecs.forEach((spec, i) => {
      mesh.setColorAt(i, tempColor.set(spec.color));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const progress = useSceneStore.getState().progress;
    const elapsed = state.clock.elapsedTime;

    cubeGroups.forEach((group, groupIndex) => {
      const proximity = clamp01(1 - Math.abs(progress - group.center) / (group.halfSpan * PROXIMITY_SPREAD));
      const raw = proximity * proximity * (3 - 2 * proximity); // smoothstep
      const previous = maxEased.current[groupIndex] ?? 0;
      const eased = Math.max(previous, raw);
      maxEased.current[groupIndex] = eased;

      for (let i = 0; i < group.count; i++) {
        const idx = group.startIndex + i;
        const spec = cubeSpecs[idx];
        if (!spec) continue;

        dummy.position.set(
          MathUtils.lerp(spec.scattered.x, spec.assembled.x, eased),
          MathUtils.lerp(spec.scattered.y, spec.assembled.y, eased),
          MathUtils.lerp(spec.scattered.z, spec.assembled.z, eased),
        );
        const spin = prefersReducedMotion.current ? 0 : (1 - eased) * elapsed * spec.spinSpeed;
        dummy.rotation.set(spec.spinAxis.x * spin, spec.spinAxis.y * spin, spec.spinAxis.z * spin);
        dummy.scale.setScalar(spec.size * (0.4 + eased * 0.6));
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, cubeSpecs.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial wireframe transparent opacity={0.75} toneMapped={false} />
    </instancedMesh>
  );
}
