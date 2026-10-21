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
import { GyroObject } from '@/components/hero/GyroObject';
import { KnifeObject } from '@/components/hero/KnifeObject';
import { pickHeroKind, type HeroObjectHandle } from '@/components/hero/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './HeroSection.module.css';

gsap.registerPlugin(ScrollTrigger);

/** The pinned, scroll-driven hero needs motion; with reduced motion the object simply sits open. */
const PINNED_QUERY = '(prefers-reduced-motion: no-preference)';
/** Viewport heights of scroll the object takes to open. */
const SCROLL_LENGTH = 2.4;

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
  const [kind] = useState(pickHeroKind);
  const [pinned, setPinned] = useState(() => window.matchMedia(PINNED_QUERY).matches);

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
      objectRef.current?.apply(1);
      stage.style.setProperty('--p', '1');
      return;
    }

    let cancelled = false;
    let trigger: ScrollTrigger | null = null;
    const apply = (progress: number) => {
      objectRef.current?.apply(progress);
      stage.style.setProperty('--p', progress.toFixed(3));
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
      stage.style.removeProperty('--p');
    };
  }, [pinned]);

  return (
    <section id="about" className={styles.hero}>
      <div
        id="hero-stage"
        ref={stageRef}
        className={styles.stage}
        data-mode={pinned ? 'pinned' : 'static'}
        data-object={kind}
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
          {kind === 'gyro' ? (
            <GyroObject ref={objectRef} initial={pinned ? 0 : 1} />
          ) : (
            <KnifeObject ref={objectRef} initial={pinned ? 0 : 1} />
          )}
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
        <div className={styles.aboutGrid}>
          <div className={styles.aboutText}>
            <p className={styles.eyebrow}>About Me</p>
            <AttentionBio text={profile.bio} />
          </div>

          {/* Empty on purpose: the particle ball parks here for this scene. */}
          <div id="ball-about" className={styles.ballWindow} aria-hidden="true" />
        </div>

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
