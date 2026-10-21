import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './HorizontalScrollPanel.module.css';

gsap.registerPlugin(ScrollTrigger);

interface HorizontalScrollPanelProps {
  /**
   * Rendered inside the pinned container but *outside* the translating
   * track, so it stays put on screen for the whole horizontal-scroll
   * sequence instead of scrolling away first. Pinning was previously scoped
   * to just the slide row — since the heading sat above it in normal flow,
   * the heading (and a good chunk of vertical scroll) had already passed by
   * the time the row itself reached the top and the pin engaged, reported
   * as "it scrolls down through half the section before it starts going
   * horizontal."
   */
  heading?: ReactNode;
  /**
   * Pixels of page scroll per pixel the row travels sideways. 1 moves the row as
   * fast as the page scrolls; higher is slower and easier to follow, so a long
   * row does not whip past on a flick of the wheel.
   */
  pace?: number;
  /**
   * Stretches of scroll, in viewport heights, where the row holds still before it
   * starts moving and after it arrives. The first slides get a moment on screen
   * when you arrive, and the last ones are not left the instant they appear.
   */
  hold?: { start?: number; end?: number };
  /** Id for an empty marker covering the container: the particle ball's anchor for this scene (see ParticleField's ANCHORS). */
  ballId?: string;
}

/**
 * The reference site's numbered-column Education/Projects mechanic: pin the
 * section in place and translate a horizontal row of slides leftward as the
 * user scrolls vertically, converting vertical scroll distance into
 * horizontal reveal. Built once, shared by EducationSection and
 * ProjectSection — same interaction, different content.
 *
 * Under prefers-reduced-motion, skips the pin/scrub tween entirely and lets
 * the row become a native `overflow-x: auto` strip instead — still
 * horizontal (so it doesn't need a second, different layout), just
 * user-driven rather than scroll-jacked.
 */
export function HorizontalScrollPanel({ heading, ballId, pace = 1, hold, children }: PropsWithChildren<HorizontalScrollPanelProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    if (prefersReducedMotion.current) {
      // no scroll-jacking under reduced motion — constrain the track to the
      // container's width and let it scroll natively via trackpad/touch/
      // scrollbar instead. Scoped to the track (not the container) so the
      // heading — a sibling, not a track child — never scrolls away with it.
      track.style.width = '100%';
      track.style.overflowX = 'auto';
      return;
    }

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    // Self-hosted fonts (@fontsource) swap in asynchronously — measuring
    // track/container widths before that swap finishes captured fallback-
    // font metrics, so the tween's fixed pixel distance ended up far short
    // of what the actual (post-swap) content needed. The pin's scroll
    // *range* (`end`) and the *distance* the track translates by were built
    // from the same stale number, so the track blew straight through all
    // its slides within the first ~200px of scroll instead of over the
    // section's full pinned range. Waiting for fonts.ready before measuring
    // fixes the root cause rather than fudging the numbers.
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    fontsReady.then(() => {
      if (cancelled) return;
      // one more frame so layout has actually flushed post font-swap
      requestAnimationFrame(() => {
        if (cancelled) return;
        ctx = gsap.context(() => {
          const distance = track.scrollWidth - container.clientWidth;
          if (distance <= 0) return;

          // `start: 'top top'` only pins once the container's top reaches
          // the very top of the viewport — fine for content as tall as the
          // viewport, but this container (heading + one row of slides) is
          // typically well under viewport height. That meant the section
          // was already fully, comfortably visible on screen a few hundred
          // pixels of scroll *before* the pin actually engaged — a dead
          // stretch where nothing seemed to respond, reported as "half the
          // block is already visible by the time it starts going
          // horizontal." Starting once the container is vertically centered
          // in the viewport engages the pin right as it's naturally framed,
          // instead of only once it's been sitting there a while.
          const topMargin = Math.max(0, (window.innerHeight - container.getBoundingClientRect().height) / 2);

          // One timeline measured in pixels of scroll: hold, travel, hold. The
          // scroll range is the timeline's whole length, so the row sits still
          // through the holds and moves at 1/pace of the page's speed between them.
          const holdStart = Math.round((hold?.start ?? 0) * window.innerHeight);
          const holdEnd = Math.round((hold?.end ?? 0) * window.innerHeight);
          const travel = Math.round(distance * pace);
          const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: container,
              start: `top ${topMargin}`,
              end: `+=${holdStart + travel + holdEnd}`,
              scrub: 0.6,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
          timeline.to(track, { x: -distance, duration: travel }, holdStart);
          if (holdEnd > 0) timeline.to({}, { duration: holdEnd }, holdStart + travel);
        }, container);

        // This page has two independent HorizontalScrollPanel instances
        // (Projects, then Education) mounting asynchronously and in no
        // guaranteed order — each one's pin inserts a spacer that changes
        // total document height, which silently invalidates any
        // ScrollTrigger created *before* it (their start/end pixel
        // positions were computed against a shorter page). A global refresh
        // after each panel finishes setup re-syncs every existing trigger
        // against the current DOM, including ones created earlier.
        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [prefersReducedMotion, pace, hold?.start, hold?.end]);

  return (
    <div ref={containerRef} className={styles.container}>
      {ballId && <div id={ballId} className={styles.ballMarker} aria-hidden="true" />}
      {heading}
      <div ref={trackRef} className={styles.track}>
        {children}
      </div>
    </div>
  );
}
