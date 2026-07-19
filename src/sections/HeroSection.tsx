import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { profile } from '@/data/profile';
import { education } from '@/data/education';
import { internships } from '@/data/internships';
import { codingStats } from '@/data/codingStats';
import { skills } from '@/data/skills';
import { contact } from '@/data/contact';
import { RoleTicker } from '@/components/RoleTicker';
import { CountUpNumber } from '@/components/CountUpNumber';
import { MagneticLink } from '@/components/MagneticLink';
import { RobotAvatar } from '@/scenes/RobotAvatar';
import { hasWebGL2 } from '@/utils/webgl';
import { deviceTier } from '@/utils/deviceTier';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './HeroSection.module.css';

const DPR: [number, number] = deviceTier === 'low' ? [1, 1.25] : deviceTier === 'mid' ? [1, 1.5] : [1, 2];

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

        <div id="hero-stage" className={styles.stage} aria-hidden="true">
          {hasWebGL2 ? (
            <Canvas camera={{ fov: 28, position: [0, 0, 13] }} dpr={DPR}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 5, 2]} intensity={1.4} color="#ffcf9e" />
              <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#6b4a35" />
              <Suspense fallback={null}>
                <RobotAvatar />
              </Suspense>
            </Canvas>
          ) : (
            <div className={styles.stagePlaceholder} />
          )}
        </div>

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
            <p className={styles.bio}>{profile.bio}</p>
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
      </div>
    </section>
  );
}
