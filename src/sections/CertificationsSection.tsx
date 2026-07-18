import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { certifications } from '@/data/certifications';
import styles from './CertificationsSection.module.css';

export function CertificationsSection() {
  return (
    <Section id="certifications" align="right">
      <SectionHeading index="06" title="Certifications" />
      <GlassPanel className={styles.list}>
        {certifications.map((cert) => (
          <div key={cert.name} className={styles.entry}>
            <span>
              <span className={styles.name}>{cert.name}</span>
              <span className={styles.issuer}>{cert.issuer}</span>
            </span>
            <span className={styles.date}>{cert.date}</span>
          </div>
        ))}
      </GlassPanel>
    </Section>
  );
}
