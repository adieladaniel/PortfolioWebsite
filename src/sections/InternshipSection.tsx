import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { internships } from '@/data/internships';
import styles from './InternshipSection.module.css';

export function InternshipSection() {
  return (
    <Section id="internships" align="right">
      <SectionHeading index="02" title="Internships" />
      <div className={styles.list}>
        {internships.map((intern) => (
          <GlassPanel key={intern.id} className={styles.entry}>
            <div className={styles.top}>
              <h3 className={styles.company}>{intern.company}</h3>
              <span className={styles.dates}>
                {intern.startDate} – {intern.endDate} · {intern.location}
              </span>
            </div>
            <p className={styles.role}>{intern.role}</p>
            <ul className={styles.bullets}>
              {intern.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <div className={styles.tech}>
              {intern.tech.map((t) => (
                <span key={t} className={styles.techTag}>
                  {t}
                </span>
              ))}
            </div>
            {intern.link && (
              <a
                className={styles.viewLink}
                data-cursor="open"
                href={intern.link}
                target="_blank"
                rel="noreferrer"
              >
                view details ↗
              </a>
            )}
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}
