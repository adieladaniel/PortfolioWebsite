import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { CountUpNumber } from '@/components/CountUpNumber';
import { codingStats } from '@/data/codingStats';
import type { CodingTopic, ProficiencyTier } from '@/data/types';
import { useSceneStore } from '@/store/sceneStore';
import styles from './CodingStatsSection.module.css';

const TIER_ORDER: ProficiencyTier[] = ['advanced', 'intermediate', 'fundamental'];
const TIER_LABELS: Record<ProficiencyTier, string> = {
  advanced: 'Advanced',
  intermediate: 'Intermediate',
  fundamental: 'Fundamental',
};
const TIER_COLOR_VAR: Record<ProficiencyTier, string> = {
  advanced: 'var(--color-hot)',
  intermediate: 'var(--color-amber)',
  fundamental: 'var(--color-rust)',
};

interface TopicRowProps {
  topic: CodingTopic;
  tier: ProficiencyTier;
  maxCount: number;
}

/** Own component so the hover selector only re-renders this one row, not the whole list. */
function TopicRow({ topic, tier, maxCount }: TopicRowProps) {
  const isHovered = useSceneStore((s) => s.hoveredTopicId === topic.name);
  const setHoveredTopicId = useSceneStore((s) => s.setHoveredTopicId);

  return (
    <div
      className={isHovered ? `${styles.topicRow} ${styles.topicRowHovered}` : styles.topicRow}
      onMouseEnter={() => setHoveredTopicId(topic.name)}
      onMouseLeave={() => setHoveredTopicId(null)}
    >
      <span className={styles.topicName}>{topic.name}</span>
      <span className={styles.topicCount}>×{topic.count}</span>
      <div className={styles.topicBarTrack}>
        <div
          className={styles.topicBarFill}
          style={{
            width: `${(topic.count / maxCount) * 100}%`,
            background: TIER_COLOR_VAR[tier],
          }}
        />
      </div>
    </div>
  );
}

export function CodingStatsSection() {
  const maxCount = Math.max(...codingStats.topics.map((t) => t.count));

  return (
    <Section id="coding-stats" align="left">
      <SectionHeading index="05" title="Coding Activity" />

      <GlassPanel className={styles.panel}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.bigNumber}>
              <CountUpNumber value={codingStats.totalSolved} suffix="+" />
            </div>
            <div className={styles.bigNumberLabel}>Problems solved on LeetCode</div>
          </div>
          <a
            className={styles.codolioLink}
            data-cursor="open"
            href={codingStats.codolioUrl}
            target="_blank"
            rel="noreferrer"
          >
            full cross-platform stats on Codolio ↗
          </a>
        </div>

        <div className={styles.tiers}>
          {TIER_ORDER.map((tier) => {
            const topics = codingStats.topics
              .filter((t) => t.tier === tier)
              .sort((a, b) => b.count - a.count);
            return (
              <div key={tier} className={styles.tier}>
                <div className={styles.tierLabel}>
                  <span className={styles.tierDot} style={{ background: TIER_COLOR_VAR[tier] }} />
                  {TIER_LABELS[tier]}
                </div>
                {topics.map((topic) => (
                  <TopicRow key={topic.name} topic={topic} tier={tier} maxCount={maxCount} />
                ))}
              </div>
            );
          })}
        </div>

        <div className={styles.languages}>
          {codingStats.languages.map((lang) => (
            <div key={lang.name} className={styles.languageStat}>
              <div className={styles.languageCount}>
                <CountUpNumber value={lang.solved} />
              </div>
              <div className={styles.languageName}>{lang.name}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </Section>
  );
}
