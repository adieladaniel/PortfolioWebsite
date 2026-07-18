import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial } from 'three';
import { timeline, getMilestoneSide } from '@/data/timeline';
import { LATERAL_OFFSET, GROUND_DROP, FORWARD_BIAS_Z } from './runwayConstants';

/**
 * The continuous ground line connecting each runway building's base, in
 * milestone order. Built via `new THREE.Line(...)` + `<primitive>` rather
 * than the `<line>` JSX intrinsic — R3F's `line` element collides with the
 * DOM/SVG `<line>` type in this project's JSX namespace.
 */
export function RunwayPath() {
  const line = useMemo(() => {
    const positions = new Float32Array(timeline.length * 3);

    timeline.forEach((milestone, i) => {
      const side = getMilestoneSide(milestone);
      // matches runwayCubes.ts's ground calculation exactly — constant
      // lateral offset per side, and pulled forward by FORWARD_BIAS_Z so the
      // line still connects the buildings' actual (shifted) base points.
      positions[i * 3] = side * LATERAL_OFFSET;
      positions[i * 3 + 1] = milestone.anchor.y - GROUND_DROP;
      positions[i * 3 + 2] = milestone.anchor.z - FORWARD_BIAS_Z;
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({ color: '#e08a3e', transparent: true, opacity: 0.35 });
    return new Line(geometry, material);
  }, []);

  return <primitive object={line} />;
}
