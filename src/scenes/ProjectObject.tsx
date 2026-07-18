import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { MathUtils, type Group, type Mesh } from 'three';
import type { Project } from '@/data/types';
import { getMilestone } from '@/data/timeline';
import { useSceneStore } from '@/store/sceneStore';
import { clamp01 } from '@/utils/math';
import { lerpColorStops } from '@/utils/color';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ProjectObjectProps {
  project: Project;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 1.1;

/**
 * Default treatment for a featured project: a faceted icosahedron shell
 * (translucent fill + crisp edges) around a smaller, brighter inner core
 * that counter-rotates — reads as a more finished "energy core" object
 * rather than a bare wireframe. Scales up from "distant graph node" to
 * "inspectable object" as the camera's progress nears this project's
 * milestone window.
 */
export function ProjectObject({ project }: ProjectObjectProps) {
  const groupRef = useRef<Group>(null);
  const shellRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const milestone = getMilestone(project.milestoneId);
  const coreColor = lerpColorStops(Math.min(1, milestone.brightness + 0.35));
  // Objects live at the milestone's lookAtOverride (offset beside the spine)
  // so the camera passes *near* them, never through them.
  const objectPosition = milestone.lookAtOverride ?? milestone.anchor;
  const [start, end] = milestone.scrollRange;
  const center = (start + end) / 2;
  const halfSpan = (end - start) / 2 || 0.05;
  const prefersReducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!prefersReducedMotion.current) {
      shellRef.current?.rotation.set(
        shellRef.current.rotation.x + delta * 0.05,
        shellRef.current.rotation.y + delta * 0.15,
        0,
      );
      coreRef.current?.rotation.set(
        coreRef.current.rotation.x - delta * 0.12,
        coreRef.current.rotation.y - delta * 0.28,
        0,
      );
    }

    const progress = useSceneStore.getState().progress;
    const proximity = clamp01(1 - Math.abs(progress - center) / (halfSpan * 1.4));
    const isHovered = useSceneStore.getState().hoveredProjectId === project.id;
    const targetScale = MIN_SCALE + proximity * (MAX_SCALE - MIN_SCALE) + (isHovered ? 0.15 : 0);
    const nextScale = MathUtils.lerp(group.scale.x, targetScale, 0.08);
    group.scale.setScalar(nextScale);
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useSceneStore.getState().setHoveredProjectId(project.id);
  };
  const handlePointerOut = () => {
    useSceneStore.getState().setHoveredProjectId(null);
  };

  return (
    <group
      ref={groupRef}
      position={[objectPosition.x, objectPosition.y, objectPosition.z]}
      scale={MIN_SCALE}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={milestone.accentColor} transparent opacity={0.16} toneMapped={false} />
        <Edges color={milestone.accentColor} />
      </mesh>
      <mesh ref={coreRef} scale={0.4}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.55} toneMapped={false} />
        <Edges color={coreColor} />
      </mesh>
    </group>
  );
}
