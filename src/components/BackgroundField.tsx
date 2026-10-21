import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ParticleField } from '@/scenes/ParticleField';
import { NoWebGLFallback } from '@/components/NoWebGLFallback';
import { hasWebGL2 } from '@/utils/webgl';
import { deviceTier } from '@/utils/deviceTier';
import styles from './BackgroundField.module.css';

const DPR: [number, number] = deviceTier === 'low' ? [1, 1.25] : deviceTier === 'mid' ? [1, 1.5] : [1, 2];

/**
 * Fixed full-viewport WebGL layer behind the whole page. Sections sit on top
 * as transparent panels, so the particle field is both the background and
 * the stage the scroll animation plays on. Pauses rendering while the tab is
 * hidden; falls back to a static backdrop without WebGL2.
 */
export function BackgroundField() {
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (!hasWebGL2) return <NoWebGLFallback />;

  return (
    <div className={styles.layer} aria-hidden="true">
      <Canvas
        camera={{ fov: 50, position: [0, 0, 10] }}
        dpr={DPR}
        frameloop={tabVisible ? 'always' : 'never'}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}
