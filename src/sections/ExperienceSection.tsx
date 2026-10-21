import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { internships } from '@/data/internships';
import styles from './ExperienceSection.module.css';

export function ExperienceSection() {
  return (
    <Section id="experience">
      <SectionHeading prefix="My career &" accent="experience" />
      <div className={styles.list}>
        <div id="ball-experience" className={styles.ballMarker} aria-hidden="true" />
        {internships.map((intern) => (
          <div key={intern.id} className={styles.row}>
            <div className={styles.roleCol}>
              <p className={styles.role}>{intern.role}</p>
              <p className={styles.company}>{intern.company}</p>
            </div>

            <div className={styles.dateCol}>
              <span className={styles.connector} aria-hidden="true">
                <span className={styles.connectorLine} />
                <span className={styles.connectorDot} />
              </span>
              <p className={styles.dates}>
                {intern.startDate} – {intern.endDate}
              </p>
              <p className={styles.location}>{intern.location}</p>
            </div>

            <div className={styles.detailCol}>
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
                  data-liquid
                  data-cursor="open"
                  data-magnetic
                  href={intern.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  view details ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
