import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { education } from '@/data/education';
import styles from './EducationSection.module.css';

export function EducationSection() {
  return (
    <Section id="education" align="left">
      <SectionHeading index="01" title="Education" />
      <div className={styles.list}>
        {education.map((entry) => (
          <GlassPanel key={entry.institution} className={styles.entry}>
            <h3 className={styles.institution}>{entry.institution}</h3>
            <span className={styles.meta}>
              {entry.startDate} – {entry.endDate}
              {entry.location && <><br />{entry.location}</>}
              {entry.gpa && <span className={styles.gpa}>{entry.gpa}</span>}
            </span>
            <p className={styles.detail}>{entry.detail}</p>
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}
