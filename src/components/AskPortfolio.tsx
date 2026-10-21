import { useState, type FormEvent } from 'react';
import { askPortfolio, type Answer } from '@/lib/portfolioSearch';
import { getLenis } from '@/lib/lenis';
import styles from './AskPortfolio.module.css';

const SUGGESTIONS = [
  'What did you build at Edunext?',
  'Which projects use RAG?',
  "What's your CGPA?",
  'Which certificates do you have?',
  'How can I contact you?',
];

const NAV_OFFSET = -72;

interface Result {
  question: string;
  answer: Answer | null;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET });
}

/**
 * A question box over the portfolio's own content. It is plain keyword
 * search, not a language model, and says so: it answers only from what is on
 * the site, cites the sections it used, and admits when it has nothing.
 */
export function AskPortfolio() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setResult({ question: trimmed, answer: askPortfolio(trimmed) });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(value);
  };

  return (
    <section className={styles.ask} aria-labelledby="ask-heading">
      <h3 id="ask-heading" className={styles.title}>
        Ask my portfolio
      </h3>
      <p className={styles.note}>
        A search over this site&apos;s own content, not an AI. It answers only from what is here and shows where.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.visuallyHidden} htmlFor="ask-input">
          Your question
        </label>
        <input
          id="ask-input"
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Try: which projects use RAG?"
          autoComplete="off"
        />
        <button type="submit" className={styles.submit} data-liquid data-cursor="ask">
          Ask
        </button>
      </form>

      <div className={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className={styles.suggestion}
            onClick={() => {
              setValue(suggestion);
              ask(suggestion);
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className={styles.result} aria-live="polite">
        {result && (
          <div className={styles.card} key={result.question}>
            <p className={styles.question}>{result.question}</p>
            {result.answer ? (
              <>
                <p className={styles.summary}>{result.answer.summary}</p>
                {result.answer.details.length > 0 && (
                  <ul className={styles.details}>
                    {result.answer.details.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
                <div className={styles.sources}>
                  <span className={styles.sourcesLabel}>Sources</span>
                  {result.answer.sources.map((source) => (
                    <span key={`${source.sectionId}-${source.title}`} className={styles.source}>
                      <button type="button" onClick={() => scrollToSection(source.sectionId)}>
                        {source.title}
                      </button>
                      {source.href && (
                        <a href={source.href} target="_blank" rel="noreferrer" aria-label={`Open ${source.title}`}>
                          ↗
                        </a>
                      )}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.summary}>
                I don&apos;t have that in my portfolio. Try asking about projects, internships, skills, education,
                certificates or how to reach me.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
