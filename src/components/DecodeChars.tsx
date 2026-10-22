import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import styles from './DecodeChars.module.css';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/';
/** Each letter flickers through random glyphs, then locks in: the first at this time, the rest staggered. */
const SETTLE_BASE_MS = 380;
const SETTLE_STEP_MS = 32;
const SHUFFLE_MS = 55;

const shown = (char: string) => (char === ' ' ? ' ' : char);

interface DecodeCharsProps {
  text: string;
  /** The decode starts when this turns true and plays once. */
  revealed: boolean;
  charClass?: (index: number) => string | undefined;
  charStyle?: (index: number) => CSSProperties | undefined;
}

/**
 * Renders `text` as one span per letter and, once `revealed`, scrambles each
 * letter through random glyphs before settling on the real one. Widths are
 * pinned while it plays so the line never jitters. The parent heading should
 * carry an aria-label with the full text, because the letters change under
 * assistive tech while this runs. Skipped entirely under reduced motion.
 */
export function DecodeChars({ text, revealed, charClass, charStyle }: DecodeCharsProps) {
  const chars = useMemo(() => text.split(''), [text]);
  const refs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!revealed) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = refs.current;
    els.forEach((el) => {
      if (el) el.style.width = `${el.getBoundingClientRect().width}px`;
    });

    const start = performance.now();
    const lastShuffle = chars.map(() => 0);
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      let pending = 0;
      els.forEach((el, i) => {
        const final = chars[i] ?? '';
        if (!el || final.trim() === '') return;
        if (elapsed >= SETTLE_BASE_MS + i * SETTLE_STEP_MS) {
          if (el.dataset.scrambling === 'true') {
            el.textContent = shown(final);
            el.dataset.scrambling = 'false';
          }
          return;
        }
        pending++;
        el.dataset.scrambling = 'true';
        if (now - (lastShuffle[i] ?? 0) > SHUFFLE_MS) {
          lastShuffle[i] = now;
          el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? final;
        }
      });
      if (pending > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        els.forEach((el) => {
          if (el) el.style.width = '';
        });
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      els.forEach((el, i) => {
        if (!el) return;
        el.textContent = shown(chars[i] ?? '');
        el.style.width = '';
        delete el.dataset.scrambling;
      });
    };
  }, [revealed, chars]);

  // Every letter is its own inline block, and a line may break between any two of those, which
  // split long words ("experi / ence") on a narrow screen. Each word is wrapped so a line can only
  // break at the spaces between words.
  const segments = useMemo(() => {
    const out: Array<{ indices: number[]; isSpace: boolean }> = [];
    chars.forEach((char, i) => {
      const isSpace = char === ' ';
      const last = out[out.length - 1];
      if (last && !isSpace && !last.isSpace) last.indices.push(i);
      else out.push({ indices: [i], isSpace });
    });
    return out;
  }, [chars]);

  const letter = (i: number) => (
    <span
      key={i}
      ref={(el) => {
        refs.current[i] = el;
      }}
      className={[styles.char, charClass?.(i)].filter(Boolean).join(' ')}
      style={charStyle?.(i)}
      data-revealed={revealed}
    >
      {shown(chars[i] ?? '')}
    </span>
  );

  return (
    <>
      {segments.map((segment) =>
        segment.isSpace ? (
          segment.indices.map(letter)
        ) : (
          <span key={segment.indices[0]} className={styles.word}>
            {segment.indices.map(letter)}
          </span>
        ),
      )}
    </>
  );
}
