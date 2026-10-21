import { MagneticLink } from '@/components/MagneticLink';
import { contact } from '@/data/contact';
import { profile } from '@/data/profile';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './ContactSection.module.css';

export function ContactSection() {
  const reveal = useScrollReveal<HTMLDivElement>(0.2);

  return (
    <section id="contact" className={styles.contact}>
      <div ref={reveal.ref} className={styles.inner} data-revealed={reveal.revealed}>
        <div id="ball-contact" className={styles.ballMarker} aria-hidden="true" />
        <h2 className={styles.heading}>Contact</h2>

        <div className={styles.grid}>
          <div className={styles.column}>
            <p className={styles.label}>Email</p>
            <MagneticLink className={styles.value} data-cursor="email" href={`mailto:${contact.email}`}>
              {contact.email}
            </MagneticLink>
          </div>

          <div className={styles.column}>
            <p className={styles.label}>Social</p>
            <MagneticLink
              className={styles.value}
              data-cursor="open"
              href={contact.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              Github ↗
            </MagneticLink>
            <MagneticLink
              className={styles.value}
              data-cursor="open"
              href={contact.linkedinUrl}
              target="_blank"
              rel="noreferrer"
            >
              Linkedin ↗
            </MagneticLink>
          </div>

          <p className={styles.tagline}>
            Let&apos;s build
            <br />
            something <span className={styles.accent}>together</span>
          </p>
        </div>

        <p className={styles.footer}>
          © {new Date().getFullYear()} {profile.name}
        </p>
      </div>
    </section>
  );
}
