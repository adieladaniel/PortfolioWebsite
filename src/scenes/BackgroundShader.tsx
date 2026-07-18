import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, Mesh, Vector2, Vector3 } from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { vertexShader, fragmentShader } from '@/shaders/background.glsl';

const DISTANCE = 40;

/**
 * A cursor-reactive shader plane locked to the camera (repositioned every
 * frame to sit a fixed distance in front of it, facing it) so it reads as
 * a true background regardless of where the camera rig moves the camera.
 */
export function BackgroundShader() {
  const meshRef = useRef<Mesh>(null);
  const { camera, size } = useThree();
  const mousePosition = useMousePosition();
  const prefersReducedMotion = useReducedMotion();

  const forward = useMemo(() => new Vector3(), []);
  const rawMouse = useMemo(() => new Vector2(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uScrollProgress: { value: 0 },
      uAspect: { value: size.width / size.height },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    camera.getWorldDirection(forward);
    mesh.position.copy(camera.position).addScaledVector(forward, DISTANCE);
    mesh.quaternion.copy(camera.quaternion);

    if (!prefersReducedMotion.current) {
      rawMouse.set(mousePosition.current.x, mousePosition.current.y);
      uniforms.uMouse.value.lerp(rawMouse, Math.min(1, delta * 3));
      uniforms.uTime.value = state.clock.elapsedTime;
    }
    uniforms.uScrollProgress.value = useSceneStore.getState().progress;
  });

  const scale: [number, number, number] = [
    DISTANCE * 2.4 * (size.width / size.height),
    DISTANCE * 2.4,
    1,
  ];

  return (
    <mesh ref={meshRef} scale={scale} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={DoubleSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
