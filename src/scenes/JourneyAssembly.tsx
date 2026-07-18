import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, InstancedMesh, MathUtils, Object3D, Vector3 } from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { hashStringToSeed, mulberry32 } from '@/utils/prng';
import type { Vec3 } from '@/data/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { deviceTier } from '@/utils/deviceTier';

interface JourneyCube {
  scattered: Vec3;
  assembled: Vec3;
  spinAxis: Vec3;
  spinSpeed: number;
}

const CUBE_COUNT = deviceTier === 'low' ? 8 : 14;
const SCATTER_RADIUS = 1.15;
const CUBE_SIZE = 0.05;
/** Camera-local offset (right, up, forward) keeping this in the same on-screen corner regardless of where the camera rig sends the camera. */
const OFFSET_RIGHT = 1.55;
const OFFSET_UP = -0.85;
const OFFSET_FORWARD = 3.4;

function buildJourneyCubes(): JourneyCube[] {
  const random = mulberry32(hashStringToSeed('journey-assembly'));
  const cubes: JourneyCube[] = [];
  const grid = Math.ceil(Math.cbrt(CUBE_COUNT));

  let i = 0;
  for (let x = 0; x < grid && i < CUBE_COUNT; x++) {
    for (let y = 0; y < grid && i < CUBE_COUNT; y++) {
      for (let z = 0; z < grid && i < CUBE_COUNT; z++) {
        const assembled: Vec3 = {
          x: (x - (grid - 1) / 2) * CUBE_SIZE * 1.3,
          y: (y - (grid - 1) / 2) * CUBE_SIZE * 1.3,
          z: (z - (grid - 1) / 2) * CUBE_SIZE * 1.3,
        };
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        const r = SCATTER_RADIUS * (0.6 + random() * 0.4);
        const scattered: Vec3 = {
          x: assembled.x + r * Math.sin(phi) * Math.cos(theta),
          y: assembled.y + r * Math.sin(phi) * Math.sin(theta),
          z: assembled.z + r * Math.cos(phi),
        };
        cubes.push({
          scattered,
          assembled,
          spinAxis: { x: random() - 0.5, y: random() - 0.5, z: random() - 0.5 },
          spinSpeed: 0.4 + random() * 1.0,
        });
        i++;
      }
    }
  }
  return cubes;
}

const journeyCubes = buildJourneyCubes();
const dummy = new Object3D();
const tempColor = new Color();
const rightVec = new Vector3();
const upVec = new Vector3();
const forwardVec = new Vector3();
const anchor = new Vector3();
const worldPos = new Vector3();

/**
 * A small set of cubes, separate from the runway swarms, that stay in view
 * the whole time (attached to the camera, parked in a screen corner) and
 * gradually stick together into one solid block as *overall* scroll
 * progress goes 0 -> 1 — a persistent "how far through the journey am I"
 * companion, distinct from the per-milestone assemblies which only react
 * to proximity to their own scroll range.
 */
export function JourneyAssembly() {
  const meshRef = useRef<InstancedMesh>(null);
  const { camera } = useThree();
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    journeyCubes.forEach((_, i) => {
      mesh.setColorAt(i, tempColor.set('#e08a3e'));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const progress = useSceneStore.getState().progress;
    const eased = progress * progress * (3 - 2 * progress);
    const elapsed = state.clock.elapsedTime;

    // extract camera's world-space basis directly from its matrix — more
    // reliable than deriving "right"/"up" from cross products, since it
    // matches exactly what's on screen regardless of camera roll/pitch
    const e = camera.matrixWorld.elements;
    rightVec.set(e[0] as number, e[1] as number, e[2] as number).normalize();
    upVec.set(e[4] as number, e[5] as number, e[6] as number).normalize();
    forwardVec.set(-(e[8] as number), -(e[9] as number), -(e[10] as number)).normalize();

    anchor
      .copy(camera.position)
      .addScaledVector(forwardVec, OFFSET_FORWARD)
      .addScaledVector(rightVec, OFFSET_RIGHT)
      .addScaledVector(upVec, OFFSET_UP);

    journeyCubes.forEach((cube, i) => {
      const lx = MathUtils.lerp(cube.scattered.x, cube.assembled.x, eased);
      const ly = MathUtils.lerp(cube.scattered.y, cube.assembled.y, eased);
      const lz = MathUtils.lerp(cube.scattered.z, cube.assembled.z, eased);

      worldPos
        .copy(anchor)
        .addScaledVector(rightVec, lx)
        .addScaledVector(upVec, ly)
        .addScaledVector(forwardVec, lz);

      dummy.position.copy(worldPos);
      const spin = prefersReducedMotion.current ? 0 : (1 - eased) * elapsed * cube.spinSpeed;
      dummy.rotation.set(cube.spinAxis.x * spin, cube.spinAxis.y * spin, cube.spinAxis.z * spin);
      dummy.scale.setScalar(CUBE_SIZE * (0.5 + eased * 0.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, journeyCubes.length]} renderOrder={10}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial wireframe transparent opacity={0.85} toneMapped={false} depthTest={false} />
    </instancedMesh>
  );
}
