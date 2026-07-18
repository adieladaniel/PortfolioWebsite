import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Vec3 } from '@/data/types';

export interface SimpleEdge {
  a: Vec3;
  b: Vec3;
}

interface EdgesLinesProps {
  edges: SimpleEdge[];
  color?: string;
  opacity?: number;
}

/** A list of edges as one LineSegments — one draw call, built once from static data. */
export function EdgesLines({ edges, color = '#e08a3e', opacity = 0.15 }: EdgesLinesProps) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(edges.length * 6);

    edges.forEach((edge, i) => {
      const offset = i * 6;
      positions[offset] = edge.a.x;
      positions[offset + 1] = edge.a.y;
      positions[offset + 2] = edge.a.z;
      positions[offset + 3] = edge.b.x;
      positions[offset + 4] = edge.b.y;
      positions[offset + 5] = edge.b.z;
    });

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}
