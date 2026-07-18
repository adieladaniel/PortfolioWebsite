import { useMemo } from 'react';
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute } from 'three';
import { graph } from '@/data/timeline';
import { vertexShader, fragmentShader } from '@/shaders/glowPoint.glsl';

const NODE_SIZE_MULTIPLIER = 10;

/**
 * Every decorative + core node in the graph as one glowing point cloud —
 * soft radial-falloff sprites, additively blended, instead of hard-edged
 * lit spheres. One draw call for hundreds of nodes; built once since the
 * graph is static.
 */
export function NodesInstanced() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(graph.nodes.length * 3);
    const sizes = new Float32Array(graph.nodes.length);
    const colors = new Float32Array(graph.nodes.length * 3);
    const tempColor = new Color();

    graph.nodes.forEach((node, i) => {
      positions[i * 3] = node.position.x;
      positions[i * 3 + 1] = node.position.y;
      positions[i * 3 + 2] = node.position.z;
      sizes[i] = node.size * NODE_SIZE_MULTIPLIER;
      tempColor.set(node.color);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    });

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geom.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
    return geom;
  }, []);

  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
