import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenis } from '@/lib/lenis';

gsap.registerPlugin(ScrollTrigger);

// Fixed Nav height (--nav-height: 4.5rem) so in-page anchor jumps land below it.
const NAV_OFFSET = -72;

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so Lenis and ScrollTrigger
 * read the same frame's scroll position (no pin jitter or scrub lag). Renders
 * nothing; skipped entirely under prefers-reduced-motion, where the page
 * keeps native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      autoRaf: false,
      anchors: { offset: NAV_OFFSET },
    });

    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
