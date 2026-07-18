import type { ProficiencyTier, Vec3 } from './types';
import { codingStats } from './codingStats';
import { getMilestone } from './timeline';
import { hashStringToSeed, mulberry32 } from '@/utils/prng';
import { lerpColorStops } from '@/utils/color';

export interface StatNode {
  id: string;
  name: string;
  tier: ProficiencyTier;
  count: number;
  position: Vec3;
  radius: number;
  color: string;
}

export interface CodingStatsLayout {
  nodes: StatNode[];
  edges: Array<{ a: Vec3; b: Vec3 }>;
}

// reuses the same dim -> bright grammar as the main timeline
const TIER_BRIGHTNESS: Record<ProficiencyTier, number> = {
  fundamental: 0.22,
  intermediate: 0.58,
  advanced: 0.95,
};

// three loose lobes positioned around the coding-stats milestone anchor
const TIER_LOBE_OFFSET: Record<ProficiencyTier, Vec3> = {
  advanced: { x: -3.4, y: 1.9, z: 0.4 },
  intermediate: { x: 3.4, y: 1.7, z: -0.4 },
  fundamental: { x: 0, y: -2.6, z: 0.2 },
};

const MIN_RADIUS = 0.13;
const MAX_RADIUS: number = 0.55;
const RELAXATION_ITERATIONS = 40;
const NODE_PADDING = 0.12;
const CENTER_PULL = 0.012;

function buildTierLayout(tier: ProficiencyTier, center: Vec3): StatNode[] {
  const topics = codingStats.topics.filter((t) => t.tier === tier);
  const random = mulberry32(hashStringToSeed(`coding-stats-${tier}`));
  const maxCount = Math.max(...topics.map((t) => t.count));

  const nodes: StatNode[] = topics.map((topic, i) => {
    const angle = (i / topics.length) * Math.PI * 2 + random() * 0.6;
    const spiralRadius = 0.55 + i * 0.16;
    const sizeT = Math.sqrt(topic.count / maxCount);
    const radius = MIN_RADIUS + sizeT * (MAX_RADIUS - MIN_RADIUS);

    return {
      id: topic.name,
      name: topic.name,
      tier,
      count: topic.count,
      radius,
      color: lerpColorStops(TIER_BRIGHTNESS[tier]),
      position: {
        x: center.x + Math.cos(angle) * spiralRadius,
        y: center.y + Math.sin(angle) * spiralRadius,
        z: center.z + (random() - 0.5) * 0.7,
      },
    };
  });

  // deterministic relaxation: pull toward the lobe center, push apart on overlap
  for (let iter = 0; iter < RELAXATION_ITERATIONS; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]!;
      a.position.x += (center.x - a.position.x) * CENTER_PULL;
      a.position.y += (center.y - a.position.y) * CENTER_PULL;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]!;
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.radius + b.radius + NODE_PADDING;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.position.x -= nx * overlap;
          a.position.y -= ny * overlap;
          b.position.x += nx * overlap;
          b.position.y += ny * overlap;
        }
      }
    }
  }

  return nodes;
}

function buildCodingStatsLayout(): CodingStatsLayout {
  const milestone = getMilestone(codingStats.milestoneId);
  const tiers: ProficiencyTier[] = ['advanced', 'intermediate', 'fundamental'];

  const nodes: StatNode[] = [];
  const edges: Array<{ a: Vec3; b: Vec3 }> = [];

  for (const tier of tiers) {
    const offset = TIER_LOBE_OFFSET[tier];
    const center: Vec3 = {
      x: milestone.anchor.x + offset.x,
      y: milestone.anchor.y + offset.y,
      z: milestone.anchor.z + offset.z,
    };
    const tierNodes = buildTierLayout(tier, center);
    nodes.push(...tierNodes);
    for (const node of tierNodes) {
      edges.push({ a: node.position, b: center });
    }
  }

  return { nodes, edges };
}

export const codingStatsLayout: CodingStatsLayout = buildCodingStatsLayout();
