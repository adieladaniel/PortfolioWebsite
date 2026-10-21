import { profile } from '@/data/profile';
import { education } from '@/data/education';
import { internships } from '@/data/internships';
import { codingStats } from '@/data/codingStats';
import { skills } from '@/data/skills';
import { contact } from '@/data/contact';
import { AttentionBio } from '@/components/AttentionBio';
import { RoleTicker } from '@/components/RoleTicker';
import { CountUpNumber } from '@/components/CountUpNumber';
import { MagneticLink } from '@/components/MagneticLink';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './HeroSection.module.css';

const cgpaEntry = education.find((entry) => entry.gpa);
const cgpaNumeric = parseFloat(cgpaEntry?.gpa?.split(' ')[0] ?? '0');
const gradYearMatch = cgpaEntry?.endDate.match(/\d{4}/);
const gradYear = gradYearMatch?.[0] ?? '—';

export function HeroSection() {
  const about = useScrollReveal<HTMLDivElement>(0.15);

  return (
    <section id="about" className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />

      {/* Fills exactly one viewport on its own — the About Me copy below
          must never peek above the fold on load, only appear once the user
          actually scrolls. */}
      <div className={styles.introScreen}>
        <div className={styles.top}>
          <div className={styles.intro}>
            <p className={styles.hello}>Hello! I&apos;m</p>
            <h1 className={styles.name}>{profile.name}</h1>
          </div>
          <div className={styles.roleWrap}>
            <p className={styles.rolePrefix}>A Creative</p>
            <p className={styles.role}>
              <RoleTicker roles={profile.roles} />
            </p>
          </div>
        </div>

        {/* Empty on purpose: BackgroundField's particle system reads this
            element's rect and assembles the hero shape here. */}
        <div id="hero-stage" className={styles.stage} aria-hidden="true" />

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
            <p className={styles.skillsLabel}>Skills</p>
            <div className={styles.skillsRow}>
              {skills.map((skill, i) => (
                <span
                  key={skill.name}
                  className={styles.skillTag}
                  style={{ transitionDelay: `${Math.min(i, 24) * 16}ms` }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
