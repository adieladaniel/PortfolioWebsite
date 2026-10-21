import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { HorizontalScrollPanel } from '@/components/HorizontalScrollPanel';
import { projects } from '@/data/projects';
import styles from './ProjectSection.module.css';

export function ProjectSection() {
  return (
    <Section id="projects">
      <HorizontalScrollPanel ballId="ball-projects" heading={<SectionHeading prefix="My" accent="Projects" />}>
        {projects.map((project, i) => (
          <div key={project.id} className={styles.slide}>
            <div className={styles.top}>
              <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
              <div className={styles.titleBlock}>
                <p className={styles.name}>{project.name}</p>
                <p className={styles.dates}>
                  {project.startDate === project.endDate ? project.startDate : `${project.startDate} – ${project.endDate}`}
                </p>
              </div>
            </div>

            <p className={styles.tagline}>{project.tagline}</p>

            <ul className={styles.bullets}>
              {project.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <div className={styles.footer}>
              <p className={styles.toolsLabel}>Tools and features</p>
              <p className={styles.tools}>{project.tech.join(', ')}</p>
            </div>

            {(project.link || project.repo) && (
              <div className={styles.links}>
                {project.link && (
                  <a
                    className={styles.viewLink}
                    data-cursor="open"
                    data-magnetic
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    live demo ↗
                  </a>
                )}
                {project.repo && (
                  <a
                    className={styles.viewLink}
                    data-cursor="open"
                    data-magnetic
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    view on github ↗
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </HorizontalScrollPanel>
    </Section>
  );
}
