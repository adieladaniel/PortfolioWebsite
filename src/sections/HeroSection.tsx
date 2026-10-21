import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '@/data/profile';
import { education } from '@/data/education';
import { internships } from '@/data/internships';
import { codingStats } from '@/data/codingStats';
import { contact } from '@/data/contact';
import { AttentionBio } from '@/components/AttentionBio';
import { RoleTicker } from '@/components/RoleTicker';
import { SkillsPlayground } from '@/components/SkillsPlayground';
import { CountUpNumber } from '@/components/CountUpNumber';
import { MagneticLink } from '@/components/MagneticLink';
import { KnifeObject } from '@/components/hero/KnifeObject';
import { clamp01, smooth, type HeroObjectHandle } from '@/components/hero/types';
import { knifeGeometry } from '@/data/hero/knifeGeometry';
import { knifeLabels } from '@/data/hero/labels';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './HeroSection.module.css';

gsap.registerPlugin(ScrollTrigger);

/** The pinned, scroll-driven hero needs motion; with reduced motion the object simply sits open. */
const PINNED_QUERY = '(prefers-reduced-motion: no-preference)';
/**
 * One pinned scene, in four beats, as fractions of its scroll: the knife opens
 * and is labelled (hero), the labels and the name leave while the knife glides
 * to the right edge, the About text comes in on the left, then the knife's tools
 * are picked out one at a time, each with the project that proves it.
 */
const SCROLL_LENGTH = 5.6;
const OPEN = { from: 0.012, to: 0.2 };
const LABELS_IN = 0.19;
const LABELS_OUT = 0.29;
const GLIDE = { from: 0.31, to: 0.44 };
const BIO_IN = { from: 0.37, to: 0.46 };
const FOCUS_FROM = 0.47;
/** Order the tools are picked out in: alternating left and right. */
const FOCUS_ORDER = knifeGeometry.openOrder;
const TOOL_COUNT = FOCUS_ORDER.length;

const cgpaEntry = education.find((entry) => entry.gpa);
const cgpaNumeric = parseFloat(cgpaEntry?.gpa?.split(' ')[0] ?? '0');
const gradYearMatch = cgpaEntry?.endDate.match(/\d{4}/);
const gradYear = gradYearMatch?.[0] ?? '—';

const nameParts = profile.name.split(' ');
const firstName = nameParts[0] ?? profile.name;
const lastName = nameParts[nameParts.length - 1] ?? '';
const middleInitial = nameParts.length > 2 ? (nameParts[1] ?? '') : '';

