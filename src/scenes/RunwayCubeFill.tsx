import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, MathUtils, MeshBasicMaterial, Object3D } from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { clamp01 } from '@/utils/math';
import { cubeSpecs, cubeGroups, PROXIMITY_SPREAD, type CubeGroup } from './runwayCubes';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MAX_FILL_OPACITY = 0.55;
const dummy = new Object3D();

/**
 * Answers "will these stay empty wireframes forever?" — no: as a
 * milestone's cube swarm locks into place, a solid-colored fill fades in
 * underneath the wireframe shell (RunwayCubeSwarm), so it reads as
 * materializing/solidifying rather than staying a hollow skeleton. One
 * InstancedMesh per milestone (not one global mesh) because opacity is a
 * material-level property — every cube in a milestone shares the same
 * assembly progress, so a single opacity value per group is correct and
 * far simpler than per-instance alpha.
 */
function GroupFill({ group }: { group: CubeGroup }) {
  const meshRef = useRef<InstancedMesh>(null);
  const maxEased = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const progress = useSceneStore.getState().progress;
    const elapsed = state.clock.elapsedTime;
    const proximity = clamp01(1 - Math.abs(progress - group.center) / (group.halfSpan * PROXIMITY_SPREAD));
    const raw = proximity * proximity * (3 - 2 * proximity);
    // one-way ratchet — once assembled/solid, stays that way (see RunwayCubeSwarm for why)
    const eased = Math.max(maxEased.current, raw);
    maxEased.current = eased;

    const material = mesh.material as MeshBasicMaterial;
    material.opacity = eased * MAX_FILL_OPACITY;

    for (let i = 0; i < group.count; i++) {
      const spec = cubeSpecs[group.startIndex + i];
      if (!spec) continue;

      dummy.position.set(
        MathUtils.lerp(spec.scattered.x, spec.assembled.x, eased),
        MathUtils.lerp(spec.scattered.y, spec.assembled.y, eased),
        MathUtils.lerp(spec.scattered.z, spec.assembled.z, eased),
      );
      const spin = prefersReducedMotion.current ? 0 : (1 - eased) * elapsed * spec.spinSpeed;
      dummy.rotation.set(spec.spinAxis.x * spin, spec.spinAxis.y * spin, spec.spinAxis.z * spin);
      // slightly smaller than the wireframe shell so its edges still peek through
      dummy.scale.setScalar(spec.size * (0.4 + eased * 0.6) * 0.92);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, group.count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={group.color} transparent opacity={0} toneMapped={false} />
    </instancedMesh>
  );
}

export function RunwayCubeFill() {
  return (
    <>
      {cubeGroups.map((group) => (
        <GroupFill key={group.milestoneId} group={group} />
      ))}
    </>
  );
}
