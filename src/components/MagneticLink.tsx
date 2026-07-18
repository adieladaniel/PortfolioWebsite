import { useRef, type MouseEvent, type PropsWithChildren, type AnchorHTMLAttributes } from 'react';
import styles from './MagneticLink.module.css';

type MagneticLinkProps = PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>> & {
  strength?: number;
};

/** A link that pulls slightly toward the cursor while hovered, snapping back on leave. No-op under prefers-reduced-motion. */
export function MagneticLink({ children, strength = 0.35, className, ...rest }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)';
  };

  const combined = className ? `${styles.magnetic} ${className}` : styles.magnetic;

  return (
    <a ref={ref} className={combined} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} {...rest}>
      {children}
    </a>
  );
}
