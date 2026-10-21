import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { PipelineDiagram } from '@/components/PipelineDiagram';
import { diagrams } from '@/data/diagrams';
import { projects } from '@/data/projects';
import { getLenis } from '@/lib/lenis';
import styles from './ProjectSection.module.css';

gsap.registerPlugin(ScrollTrigger);

/** Wide, tall-enough screens that allow motion get the pinned fly-through; everything else gets a plain stacked list. */
const FLYTHROUGH_QUERY = '(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';
/** Viewport heights of scroll spent on each step from one project to the next. */
const SCROLL_PER_STEP = 0.9;
/** Share of each step spent holding still on a project before and after the move. */
const DWELL = 0.3;

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * Where project `i` is while the camera is at `position` (0 = first project,
 * count - 1 = last). Eases the movement so each project holds still for a
 * while, then flies away as the next one arrives.
 */
function frameStyle(position: number, i: number): { opacity: number; scale: number; y: number } {
  const base = Math.floor(position);
  const moved = smoothstep((position - base - DWELL) / (1 - 2 * DWELL));
  const p = base + moved - i;

  if (p < 0) {
    // Not here yet: smaller, lower, fading in as it approaches.
    const t = Math.min(-p, 1.2);
    return { opacity: smoothstep(1 + p / 0.55), scale: 1 - 0.14 * t, y: 36 * t };
  }
  // Already passed: grows toward the camera, rises and fades out.
  const t = Math.min(p, 1.2);
  return { opacity: 1 - smoothstep(p / 0.55), scale: 1 + 0.22 * t, y: -48 * t };
}

export function ProjectSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<Array<HTMLElement | null>>([]);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [flythrough, setFlythrough] = useState(() => window.matchMedia(FLYTHROUGH_QUERY).matches);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const query = window.matchMedia(FLYTHROUGH_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setFlythrough(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!flythrough) return;
    const container = containerRef.current;
    if (!container) return;

    const frames = frameRefs.current;
    const count = projects.length;
    let cancelled = false;
    let currentActive = -1;

    const apply = (progress: number) => {
      const position = progress * (count - 1);
      frames.forEach((el, i) => {
        if (!el) return;
        const { opacity, scale, y } = frameStyle(position, i);
        el.style.opacity = String(opacity);
        el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
        el.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      });
      const nearest = Math.round(position);
      if (nearest !== currentActive) {
        currentActive = nearest;
        setActive(nearest);
      }
    };

    // Same reasoning as HorizontalScrollPanel: fonts swap in asynchronously
    // and change layout, so the pin's range must be measured after they land.
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        triggerRef.current = ScrollTrigger.create({
          trigger: container,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * SCROLL_PER_STEP * (count - 1))}`,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        });
        apply(triggerRef.current.progress);
        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelled = true;
      triggerRef.current?.kill();
      triggerRef.current = null;
      frames.forEach((el) => {
        if (el) {
          el.style.opacity = '';
          el.style.visibility = '';
          el.style.transform = '';
        }
      });
    };
  }, [flythrough]);

  const goTo = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    const y = st.start + (i / (projects.length - 1)) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y });
  };

  return (
    <Section id="projects">
      <div ref={containerRef} className={styles.container} data-mode={flythrough ? 'flythrough' : 'static'}>
        <div id="ball-projects" className={styles.ballMarker} aria-hidden="true" />

        <div className={styles.head}>
          <SectionHeading prefix="My" accent="Projects" />
        </div>

        <div className={styles.stage}>
          <div className={styles.list}>
            {projects.map((project, i) => {
              const spec = diagrams[project.id];
              return (
                <article
                  key={project.id}
                  ref={(el) => {
                    frameRefs.current[i] = el;
                  }}
                  className={styles.frame}
                  inert={flythrough && i !== active ? true : undefined}
                >
                  <div className={styles.copy}>
                    <div className={styles.top}>
                      <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
                      <div className={styles.titleBlock}>
                        <h3 className={styles.name}>{project.name}</h3>
                        <p className={styles.dates}>
                          {project.startDate === project.endDate
                            ? project.startDate
                            : `${project.startDate} – ${project.endDate}`}
                        </p>
                      </div>
                    </div>

                    <p className={styles.tagline}>{project.tagline}</p>

                    <ul className={styles.bullets}>
                      {project.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>

                    <div className={styles.footer}>
                      <p className={styles.toolsLabel}>Tools and features</p>
                      <p className={styles.tools}>{project.tech.join(', ')}</p>
                    </div>

                    {(project.link || project.repo) && (
                      <div className={styles.links}>
                        {project.link && (
                          <a
                            className={styles.viewLink}
                            data-cursor="open"
                            data-magnetic
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            live demo ↗
                          </a>
                        )}
                        {project.repo && (
                          <a
                            className={styles.viewLink}
                            data-cursor="open"
                            data-magnetic
                            href={project.repo}
                            target="_blank"
                            rel="noreferrer"
                          >
                            view on github ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {spec && (
                    <div className={styles.diagram}>
                      <PipelineDiagram
                        spec={spec}
                        active={!flythrough || i === active}
                        label={`How ${project.name} works, as a flow diagram`}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {flythrough && (
          <nav className={styles.index} aria-label="Jump to a project">
            {projects.map((project, i) => (
              <button
                key={project.id}
                type="button"
                className={styles.indexItem}
                aria-current={i === active}
                onClick={() => goTo(i)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span> {project.name}
              </button>
            ))}
          </nav>
        )}
      </div>
    </Section>
  );
}
