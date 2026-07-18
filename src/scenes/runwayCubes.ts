import { timeline, getMilestoneSide } from '@/data/timeline';
import type { Vec3 } from '@/data/types';
import { hashStringToSeed, mulberry32 } from '@/utils/prng';
import { deviceTier } from '@/utils/deviceTier';
import { LATERAL_OFFSET, GROUND_DROP, FORWARD_BIAS_Z } from './runwayConstants';

export interface CubeSpec {
  center: number;
  halfSpan: number;
  assembled: Vec3;
  scattered: Vec3;
  spinAxis: Vec3;
  spinSpeed: number;
  color: string;
  size: number;
}

export interface CubeGroup {
  milestoneId: string;
  center: number;
  halfSpan: number;
  startIndex: number;
  count: number;
  color: string;
  /** Base of the building, in world space. */
  ground: Vec3;
  /** Full height of the assembled tower — for sizing the solid shell that wraps it. */
  height: number;
}

// scaled down on low-tier devices — fewer cubes per building, not lower fidelity content
const GRID = deviceTier === 'low' ? 2 : 3; // NxN cubes per layer footprint
export const FOOTPRINT = 0.85;
const CUBE_SIZE = 0.22;
const MIN_LAYERS = 1;
const MAX_LAYERS = deviceTier === 'low' ? 2 : 4;
const MIN_HEIGHT = 0.5;
const MAX_HEIGHT = 3.4;
const SCATTER_RADIUS = 3.2;
/** How far into a milestone's scroll range the swarm starts assembling, as a multiple of its half-span. */
export const PROXIMITY_SPREAD = 2.2;

function build(): { cubeSpecs: CubeSpec[]; cubeGroups: CubeGroup[] } {
  const cubeSpecs: CubeSpec[] = [];
  const cubeGroups: CubeGroup[] = [];

  for (const milestone of timeline) {
    const random = mulberry32(hashStringToSeed(`runway-${milestone.id}`));
    const side = getMilestoneSide(milestone);
    // Deliberately NOT anchor.x + offset — anchor.x zigzags (for the
    // camera's path) by inconsistent amounts per milestone, which used to
    // carry straight into building position and read as a scattered field
    // rather than an organized street. Buildings get their own clean,
    // constant two-row layout instead, independent of the camera's path.
    const groundX = side * LATERAL_OFFSET;
    const groundY = milestone.anchor.y - GROUND_DROP;
    // pulled forward of the anchor — see FORWARD_BIAS_Z's comment
    const groundZ = milestone.anchor.z - FORWARD_BIAS_Z;

    const [start, end] = milestone.scrollRange;
    const center = (start + end) / 2;
    const halfSpan = (end - start) / 2 || 0.05;

    // more layers (more cubes) for brighter/later milestones — the swarm
    // itself gets more complex over time, not just taller
    const layers = MIN_LAYERS + Math.round(milestone.brightness * (MAX_LAYERS - MIN_LAYERS));
    const targetHeight = MIN_HEIGHT + milestone.brightness * (MAX_HEIGHT - MIN_HEIGHT);
    const layerHeight = targetHeight / layers;
    const cellSize = FOOTPRINT / GRID;

    const startIndex = cubeSpecs.length;

    for (let layer = 0; layer < layers; layer++) {
      for (let gx = 0; gx < GRID; gx++) {
        for (let gz = 0; gz < GRID; gz++) {
          const localX = (gx - (GRID - 1) / 2) * cellSize;
          const localZ = (gz - (GRID - 1) / 2) * cellSize;
          const localY = layer * layerHeight + layerHeight / 2;

          const assembled: Vec3 = {
            x: groundX + localX,
            y: groundY + localY,
            z: groundZ + localZ,
          };

          const theta = random() * Math.PI * 2;
          const phi = Math.acos(2 * random() - 1);
          const r = SCATTER_RADIUS * (0.5 + random() * 0.5);
          const scattered: Vec3 = {
            x: assembled.x + r * Math.sin(phi) * Math.cos(theta),
            y: assembled.y + r * Math.sin(phi) * Math.sin(theta),
            z: assembled.z + r * Math.cos(phi),
          };

          cubeSpecs.push({
            center,
            halfSpan,
            assembled,
            scattered,
            spinAxis: { x: random() - 0.5, y: random() - 0.5, z: random() - 0.5 },
            spinSpeed: 0.6 + random() * 1.6,
            color: milestone.accentColor,
            size: CUBE_SIZE * (0.75 + random() * 0.5),
          });
        }
      }
    }

    cubeGroups.push({
      milestoneId: milestone.id,
      center,
      halfSpan,
      startIndex,
      count: cubeSpecs.length - startIndex,
      color: milestone.accentColor,
      ground: { x: groundX, y: groundY, z: groundZ },
      height: targetHeight,
    });
  }

  return { cubeSpecs, cubeGroups };
}

const built = build();
export const cubeSpecs = built.cubeSpecs;
export const cubeGroups = built.cubeGroups;
