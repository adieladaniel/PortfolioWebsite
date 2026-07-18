import { profile } from '@/data/profile';
import { education } from '@/data/education';
import { internships } from '@/data/internships';
import { codingStats } from '@/data/codingStats';
import { skills } from '@/data/skills';
import { RoleTicker } from '@/components/RoleTicker';
import { CountUpNumber } from '@/components/CountUpNumber';
import { JsonProfileCard } from '@/components/JsonProfileCard';
import styles from './HeroSection.module.css';

const cgpaEntry = education.find((entry) => entry.gpa);
const cgpaNumeric = parseFloat(cgpaEntry?.gpa?.split(' ')[0] ?? '0');
const gradYearMatch = cgpaEntry?.endDate.match(/\d{4}/);
const gradYear = gradYearMatch?.[0] ?? '—';

const focusAreas = skills.filter((s) => s.category === 'ai-ml').slice(0, 4).map((s) => s.name);

const jsonData = {
  name: profile.name,
  role: profile.roles[0],
  location: profile.location,
  focus: focusAreas,
  cgpa: cgpaNumeric,
  problems_solved: codingStats.totalSolved,
  internships: internships.length,
  status: 'available for opportunities',
};

export function HeroSection() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.scrim} />
      <div className={styles.inner}>
        <div className={styles.textColumn}>
          <p className={styles.eyebrow}>{profile.location}</p>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.roleLine}>
            <RoleTicker roles={profile.roles} />
          </p>
          <p className={styles.headline}>{profile.headline}</p>

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

          <p className={styles.bio}>{profile.bio}</p>

          <div className={styles.scrollCue}>
            <span className={styles.scrollLine} />
            <span>scroll to begin the journey</span>
          </div>
        </div>

        <div className={styles.cardColumn}>
          <JsonProfileCard data={jsonData} />
        </div>
      </div>
    </section>
  );
}
