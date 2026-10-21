import type { HeroLook } from '@/scenes/ParticleField';
import styles from './LookSwitcher.module.css';

const LOOKS: Array<{ id: HeroLook; label: string }> = [
  { id: 'network', label: 'Network' },
  { id: 'name', label: 'Monogram' },
];

interface LookSwitcherProps {
  look: HeroLook;
  onChange: (look: HeroLook) => void;
}

/** Temporary: lets you compare the two hero looks live. Delete once one is chosen. */
export function LookSwitcher({ look, onChange }: LookSwitcherProps) {
  return (
    <div className={styles.switcher} role="group" aria-label="Hero look">
      <span className={styles.label}>Hero look</span>
      {LOOKS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles.option}
          data-active={look === item.id}
          aria-pressed={look === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
