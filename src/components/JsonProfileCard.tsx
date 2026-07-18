import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './JsonProfileCard.module.css';

type TokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct';

interface Token {
  text: string;
  type: TokenType;
}

const JSON_TOKEN_PATTERN =
  /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function tokenizeJson(json: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = JSON_TOKEN_PATTERN.exec(json)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: json.slice(lastIndex, match.index), type: 'punct' });
    }
    const value = match[0];
    let type: TokenType = 'number';
    if (value.startsWith('"')) {
      type = /:\s*$/.test(value) ? 'key' : 'string';
    } else if (value === 'true' || value === 'false') {
      type = 'boolean';
    } else if (value === 'null') {
      type = 'null';
    }
    tokens.push({ text: value, type });
    lastIndex = JSON_TOKEN_PATTERN.lastIndex;
  }
  if (lastIndex < json.length) {
    tokens.push({ text: json.slice(lastIndex), type: 'punct' });
  }
  return tokens;
}

interface JsonProfileCardProps {
  data: Record<string, unknown>;
  fileName?: string;
}

/** A terminal-styled card that types out `data` as syntax-highlighted JSON, once scrolled into view. */
export function JsonProfileCard({ data, fileName = 'profile.json' }: JsonProfileCardProps) {
  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const tokens = useMemo(() => tokenizeJson(jsonString), [jsonString]);
  const totalLength = jsonString.length;

  const [revealed, setRevealed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(totalLength);
      return;
    }

    let rafId: number;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started.current) continue;
          started.current = true;

          // Time-based, not tick-count-based: the page has a busy per-frame
          // 3D scene competing for the main thread, so a fixed "N chars per
          // setTimeout tick" loop ran far slower than intended in practice
          // (ticks were throttled well past their nominal delay). Driving
          // progress off elapsed wall-clock time instead guarantees this
          // finishes within DURATION_MS regardless of how many frames
          // actually fire.
          const DURATION_MS = 4200;
          let startTime: number | null = null;
          const step = (now: number) => {
            if (startTime === null) startTime = now;
            const t = Math.min(1, (now - startTime) / DURATION_MS);
            setRevealed(Math.floor(t * totalLength));
            if (t < 1) rafId = requestAnimationFrame(step);
          };
          rafId = requestAnimationFrame(step);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [totalLength]);

  let offset = 0;

  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.titleBar}>
        <span className={styles.dots}>
          <span className={styles.dot} data-color="red" />
          <span className={styles.dot} data-color="yellow" />
          <span className={styles.dot} data-color="green" />
        </span>
        <span className={styles.fileName}>{fileName}</span>
      </div>
      <pre className={styles.code}>
        {tokens.map((token, i) => {
          const start = offset;
          offset += token.text.length;
          const visibleCount = Math.max(0, Math.min(token.text.length, revealed - start));
          if (visibleCount <= 0) return null;
          return (
            <span key={i} className={styles[token.type]}>
              {token.text.slice(0, visibleCount)}
            </span>
          );
        })}
        <span className={styles.cursor} />
      </pre>
    </div>
  );
}
