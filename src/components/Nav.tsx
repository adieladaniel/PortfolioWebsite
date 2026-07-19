import { useEffect, useRef, useState } from 'react';
import { profile } from '@/data/profile';
import styles from './Nav.module.css';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
];

/** Fixed top nav with scroll-spy active-section highlighting. Nothing like this existed in the old camera-driven layout — every section was reached by continuous scroll, not jump-navigation. */
export function Nav() {
  const [active, setActive] = useState('about');
  const [scrolled, setScrolled] = useState(false);
  const ratios = useRef<Record<string, number>>({});

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.current[entry.target.id] = entry.intersectionRatio;
        }
        const [topId] = Object.entries(ratios.current).sort((a, b) => b[1] - a[1])[0] ?? [];
        if (topId) setActive(topId);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((el) => observer.observe(el));

    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={styles.nav} data-scrolled={scrolled}>
      <a className={styles.wordmark} href="#about" data-cursor="top" data-magnetic>
        {profile.shortName}
      </a>
      <nav className={styles.links}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={styles.link}
            data-active={active === item.id}
            data-cursor="go"
            data-magnetic
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