export function HeroSection() {
  const about = useScrollReveal<HTMLDivElement>(0.15);
  const stageRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HeroObjectHandle>(null);
  const [pinned, setPinned] = useState(() => window.matchMedia(PINNED_QUERY).matches);
  /** Which tool is picked out in the card beside the About text (an index into FOCUS_ORDER), or -1. */
  const [focus, setFocus] = useState(-1);
  const focusRef = useRef(-1);

  useEffect(() => {
    const query = window.matchMedia(PINNED_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setPinned(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!pinned) {
      objectRef.current?.apply({ open: 1, labels: 1, focus: null });
      stage.style.setProperty('--p', '1');
      return;
    }

    let cancelled = false;
    let trigger: ScrollTrigger | null = null;
    const apply = (progress: number) => {
      const labels = smooth((progress - LABELS_IN) / 0.05) * (1 - smooth((progress - LABELS_OUT) / 0.05));
      const picked =
        progress < FOCUS_FROM ? -1 : Math.min(TOOL_COUNT - 1, Math.floor(((progress - FOCUS_FROM) / (1 - FOCUS_FROM)) * TOOL_COUNT));
      objectRef.current?.apply({
        open: clamp01((progress - OPEN.from) / (OPEN.to - OPEN.from)),
        labels,
        focus: picked < 0 ? null : (FOCUS_ORDER[picked] ?? null),
      });
      // --p paces the name, the initial and the hint; --shift moves the knife; --bio brings the About text in
      stage.style.setProperty('--p', clamp01(progress / 0.43).toFixed(3));
      stage.style.setProperty('--shift', smooth((progress - GLIDE.from) / (GLIDE.to - GLIDE.from)).toFixed(3));
      const bio = smooth((progress - BIO_IN.from) / (BIO_IN.to - BIO_IN.from));
      stage.style.setProperty('--bio', bio.toFixed(3));
      stage.dataset.about = bio > 0.02 ? 'true' : 'false';
      if (picked !== focusRef.current) {
        focusRef.current = picked;
        setFocus(picked);
      }
    };

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        trigger = ScrollTrigger.create({
          trigger: stage,
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
      ['--p', '--shift', '--bio'].forEach((name) => stage.style.removeProperty(name));
    };
  }, [pinned]);

  return (
    <section id="about" className={styles.hero}>
      <div
        id="hero-stage"
        ref={stageRef}
        className={styles.stage}
        data-mode={pinned ? 'pinned' : 'static'}
        data-about="false"
      >
        <div className={styles.glow} aria-hidden="true" />

        {/* The name is the backdrop: huge, behind the object, then it steps aside as the object opens. */}
        <h1 className={styles.name} aria-label={profile.name}>
          <span className={styles.first} aria-hidden="true">
            <span className={styles.hello}>Hello! I&apos;m</span>
            {firstName}
          </span>
          {/* Only shown when the knife is not (reduced motion): otherwise the A sits on the knife's handle. */}
          <span className={styles.mid} aria-hidden="true">
            {middleInitial}
          </span>
          <span className={styles.last} aria-hidden="true">
            {lastName}
          </span>
        </h1>

        <div className={styles.objectSlot}>
          <KnifeObject ref={objectRef} initial={pinned ? 0 : 1} />
        </div>

        <div className={styles.footer}>
          <div className={styles.roleWrap}>
            <p className={styles.rolePrefix}>A Creative</p>
            <p className={styles.role}>
              <RoleTicker roles={profile.roles} />
            </p>
          </div>

          <p className={styles.hint} aria-hidden="true">
            <span className={styles.hintDot} /> Scroll to open it
          </p>

          <div className={styles.socials}>
            <a
              className={styles.socialLink}
              data-cursor="github"
              data-magnetic
              href={contact.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              GitHub
            </a>
            <a
              className={styles.socialLink}
              data-cursor="linkedin"
              data-magnetic
              href={contact.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* The About text, which comes in on the left as the knife glides to the right. */}
        <div className={styles.bioPane}>
          <p className={styles.eyebrow}>About Me</p>
          <AttentionBio text={profile.bio} />

          <div className={styles.toolCard} data-active={focus >= 0} aria-live="polite">
            {/* Re-mounted on every change (the key), so the sweep and glow play again each time the tool changes. */}
            {focus >= 0 && <span key={focus} className={styles.flash} aria-hidden="true" />}
            <p className={styles.toolCount} aria-hidden="true" data-on={focus >= 0}>
              {String(Math.max(focus, 0) + 1).padStart(2, '0')} / {String(TOOL_COUNT).padStart(2, '0')}
            </p>
            <div className={styles.toolFace} data-on={focus < 0}>
              <p className={styles.toolName}>The toolkit</p>
              <p className={styles.toolProject}>Eight tools, eight projects</p>
              <p className={styles.toolProof}>Keep scrolling: each tool is something I build with, next to the project that proves it.</p>
            </div>
            {FOCUS_ORDER.map((toolName, i) => {
              const label = knifeLabels[toolName];
              if (!label) return null;
              return (
                <div key={toolName} className={styles.toolFace} data-on={focus === i}>
                  <p className={styles.toolName}>{label.name}</p>
                  <p className={styles.toolProject}>{label.project}</p>
                  <p className={styles.toolProof}>{label.proof}</p>
                </div>
              );
            })}
            <div className={styles.toolDots} aria-hidden="true">
              {FOCUS_ORDER.map((toolName, i) => (
                <span key={toolName} data-on={focus === i} />
              ))}
            </div>
          </div>
        </div>

        {/* With motion off the cards are a plain list under the text instead. */}
        <ul className={styles.toolList}>
          {FOCUS_ORDER.map((toolName) => {
            const label = knifeLabels[toolName];
            return label ? (
              <li key={toolName}>
                <span className={styles.toolName}>{label.name}</span>
                <span className={styles.toolProject}>{label.project}</span>
                <span className={styles.toolProof}>{label.proof}</span>
              </li>
            ) : null;
          })}
        </ul>

        <MagneticLink
          className={styles.resumeTab}
          data-cursor="download"
          href={contact.resumeUrl}
          target="_blank"
          rel="noreferrer"
        >
          Resume
        </MagneticLink>
      </div>

      <div id="about-me" ref={about.ref} className={styles.about} data-revealed={about.revealed}>
        <div className={styles.aboutSide}>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                <CountUpNumber value={cgpaNumeric} decimals={1} />
              </span>
              <span className={styles.statLabel}>CGPA</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                <CountUpNumber value={codingStats.totalSolved} suffix="+" />
              </span>
              <span className={styles.statLabel}>Problems Solved</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                <CountUpNumber value={internships.length} />
              </span>
              <span className={styles.statLabel}>Internships</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{gradYear}</span>
              <span className={styles.statLabel}>Graduating</span>
            </div>
          </div>

          <div className={styles.skills}>
            <SkillsPlayground />
          </div>
        </div>
      </div>
    </section>
  );
}
