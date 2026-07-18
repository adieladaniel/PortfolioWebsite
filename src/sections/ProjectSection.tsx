import { useState } from 'react';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';
import { useSceneStore } from '@/store/sceneStore';
import styles from './ProjectSection.module.css';

function ProjectCard({ project }: { project: Project }) {
  const [clicked, setClicked] = useState(false);
  const isHoveredIn3D = useSceneStore((s) => s.hoveredProjectId === project.id);
  const expanded = clicked || isHoveredIn3D;

  return (
    <GlassPanel
      className={styles.card}
      data-cursor={expanded ? 'close' : 'expand'}
      onClick={() => setClicked((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setClicked((v) => !v);
      }}
    >
      <div className={styles.top}>
        <h3 className={styles.name}>{project.name}</h3>
        <span className={styles.dates}>
          {project.startDate} – {project.endDate}
        </span>
      </div>
      <p className={styles.tagline}>{project.tagline}</p>

      <div className={styles.details} data-expanded={expanded}>
        <div className={styles.detailsInner}>
          <ul className={styles.bullets}>
            {project.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <div className={styles.tech}>
            {project.tech.map((t) => (
              <span key={t} className={styles.techTag}>
                {t}
              </span>
            ))}
          </div>
          {(project.link || project.repo) && (
            <a
              className={styles.viewLink}
              data-cursor="open"
              href={project.link || project.repo}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {project.link ? 'view project ↗' : 'view on github ↗'}
            </a>
          )}
        </div>
      </div>

      {!expanded && (
        <p className={styles.expandCue}>hover the wireframe object, or click to see more →</p>
      )}
    </GlassPanel>
  );
}

export function ProjectSection() {
  return (
    <Section id="projects" align="left">
      <SectionHeading index="03" title="Projects" />
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Section>
  );
}
