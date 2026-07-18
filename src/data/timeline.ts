import type { Graph, GraphEdge, GraphNode, Milestone, Vec3 } from './types';
import { lerpColorStops } from '@/utils/color';
import { clamp01 } from '@/utils/math';
import { hashStringToSeed, mulberry32 } from '@/utils/prng';

/**
 * Hand-authored spine: ordered milestones with 0..1 scroll ownership and
 * placeholder 3D anchors (refined visually once the camera rig is built in
 * Stage 2 — the S-curve shape is a Stage 2 art-direction task, not a data
 * concern). Sections read this for ordering; 3D code reads it for geometry.
 */
const rawMilestones: Array<Omit<Milestone, 'accentColor'>> = [
  {
    id: 'hero',
    type: 'hero',
    order: 0,
    title: 'Adiel A Daniel',
    dateRange: 'Now',
    scrollRange: [0, 0.06],
    anchor: { x: 0, y: 0, z: 0 },
    density: 6,
    brightness: 0.05,
  },
  {
    id: 'prior-schooling',
    type: 'education',
    order: 1,
    title: "St. George's School",
    dateRange: 'Apr 2022 – Feb 2023',
    scrollRange: [0.06, 0.14],
    anchor: { x: 1, y: -1.8, z: -4 },
    density: 8,
    brightness: 0.12,
  },
  {
    id: 'christ-university',
    type: 'education',
    order: 2,
    title: 'CHRIST (Deemed to be University)',
    dateRange: 'Jul 2023 – Apr 2027',
    scrollRange: [0.14, 0.22],
    anchor: { x: -1, y: -3.6, z: -9 },
    density: 10,
    brightness: 0.22,
  },
  {
    id: 'project-bankms',
    type: 'project',
    order: 3,
    title: 'Bank Management System',
    dateRange: 'Aug 2024 – Nov 2024',
    scrollRange: [0.22, 0.32],
    anchor: { x: 1.2, y: -5.4, z: -14 },
    density: 12,
    brightness: 0.34,
    // offset from the anchor so the camera passes *beside* the project object, not through it
    lookAtOverride: { x: 3.8, y: -3.8, z: -12.8 },
  },
  {
    id: 'internship-ieee',
    type: 'internship',
    order: 4,
    title: 'IEEE Bangalore Section',
    dateRange: 'Apr 2025 – Aug 2025',
    scrollRange: [0.32, 0.42],
    anchor: { x: -1.2, y: -7.2, z: -19 },
    density: 16,
    brightness: 0.48,
  },
  {
    id: 'project-scholarsync',
    type: 'project',
    order: 5,
    title: 'ScholarSync',
    dateRange: 'Dec 2025 – Jan 2026',
    scrollRange: [0.42, 0.52],
    anchor: { x: 1.4, y: -9, z: -24 },
    density: 16,
    brightness: 0.6,
    // offset from the anchor so the camera passes *beside* the project object, not through it
    lookAtOverride: { x: 4.0, y: -7.4, z: -22.8 },
  },
  {
    id: 'internship-edunext',
    type: 'internship',
    order: 6,
    title: 'Edunext Technologies',
    dateRange: 'Apr 2026 – May 2026',
    scrollRange: [0.52, 0.62],
    anchor: { x: -1.4, y: -10.8, z: -29 },
    density: 20,
    brightness: 0.72,
  },
  {
    id: 'skills',
    type: 'skills',
    order: 7,
    title: 'Skills',
    dateRange: 'Ongoing',
    scrollRange: [0.62, 0.72],
    anchor: { x: 1, y: -12.6, z: -34 },
    density: 22,
    brightness: 0.82,
  },
  {
    id: 'coding-stats',
    type: 'coding-stats',
    order: 8,
    title: 'Coding Activity',
    dateRange: '200+ problems solved',
    scrollRange: [0.72, 0.84],
    anchor: { x: -1, y: -14.4, z: -39 },
    density: 24,
    brightness: 0.9,
  },
  {
    id: 'certifications',
    type: 'certifications',
    order: 9,
    title: 'Certifications',
    dateRange: '2025',
    scrollRange: [0.84, 0.9],
    anchor: { x: 0.7, y: -16, z: -43 },
    density: 10,
    brightness: 0.95,
  },
  {
    id: 'contact',
    type: 'contact',
    order: 10,
    title: "Let's build something",
    dateRange: 'Now',
    scrollRange: [0.9, 1],
    anchor: { x: 0, y: -17.6, z: -47 },
    density: 8,
    brightness: 1,
  },
];

export const timeline: Milestone[] = rawMilestones.map((m) => ({
  ...m,
  accentColor: lerpColorStops(m.brightness),
}));

