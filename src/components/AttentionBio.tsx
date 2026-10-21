import { Fragment, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import styles from './AttentionBio.module.css';

/**
 * Hand-written topic groups for the bio's words, used to fake what a
 * transformer's attention map looks like. This is an illustration, not model
 * output, and the caption says so. Words are matched after lower-casing and
 * trimming punctuation.
 */
const GROUPS: string[][] = [
  ['final-year', 'b.tech', 'computer', 'science', 'engineering', 'ai/ml', 'student', 'christ', 'university', 'bengaluru'],
  ['looking', 'ahead', 'want', 'spend', 'career', 'building', 'ai'],
  ['depend', 'actually', 'demos', 'production-grade', 'reliable', 'enough', 'high-stakes'],
  ['ai', 'llm', 'systems', 'models', 'production-grade', 'building', 'ai/ml'],
  ['healthcare', 'high-stakes', 'fields', 'oncovision', 'direction', 'taste'],
];

/** Neighbouring words always attend to each other a little, like local syntax. */
const NEIGHBOUR_REACH = 2;
const NEIGHBOUR_WEIGHT = 0.28;
const GROUP_WEIGHT = 0.9;
const MIN_LINE_WEIGHT = 0.2;

function normalize(word: string): string {
  return word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

interface Arc {
  d: string;
  weight: number;
  target: number;
}

interface AttentionBioProps {
  text: string;
}

/**
 * The bio, one word at a time. Hover or tap a word and every other word
 * lights up in proportion to how related it is, with arcs drawn from the
 * word you picked to its strongest matches, the way attention maps are
 * drawn for language models.
 */
export function AttentionBio({ text }: AttentionBioProps) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const keys = useMemo(() => words.map(normalize), [words]);
  const containerRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [arcs, setArcs] = useState<Arc[]>([]);

  const weights = useMemo(() => {
    if (picked === null) return null;
    const pickedKey = keys[picked] ?? '';
    const pickedGroups = GROUPS.filter((group) => group.includes(pickedKey));
    return keys.map((key, i) => {
      if (i === picked) return 1;
      let w = 0;
      if (key && pickedGroups.some((group) => group.includes(key))) w = GROUP_WEIGHT;
      if (Math.abs(i - picked) <= NEIGHBOUR_REACH) w = Math.max(w, NEIGHBOUR_WEIGHT);
      return w;
    });
  }, [keys, picked]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || picked === null || !weights) {
      setArcs([]);
      return;
    }
    const box = container.getBoundingClientRect();
    const anchorOf = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top };
    };
    const from = wordRefs.current[picked];
    if (!from) return;
    const a = anchorOf(from);

    const next: Arc[] = [];
    weights.forEach((w, j) => {
      const el = wordRefs.current[j];
      if (!el || j === picked || w < MIN_LINE_WEIGHT) return;
      const b = anchorOf(el);
      const lift = 14 + Math.min(70, Math.abs(b.x - a.x) * 0.1 + Math.abs(b.y - a.y) * 0.25);
      const midX = (a.x + b.x) / 2;
      const midY = Math.min(a.y, b.y) - lift;
      next.push({ d: `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`, weight: w, target: j });
    });
    setArcs(next);
  }, [picked, weights]);

  return (
    <div className={styles.wrap}>
      <p ref={containerRef} className={styles.bio} onPointerLeave={() => setPicked(null)}>
        {words.map((word, i) => {
          const w = weights ? (weights[i] ?? 0) : 0;
          return (
            <Fragment key={`${word}-${i}`}>
              <span
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className={styles.word}
                data-picked={picked === i ? 'true' : undefined}
                data-active={weights ? 'true' : undefined}
                style={{ '--w': w } as CSSProperties}
                onPointerEnter={() => setPicked(i)}
                onPointerDown={() => setPicked(i)}
              >
                {word}
              </span>{' '}
            </Fragment>
          );
        })}

        <svg className={styles.arcs} aria-hidden="true">
          {arcs.map((arc) => (
            <path
              key={`${picked}-${arc.target}`}
              d={arc.d}
              pathLength={1}
              style={{ '--o': arc.weight } as CSSProperties}
            />
          ))}
        </svg>
      </p>
      <p className={styles.caption}>Hover a word: arcs show what it attends to (illustrative, hand-mapped)</p>
    </div>
  );
}
