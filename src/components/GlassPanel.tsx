import type { PropsWithChildren, HTMLAttributes } from 'react';
import styles from './GlassPanel.module.css';

type GlassPanelProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function GlassPanel({ children, className, ...rest }: GlassPanelProps) {
  const combined = className ? `${styles.panel} ${className}` : styles.panel;
  return (
    <div className={combined} {...rest}>
      {children}
    </div>
  );
}
