import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, MathUtils, Points } from 'three';
import { codingStatsLayout } from '@/data/codingStatsLayout';
import { useSceneStore } from '@/store/sceneStore';
import { vertexShader, fragmentShader } from '@/shaders/glowPoint.glsl';
import { EdgesLines } from './EdgesLines';

const NODE_SIZE_MULTIPLIER = 16;
const HOVER_SCALE = 1.8;
const POINT_RAYCAST_THRESHOLD = 0.35;

/**
 * The coding-activity topic constellation, rendered as glowing points (same
 * technique as NodesInstanced) rather than lit spheres. Hover — from either
 * the 3D node or the DOM legend in CodingStatsSection — cross-highlights via
 * sceneStore.hoveredTopicId; the hovered point's on-screen size is damped up
 * each frame by directly mutating the aSize buffer attribute.
 */
export function CodingStatsCluster() {
  const pointsRef = useRef<Points>(null);
  const { raycaster } = useThree();
  const baseSizes = useRef<Float32Array>(new Float32Array());
  const currentScales = useRef<Float32Array>(new Float32Array());

  const edges = useMemo(() => codingStatsLayout.edges, []);

  useEffect(() => {
    // Points raycasting hit-radius is a fixed world-space value — tune it to
    // roughly match our node scale so hover feels accurate.
    raycaster.params.Points = { threshold: POINT_RAYCAST_THRESHOLD };
  }, [raycaster]);

  const geometry = useMemo(() => {
    const nodes = codingStatsLayout.nodes;
    const positions = new Float32Array(nodes.length * 3);
    const sizes = new Float32Array(nodes.length);
    const colors = new Float32Array(nodes.length * 3);
    const tempColor = new Color();

    nodes.forEach((node, i) => {
      positions[i * 3] = node.position.x;
      positions[i * 3 + 1] = node.position.y;
      positions[i * 3 + 2] = node.position.z;
      sizes[i] = node.radius * NODE_SIZE_MULTIPLIER;
      tempColor.set(node.color);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    });

    baseSizes.current = sizes.slice();
    currentScales.current = new Float32Array(nodes.length).fill(1);

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geom.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
    return geom;
  }, []);

  useFrame(() => {
    const points = pointsRef.current;
    if (!points) return;
    const sizeAttr = points.geometry.getAttribute('aSize');
    const hoveredId = useSceneStore.getState().hoveredTopicId;
    let needsUpdate = false;

    codingStatsLayout.nodes.forEach((node, i) => {
      const target = node.id === hoveredId ? HOVER_SCALE : 1;
      const current = currentScales.current[i] ?? 1;
      const next = MathUtils.lerp(current, target, 0.15);
      if (Math.abs(next - current) > 0.001) {
        currentScales.current[i] = next;
        sizeAttr.setX(i, (baseSizes.current[i] ?? 0) * next);
        needsUpdate = true;
      }
    });

    if (needsUpdate) sizeAttr.needsUpdate = true;
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.index === undefined) return;
    const node = codingStatsLayout.nodes[event.index];
    if (node) useSceneStore.getState().setHoveredTopicId(node.id);
  };

  const handlePointerOut = () => {
    useSceneStore.getState().setHoveredTopicId(null);
  };

  return (
    <>
      <EdgesLines edges={edges} color="#e08a3e" opacity={0.1} />
      <points
        ref={pointsRef}
        geometry={geometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </>
  );
}
