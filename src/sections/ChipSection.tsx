import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHIP_SIZE, chipLayers } from '@/data/chipLayers';
import styles from './ChipSection.module.css';

gsap.registerPlugin(ScrollTrigger);

/** The pinned, scroll-driven version needs room and motion; everything else sees the finished exploded view. */
const PINNED_QUERY = '(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';
/** Viewport heights of scroll the whole take-apart lasts. */
const SCROLL_LENGTH = 2.6;
/** Each layer starts moving a little after the one above it, so the stack unzips from the top. */
const STAGGER = 0.04;
const LAYER_COUNT = chipLayers.length;

/**
 * Labels sit in an evenly spaced column to the right of the stack (in the
 * render's pixel space), so close-together layers never make their labels
 * collide, and each leader line bends from its layer's edge to its label.
 */
const LABEL_X = 548;
const LABEL_TOP = 34;
const LABEL_BOTTOM = 706;
const labelY = (i: number) => LABEL_TOP + (i * (LABEL_BOTTOM - LABEL_TOP)) / (LAYER_COUNT - 1);
const BEND_X = 514;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** How far from collapsed a layer is, 0 (pressed together) to 1 (fully apart), for explosion progress `u`. */
function layerProgress(u: number, index: number): number {
  return smooth((u - index * STAGGER) / (1 - (LAYER_COUNT - 1) * STAGGER));
}

const toTranslate = (dy: number, h: number) => `translate3d(0, ${((dy / h) * 100).toFixed(3)}%, 0)`;

/**
 * A production AI system, drawn as a chip-like stack, that comes apart as you
 * scroll. The twelve layers were cut out of one exploded render, so moving each straight up or down is
 * the same as sliding it along the explosion axis. Closed at the top of the
 * scene, fully apart with labels at the bottom of it.
 */
export function ChipSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [pinned, setPinned] = useState(() => window.matchMedia(PINNED_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(PINNED_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setPinned(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const container = containerRef.current;
    const chip = chipRef.current;
    if (!container || !chip) return;

    const layers = layerRefs.current;
    let cancelled = false;
    let trigger: ScrollTrigger | null = null;

    const apply = (progress: number) => {
      const u = clamp01((progress - 0.08) / 0.62);
      const labels = clamp01((progress - 0.72) / 0.24);
      layers.forEach((el, i) => {
        const layer = chipLayers[i];
        if (!el || !layer) return;
        el.style.transform = toTranslate(layer.collapse * (1 - layerProgress(u, i)), layer.h);
      });
      chip.style.setProperty('--labels', labels.toFixed(3));
      chip.style.setProperty('--lift', (1 - smooth(u)).toFixed(3));
      container.style.setProperty('--u', u.toFixed(3));
    };

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        trigger = ScrollTrigger.create({
          trigger: container,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * SCROLL_LENGTH)}`,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        });
        apply(trigger.progress);
        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelled = true;
      trigger?.kill();
      layers.forEach((el) => {
        if (el) el.style.transform = '';
      });
      chip.style.removeProperty('--labels');
      chip.style.removeProperty('--lift');
      container.style.removeProperty('--u');
    };
  }, [pinned]);

  // A slight sideways drift per layer, following the pointer, so the stack reads as 3D.
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pinned || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    chipRef.current?.style.setProperty('--mx', x.toFixed(3));
  };

  return (
    <section id="chip" className={styles.section} aria-labelledby="chip-heading">
      <div
        ref={containerRef}
        className={styles.stage}
        data-mode={pinned ? 'pinned' : 'static'}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => chipRef.current?.style.setProperty('--mx', '0')}
      >
        <div id="ball-build" className={styles.ballMarker} aria-hidden="true" />

        <div className={styles.copy}>
          <p className={styles.eyebrow}>Under the hood</p>
          <h2 id="chip-heading" className={styles.title}>
            Layers, all the way down
          </h2>
          <p className={styles.body}>
            A dependable AI system is a stack, not a model: data at the bottom, then retrieval, models and agents, with
            the checks that keep them honest on top. These are the layers I work across. Scroll to take it apart.
          </p>
          <p className={styles.hint} aria-hidden="true">
            <span className={styles.hintDot} /> Scroll to open it
          </p>
        </div>

        <div className={styles.visual}>
          <div
            ref={chipRef}
            className={styles.chip}
            style={{ aspectRatio: `${CHIP_SIZE.w} / ${CHIP_SIZE.h}`, '--labels': pinned ? 0 : 1, '--lift': pinned ? 1 : 0 } as CSSProperties}
            role="img"
            aria-label="A production AI system drawn as twelve stacked layers in exploded view, from foundations and data at the bottom to guardrails and the interface at the top"
          >
            {/* Drawn bottom layer first so each upper layer covers the one below it. */}
            {[...chipLayers].reverse().map((layer, r) => {
              const i = LAYER_COUNT - 1 - r;
              return (
                <div
                  key={layer.file}
                  ref={(el) => {
                    layerRefs.current[i] = el;
                  }}
                  className={styles.layer}
                  data-layer={i}
                  style={
                    {
                      left: `${(layer.x / CHIP_SIZE.w) * 100}%`,
                      top: `${(layer.y / CHIP_SIZE.h) * 100}%`,
                      width: `${(layer.w / CHIP_SIZE.w) * 100}%`,
                      height: `${(layer.h / CHIP_SIZE.h) * 100}%`,
                      '--par': (i - (LAYER_COUNT - 1) / 2) * 1.4,
                      transform: pinned ? toTranslate(layer.collapse, layer.h) : undefined,
                    } as CSSProperties
                  }
                >
                  <img src={`/chip/${layer.file}`} alt="" draggable={false} className={styles.sprite} />
                  {i === 5 && <span className={styles.dieGlow} />}
                  {i === 10 && <span className={styles.ledGlow} />}
                </div>
              );
            })}

            <svg className={styles.leaders} viewBox={`0 0 ${CHIP_SIZE.w} ${CHIP_SIZE.h}`} aria-hidden="true">
              {chipLayers.map((layer, i) => (
                <g key={`leader-${layer.file}`} style={{ '--i': i } as CSSProperties}>
                  <path
                    d={`M ${layer.anchorX} ${layer.anchorY} H ${BEND_X} L ${LABEL_X - 10} ${labelY(i)} H ${LABEL_X - 4}`}
                    pathLength={1}
                  />
                  <circle cx={layer.anchorX} cy={layer.anchorY} r="2.2" />
                </g>
              ))}
            </svg>

            {chipLayers.map((layer, i) => (
              <div
                key={`tag-${layer.file}`}
                className={styles.tag}
                style={
                  {
                    left: `${(LABEL_X / CHIP_SIZE.w) * 100}%`,
                    top: `${(labelY(i) / CHIP_SIZE.h) * 100}%`,
                    '--i': i,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <span className={styles.name}>{layer.name}</span>
                <span className={styles.note}>{layer.note}</span>
              </div>
            ))}
          </div>
        </div>

        <ul className={styles.list}>
          {chipLayers.map((layer) => (
            <li key={layer.file}>
              <span className={styles.name}>{layer.name}</span>
              <span className={styles.note}>{layer.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
