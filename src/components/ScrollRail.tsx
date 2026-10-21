import { useEffect, useRef, useState } from 'react';
import { getLenis } from '@/lib/lenis';
import styles from './ScrollRail.module.css';

/** One layer per scene, in page order. `id` is the element whose centre marks the scene. */
const LAYERS = [
  { id: 'hero-stage', label: 'Intro' },
  { id: 'about-me', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
];

const NODES_PER_LAYER = 3;
const WIDTH = 44;
const HEIGHT = 300;
const PAD_Y = 24;
const NAV_OFFSET = -72;

const layerY = (i: number) => PAD_Y + (i * (HEIGHT - PAD_Y * 2)) / (LAYERS.length - 1);
/** Fixed, slightly irregular x positions so the layers look hand-placed, not gridded. */
const nodeX = (layer: number, k: number) => WIDTH / 2 + (k - 1) * 11 + (((layer * 7 + k * 3) % 5) - 2) * 1.2;

const EDGES = LAYERS.slice(0, -1).map((_, gap) =>
  Array.from({ length: NODES_PER_LAYER * NODES_PER_LAYER }, (_, n) => {
    const a = Math.floor(n / NODES_PER_LAYER);
    const b = n % NODES_PER_LAYER;
    return { x1: nodeX(gap, a), y1: layerY(gap), x2: nodeX(gap + 1, b), y2: layerY(gap + 1), key: `${gap}-${n}` };
  }),
);

/**
 * Where the viewport's midline is among the scenes, as a number from 0 to
 * LAYERS.length - 1 (2.5 = halfway between the third and fourth). Same idea
 * as the particle ball's route: scenes are located by their elements' centres.
 */
function scenePosition(centres: number[], mid: number): number {
  const first = centres[0];
  const last = centres[centres.length - 1];
  if (first === undefined || last === undefined) return 0;
  if (mid <= first) return 0;
  if (mid >= last) return centres.length - 1;
  for (let i = 0; i < centres.length - 1; i++) {
    const a = centres[i];
    const b = centres[i + 1];
    if (a !== undefined && b !== undefined && a <= mid && mid < b) return i + (mid - a) / (b - a);
  }
  return 0;
}

/**
 * A tiny neural network down the right edge whose layers are the page's
 * scenes. As you scroll, activation travels through it like a forward pass:
 * the layer you are in glows, the edges between layers light as you cross
 * them. Each layer is also a button that scrolls to its scene.
 */
export function ScrollRail() {
  const layerRefs = useRef<Array<SVGGElement | null>>([]);
  const gapRefs = useRef<Array<SVGGElement | null>>([]);
  const elements = useRef<Array<HTMLElement | null>>(LAYERS.map(() => null));
  const [active, setActive] = useState(0);

  useEffect(() => {
    let current = -1;
    const update = () => {
      const centres: number[] = [];
      LAYERS.forEach((layer, i) => {
        let el = elements.current[i];
        if (!el || !el.isConnected) {
          el = document.getElementById(layer.id);
          elements.current[i] = el;
        }
        if (!el) return;
        const r = el.getBoundingClientRect();
        centres.push(r.top + r.height / 2);
      });
      if (centres.length !== LAYERS.length) return;

      const idx = scenePosition(centres, window.innerHeight / 2);
      layerRefs.current.forEach((g, i) => g?.style.setProperty('--a', String(Math.max(0, 1 - Math.abs(idx - i)))));
      gapRefs.current.forEach((g, i) => g?.style.setProperty('--g', String(Math.max(0, 1 - Math.abs(idx - (i + 0.5)) * 2))));

      const nearest = Math.round(idx);
      if (nearest !== current) {
        current = nearest;
        setActive(nearest);
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Layout settles after fonts load and pins are created, so look once more.
    const settle = window.setTimeout(update, 1500);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.clearTimeout(settle);
    };
  }, []);

  const goTo = (i: number) => {
    const layer = LAYERS[i];
    if (!layer) return;
    const lenis = getLenis();
    if (i === 0) {
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0 });
      return;
    }
    const el = document.getElementById(layer.id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET });
  };

  return (
    <nav className={styles.rail} aria-label="Page sections">
      <svg className={styles.svg} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        {EDGES.map((edges, gap) => (
          <g
            key={gap}
            className={styles.gap}
            ref={(el) => {
              gapRefs.current[gap] = el;
            }}
          >
            {edges.map((e) => (
              <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
            ))}
          </g>
        ))}
        {LAYERS.map((layer, i) => (
          <g
            key={layer.id}
            className={styles.layer}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
          >
            {Array.from({ length: NODES_PER_LAYER }, (_, k) => (
              <circle key={k} cx={nodeX(i, k)} cy={layerY(i)} r="2.6" />
            ))}
          </g>
        ))}
      </svg>

      {LAYERS.map((layer, i) => (
        <button
          key={layer.id}
          type="button"
          className={styles.hit}
          style={{ top: `${(layerY(i) / HEIGHT) * 100}%` }}
          data-active={active === i}
          aria-label={`Go to ${layer.label}`}
          aria-current={active === i ? 'location' : undefined}
          onClick={() => goTo(i)}
        >
          <span className={styles.label}>
            {String(i + 1).padStart(2, '0')} {layer.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
