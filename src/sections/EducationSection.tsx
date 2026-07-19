import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { HorizontalScrollPanel } from '@/components/HorizontalScrollPanel';
import { education } from '@/data/education';
import { certifications } from '@/data/certifications';
import styles from './EducationSection.module.css';

interface EduRow {
  key: string;
  title: string;
  subtitle: string;
  dateRange: string;
  detail?: string;
}

// Most-recent-first (resume convention). Certifications keep their own
// heading + numbering within the same horizontal-scroll track — the
// reference site has no separate certifications section, and a
// certification is really just a short-form qualification, so it stays in
// this same Education panel rather than a whole extra nav section — but a
// small divider heading marks where one group ends and the other begins.
const eduRows: EduRow[] = education.map((entry) => ({
  key: entry.institution,
  title: entry.institution,
  subtitle: entry.location ?? '',
  dateRange: `${entry.startDate} – ${entry.endDate}`,
  detail: entry.gpa ? `${entry.detail} · ${entry.gpa}` : entry.detail,
}));

const certRows: EduRow[] = certifications.map((cert) => ({
  key: cert.name,
  title: cert.issuer,
  subtitle: cert.name,
  dateRange: cert.date,
}));

function Slide({ row, index }: { row: EduRow; index: number }) {
  return (
    <div className={styles.slide}>
      <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.body}>
        <p className={styles.title}>{row.title}</p>
        <p className={styles.dates}>{row.dateRange}</p>
        <p className={styles.subtitle}>{row.subtitle}</p>
        {row.detail && <p className={styles.detail}>{row.detail}</p>}
      </div>
    </div>
  );
}

export function EducationSection() {
  return (
    <Section id="education">
      <HorizontalScrollPanel heading={<SectionHeading prefix="My" accent="Education" />}>
        {eduRows.map((row, i) => (
          <Slide key={row.key} row={row} index={i} />
        ))}

        <div className={styles.divider}>
          <p className={styles.dividerLabel}>Certifications</p>
        </div>

        {certRows.map((row, i) => (
          <Slide key={row.key} row={row} index={i} />
        ))}
      </HorizontalScrollPanel>
    </Section>
  );
}
