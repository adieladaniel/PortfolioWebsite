import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { skills } from '@/data/skills';
import styles from './SkillsPlayground.module.css';

const { Engine, Bodies, Composite, Mouse, MouseConstraint } = Matter;

/** Physics only where a mouse can drag and motion is welcome; everyone else gets the plain wrapped list. */
const PHYSICS_QUERY = '(pointer: fine) and (min-width: 700px) and (prefers-reduced-motion: no-preference)';
const WALL = 80;
const STEP_MS = 1000 / 60;
const START_VISIBILITY = 0.35;

interface PhysicsWorld {
  setRunning: (run: boolean) => void;
  destroy: () => void;
}

/** Matter's Mouse keeps its listeners as properties; the types don't list them. */
interface MouseHandlers {
  element: HTMLElement;
  mousemove: EventListener;
  mousedown: EventListener;
  mouseup: EventListener;
  mousewheel: EventListener;
  touchmove: EventListener;
  touchstart: EventListener;
  touchend: EventListener;
}

/**
 * Drops one rounded rigid body per chip into the pit and keeps each chip's
 * DOM element in step with its body. Chips can be grabbed and thrown. The
 * wheel is deliberately left alone so the page still scrolls over the pit.
 */
function createWorld(pit: HTMLElement, chips: HTMLElement[]): PhysicsWorld {
  const { width, height } = pit.getBoundingClientRect();
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.1;

  const walls = [
    Bodies.rectangle(width / 2, height + WALL / 2, width + WALL * 2, WALL, { isStatic: true }),
    Bodies.rectangle(-WALL / 2, -height, WALL, height * 4, { isStatic: true }),
    Bodies.rectangle(width + WALL / 2, -height, WALL, height * 4, { isStatic: true }),
  ];

  const items = chips.map((el, i) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const body = Bodies.rectangle(w / 2 + Math.random() * Math.max(1, width - w), -h - i * h * 0.9 - Math.random() * 40, w, h, {
      chamfer: { radius: h / 2 },
      restitution: 0.3,
      friction: 0.15,
      frictionAir: 0.012,
      angle: (Math.random() - 0.5) * 0.6,
    });
    el.style.opacity = '1';
    return { el, body, w, h };
  });
  Composite.add(engine.world, [...walls, ...items.map((item) => item.body)]);

  const mouse = Mouse.create(pit);
  const handlers = mouse as unknown as MouseHandlers;
  // Matter listens for the wheel to support zooming; here it would swallow page scroll.
  handlers.element.removeEventListener('mousewheel', handlers.mousewheel);
  handlers.element.removeEventListener('DOMMouseScroll', handlers.mousewheel);
  handlers.element.removeEventListener('wheel', handlers.mousewheel);
  const constraint = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.25 } });
  Composite.add(engine.world, constraint);
  // Matter only hears mouseup on the pit, so a release outside it would leave a chip stuck to the cursor.
  const releaseAnywhere = (event: MouseEvent) => handlers.mouseup(event);
  window.addEventListener('mouseup', releaseAnywhere);

  let raf = 0;
  let running = false;
  let last = 0;
  let accumulator = 0;

  const tick = (now: number) => {
    accumulator += Math.min(now - last, 100);
    last = now;
    while (accumulator >= STEP_MS) {
      Engine.update(engine, STEP_MS);
      accumulator -= STEP_MS;
    }
    items.forEach(({ el, body, w, h }) => {
      if (body.isSleeping) return;
      el.style.transform = `translate3d(${body.position.x - w / 2}px, ${body.position.y - h / 2}px, 0) rotate(${body.angle}rad)`;
    });
    raf = requestAnimationFrame(tick);
  };

  return {
    setRunning(run) {
      if (run === running) return;
      running = run;
      if (run) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('mouseup', releaseAnywhere);
      handlers.element.removeEventListener('mousemove', handlers.mousemove);
      handlers.element.removeEventListener('mousedown', handlers.mousedown);
      handlers.element.removeEventListener('mouseup', handlers.mouseup);
      handlers.element.removeEventListener('touchmove', handlers.touchmove);
      handlers.element.removeEventListener('touchstart', handlers.touchstart);
      handlers.element.removeEventListener('touchend', handlers.touchend);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    },
  };
}

/**
 * The skill list as a pit of chips. With a mouse they rain down when the
 * pit scrolls into view and can be dragged and thrown around; on touch
 * screens, small windows and reduced motion it stays a plain wrapped list.
 */
export function SkillsPlayground() {
  const pitRef = useRef<HTMLUListElement>(null);
  const chipRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [physics, setPhysics] = useState(() => window.matchMedia(PHYSICS_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(PHYSICS_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setPhysics(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!physics) return;
    const pit = pitRef.current;
    if (!pit) return;
    const chips = chipRefs.current.filter((el): el is HTMLLIElement => el !== null);

    let world: PhysicsWorld | null = null;
    let visible = false;
    let lastWidth = pit.getBoundingClientRect().width;
    let resizeTimer = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible && !world) world = createWorld(pit, chips);
        world?.setRunning(visible);
      },
      { threshold: START_VISIBILITY },
    );
    observer.observe(pit);

    // A width change means the walls are wrong, so start the pile over.
    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const next = pit.getBoundingClientRect().width;
        if (Math.abs(next - lastWidth) < 2) return;
        lastWidth = next;
        if (!world) return;
        world.destroy();
        chips.forEach((el) => {
          el.style.transform = '';
        });
        world = visible ? createWorld(pit, chips) : null;
        world?.setRunning(visible);
      }, 250);
    });
    resizeObserver.observe(pit);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.clearTimeout(resizeTimer);
      world?.destroy();
      chips.forEach((el) => {
        el.style.transform = '';
        el.style.opacity = '';
      });
    };
  }, [physics]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.label}>Skills</p>
        {physics && <p className={styles.hint}>Grab one and throw it</p>}
      </div>
      <ul ref={pitRef} className={styles.pit} data-physics={physics}>
        {skills.map((skill, i) => (
          <li
            key={skill.name}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            className={styles.chip}
            data-category={skill.category}
            data-cursor={physics ? 'drag' : undefined}
          >
            {skill.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
