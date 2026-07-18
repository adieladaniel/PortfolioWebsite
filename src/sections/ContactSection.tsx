import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { GlassPanel } from '@/components/GlassPanel';
import { MagneticLink } from '@/components/MagneticLink';
import { contact } from '@/data/contact';
import styles from './ContactSection.module.css';

export function ContactSection() {
  return (
    <Section id="contact">
      <SectionHeading index="07" title="Contact" />
      <div className={styles.contact}>
        <GlassPanel className={styles.panel}>
          <h2 className={styles.title}>Let's build something intelligent together.</h2>
          <div className={styles.links}>
            <MagneticLink className={styles.link} data-cursor="email" href={`mailto:${contact.email}`}>
              {contact.email}
            </MagneticLink>
            <MagneticLink
              className={styles.link}
              data-cursor="open"
              href={contact.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              {contact.github}
            </MagneticLink>
            <MagneticLink
              className={styles.link}
              data-cursor="open"
              href={contact.linkedinUrl}
              target="_blank"
              rel="noreferrer"
            >
              {contact.linkedin}
            </MagneticLink>
            <MagneticLink
              className={styles.link}
              data-cursor="download"
              href={contact.resumeUrl}
              target="_blank"
              rel="noreferrer"
            >
              resume.pdf ↓
            </MagneticLink>
          </div>
          <p className={styles.footer}>designed &amp; built by {contact.email.split('@')[0]}</p>
        </GlassPanel>
      </div>
    </Section>
  );
}
