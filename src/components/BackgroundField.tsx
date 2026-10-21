import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ParticleField, type HeroLook } from '@/scenes/ParticleField';
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
export function BackgroundField({ look }: { look: HeroLook }) {
  const [fontsReady, setFontsReady] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fontLoad = document.fonts ? document.fonts.load('700 200px "Space Grotesk"') : Promise.resolve([]);
    fontLoad.finally(() => {
      if (!cancelled) setFontsReady(true);
    });

    const handleVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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
        <ParticleField look={look} fontsReady={fontsReady} />
      </Canvas>
    </div>
  );
}