export const getMilestone = (id: string): Milestone => {
  const found = timeline.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown milestone id: ${id}`);
  return found;
};

export function findMilestoneAtProgress(progress: number): Milestone | undefined {
  return timeline.find((m) => progress >= m.scrollRange[0] && progress < m.scrollRange[1]);
}

// Must always resolve to the *opposite* side of wherever that milestone's
// DOM card actually renders (see each section's `align` prop in
// src/sections/*.tsx) — a runway building sharing its card's side means it
// lands behind/under that card instead of in the open column beside it.
// This used to alternate by raw milestone.order parity, which doesn't track
// each section's align at all (sections group multiple milestones — e.g.
// education covers order 1 *and* 2 — and don't alternate left/right in
// lockstep with order), so several milestones (christ-university, skills,
// coding-stats, certifications) ended up on the same side as their own card
// purely by coincidence ("card in view but no building visible", reported
// 2026-07-18).
const CARD_ALIGN_BY_TYPE: Record<Milestone['type'], 'left' | 'right' | 'center'> = {
  hero: 'center',
  education: 'left',
  project: 'left',
  internship: 'right',
  skills: 'right',
  'coding-stats': 'left',
  certifications: 'right',
  contact: 'center',
};

/** Which side of the spine a milestone's runway building sits on — always the opposite side of that milestone's DOM card. */
export function getMilestoneSide(milestone: Milestone): 1 | -1 {
  const align = CARD_ALIGN_BY_TYPE[milestone.type];
  if (align === 'left') return 1;
  if (align === 'right') return -1;
  // no fixed card side (hero/contact) — alternate so they don't both land on the same side
  return milestone.order % 2 === 0 ? 1 : -1;
}

function distanceSq(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

const CLUSTER_RADIUS = 3.2;
// Nodes never spawn closer than this to the milestone anchor — the anchor is
// a literal point on the camera's flight path (spineCurve control point), so
// anything placed too close to it gets flown through/past at point-blank
// range and balloons into a huge flat-shaded circle filling the screen.
const MIN_NODE_DISTANCE = 1.6;
const CORE_OFFSET_DISTANCE = 2.2;
const NEAREST_NEIGHBORS = 2;

/**
 * Builds the full node/edge graph across every milestone in one pass: a
 * bright "core" node at each anchor, `density` decorative nodes scattered
 * in a seeded ellipsoid around it, k-nearest edges within each cluster, and
 * one spine edge chaining each cluster's core to the previous cluster's —
 * the continuous chronological thread the camera travels alongside.
 */
function buildGraph(): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let previousCore: GraphNode | null = null;

  for (const milestone of timeline) {
    const random = mulberry32(hashStringToSeed(milestone.id));
    const clusterNodes: GraphNode[] = [];

    // offset the core node off the literal spine point (see MIN_NODE_DISTANCE
    // comment above) — the curve itself still passes through milestone.anchor
    // unaffected, only where we draw the bright "core" sphere moves
    const coreTheta = random() * Math.PI * 2;
    const corePhi = Math.acos(2 * random() - 1);
    const coreNode: GraphNode = {
      id: `${milestone.id}-core`,
      milestoneId: milestone.id,
      position: {
        x: milestone.anchor.x + CORE_OFFSET_DISTANCE * Math.sin(corePhi) * Math.cos(coreTheta),
        y: milestone.anchor.y + CORE_OFFSET_DISTANCE * Math.sin(corePhi) * Math.sin(coreTheta) * 0.6,
        z: milestone.anchor.z + CORE_OFFSET_DISTANCE * Math.cos(corePhi),
      },
      color: lerpColorStops(milestone.brightness),
      size: 0.24,
      brightness: milestone.brightness,
    };
    clusterNodes.push(coreNode);

    for (let i = 0; i < milestone.density; i++) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = MIN_NODE_DISTANCE + (CLUSTER_RADIUS - MIN_NODE_DISTANCE) * Math.cbrt(random());
      const dx = radius * Math.sin(phi) * Math.cos(theta);
      const dy = radius * Math.sin(phi) * Math.sin(theta) * 0.6; // flatten vertically
      const dz = radius * Math.cos(phi);
      const jitteredBrightness = clamp01(milestone.brightness + (random() - 0.5) * 0.3);

      clusterNodes.push({
        id: `${milestone.id}-${i}`,
        milestoneId: milestone.id,
        position: {
          x: milestone.anchor.x + dx,
          y: milestone.anchor.y + dy,
          z: milestone.anchor.z + dz,
        },
        color: lerpColorStops(jitteredBrightness),
        size: 0.045 + random() * 0.07,
        brightness: jitteredBrightness,
      });
    }

    // k-nearest edges within this cluster only
    for (const node of clusterNodes) {
      const nearest = clusterNodes
        .filter((n) => n !== node)
        .sort((a, b) => distanceSq(node.position, a.position) - distanceSq(node.position, b.position))
        .slice(0, NEAREST_NEIGHBORS);

      for (const neighbor of nearest) {
        const alreadyLinked = edges.some(
          (e) => (e.a === node && e.b === neighbor) || (e.a === neighbor && e.b === node),
        );
        if (!alreadyLinked) edges.push({ a: node, b: neighbor });
      }
    }

    if (previousCore) {
      edges.push({ a: previousCore, b: coreNode });
    }
    previousCore = coreNode;

    nodes.push(...clusterNodes);
  }

  return { nodes, edges };
}

export const graph: Graph = buildGraph();

/** graph.edges as plain position pairs — what EdgesLines actually needs to render. */
export const graphEdgePositions: Array<{ a: Vec3; b: Vec3 }> = graph.edges.map((e) => ({
  a: e.a.position,
  b: e.b.position,
}));
