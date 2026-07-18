import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { skills } from '@/data/skills';
import type { SkillCategory } from '@/data/types';
import styles from './SkillsSection.module.css';

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  languages: 'Languages',
  frameworks: 'Frameworks & Libraries',
  'ai-ml': 'AI / ML',
  tools: 'Developer Tools',
  concepts: 'Concepts',
};

const CATEGORY_ORDER: SkillCategory[] = ['languages', 'frameworks', 'ai-ml', 'tools', 'concepts'];

export function SkillsSection() {
  return (
    <Section id="skills" align="right">
      <SectionHeading index="04" title="Skills" />
      <GlassPanel className={styles.groups}>
        {CATEGORY_ORDER.map((category) => (
          <div key={category} className={styles.group}>
            <span className={styles.label}>{CATEGORY_LABELS[category]}</span>
            <div className={styles.tags}>
              {skills
                .filter((s) => s.category === category)
                .map((s) => (
                  <span key={s.name} className={styles.tag}>
                    {s.name}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </GlassPanel>
    </Section>
  );
}
