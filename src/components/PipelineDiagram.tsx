import { useMemo, type CSSProperties } from 'react';
import type { DiagramEdge, DiagramNode, DiagramSpec, Side } from '@/data/diagrams';
import styles from './PipelineDiagram.module.css';

const NODE_W = 120;
const NODE_H = 42;
const ARROW_LEN = 7;
const ARROW_HALF = 3.4;

interface Pt {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Anchor {
  p: Pt;
  /** Unit vector pointing out of the node at this anchor. */
  out: Pt;
}

interface RoutedEdge {
  edge: DiagramEdge;
  d: string;
  arrow: string;
  label?: Pt;
}

function boxOf(node: DiagramNode): Box {
  return { x: node.x, y: node.y, w: node.w ?? NODE_W, h: node.h ?? NODE_H };
}

function anchorOf(box: Box, side: Side): Anchor {
  switch (side) {
    case 'right':
      return { p: { x: box.x + box.w, y: box.y + box.h / 2 }, out: { x: 1, y: 0 } };
    case 'left':
      return { p: { x: box.x, y: box.y + box.h / 2 }, out: { x: -1, y: 0 } };
    case 'bottom':
      return { p: { x: box.x + box.w / 2, y: box.y + box.h }, out: { x: 0, y: 1 } };
    case 'top':
      return { p: { x: box.x + box.w / 2, y: box.y }, out: { x: 0, y: -1 } };
  }
}

/** Leaves and enters on the sides that face each other. */
function defaultSides(a: Box, b: Box): [Side, Side] {
  if (b.x >= a.x + a.w - 1) return ['right', 'left'];
  if (b.x + b.w <= a.x + 1) return ['left', 'right'];
  return b.y > a.y ? ['bottom', 'top'] : ['top', 'bottom'];
}

function routeEdge(edge: DiagramEdge, boxes: Map<string, Box>): RoutedEdge | null {
  const a = boxes.get(edge.from);
  const b = boxes.get(edge.to);
  if (!a || !b) return null;

  const [defaultFrom, defaultTo] = defaultSides(a, b);
  const start = anchorOf(a, edge.fromSide ?? defaultFrom);
  const end = anchorOf(b, edge.toSide ?? defaultTo);

  const reach = edge.bulge ?? Math.max(24, Math.hypot(end.p.x - start.p.x, end.p.y - start.p.y) * 0.4);
  const c1 = { x: start.p.x + start.out.x * reach, y: start.p.y + start.out.y * reach };
  const c2 = { x: end.p.x + end.out.x * reach, y: end.p.y + end.out.y * reach };

  // The curve stops short of the node by the arrowhead's length so the stroke
  // doesn't poke through the tip.
  const tip = end.p;
  const dirX = tip.x - c2.x;
  const dirY = tip.y - c2.y;
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const base = { x: tip.x - ux * ARROW_LEN, y: tip.y - uy * ARROW_LEN };
  const arrow = [
    `${tip.x},${tip.y}`,
    `${base.x - uy * ARROW_HALF},${base.y + ux * ARROW_HALF}`,
    `${base.x + uy * ARROW_HALF},${base.y - ux * ARROW_HALF}`,
  ].join(' ');

  const d = `M ${start.p.x} ${start.p.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${base.x} ${base.y}`;
  const label = {
    x: (start.p.x + 3 * c1.x + 3 * c2.x + base.x) / 8,
    y: (start.p.y + 3 * c1.y + 3 * c2.y + base.y) / 8,
  };
  return { edge, d, arrow, label: edge.label ? label : undefined };
}

interface PipelineDiagramProps {
  spec: DiagramSpec;
  /** Plays the draw-in and keeps signal dots travelling along the edges. */
  active: boolean;
  /** Screen-reader description of what the diagram shows. */
  label: string;
}

/**
 * A small animated flow diagram drawn from a DiagramSpec: nodes fade in, edges
 * draw themselves, then dots travel along the solid edges. Everything is SVG
 * and CSS (the dots are SMIL), and nothing runs while `active` is false.
 */
export function PipelineDiagram({ spec, active, label }: PipelineDiagramProps) {
  const routed = useMemo(() => {
    const boxes = new Map(spec.nodes.map((node) => [node.id, boxOf(node)]));
    return spec.edges.map((edge) => routeEdge(edge, boxes)).filter((r): r is RoutedEdge => r !== null);
  }, [spec]);

  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  return (
    <svg className={styles.svg} viewBox="0 0 560 320" role="img" aria-label={label} data-active={active}>
      {routed.map(({ edge, d, arrow, label: labelPt }, i) => (
        <g
          key={`${edge.from}-${edge.to}`}
          className={styles.edge}
          data-warn={edge.warn ? 'true' : undefined}
          data-dashed={edge.dashed ? 'true' : undefined}
          style={{ '--i': i } as CSSProperties}
        >
          <path d={d} pathLength={edge.dashed ? undefined : 1} />
          <polygon className={styles.arrow} points={arrow} />
          {labelPt && edge.label && (
            <text className={styles.edgeLabel} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle">
              {edge.label}
            </text>
          )}
          {active && !reducedMotion && !edge.dashed && (
            <circle className={styles.pulse} r="2.4">
              <animateMotion dur={`${2.6 + (i % 3) * 0.5}s`} begin={`${1.4 + i * 0.3}s`} repeatCount="indefinite" path={d} />
            </circle>
          )}
        </g>
      ))}

      {spec.nodes.map((node, i) => {
        const box = boxOf(node);
        return (
          <g key={node.id} className={styles.node} data-kind={node.kind ?? 'default'} style={{ '--i': i } as CSSProperties}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="6" />
            <text className={styles.nodeLabel} x={box.x + box.w / 2} y={box.y + (node.sub ? 17 : box.h / 2 + 4)} textAnchor="middle">
              {node.label}
            </text>
            {node.sub && (
              <text className={styles.nodeSub} x={box.x + box.w / 2} y={box.y + 31} textAnchor="middle">
                {node.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
