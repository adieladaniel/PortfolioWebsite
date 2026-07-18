import { Canvas } from '@react-three/fiber';
import { ConstellationScene } from '@/scenes/ConstellationScene';
import { LoadingScreen } from '@/components/LoadingScreen';
import { NoWebGLFallback } from '@/components/NoWebGLFallback';
import { CustomCursor } from '@/components/CustomCursor';
import { hasWebGL2 } from '@/utils/webgl';
import { deviceTier } from '@/utils/deviceTier';
import { HeroSection } from '@/sections/HeroSection';
import { EducationSection } from '@/sections/EducationSection';
import { InternshipSection } from '@/sections/InternshipSection';
import { ProjectSection } from '@/sections/ProjectSection';
import { SkillsSection } from '@/sections/SkillsSection';
import { CodingStatsSection } from '@/sections/CodingStatsSection';
import { CertificationsSection } from '@/sections/CertificationsSection';
import { ContactSection } from '@/sections/ContactSection';
import styles from './App.module.css';

const DPR: [number, number] = deviceTier === 'low' ? [1, 1.25] : deviceTier === 'mid' ? [1, 1.5] : [1, 2];

function App() {
  return (
    <>
      <CustomCursor />
      <LoadingScreen />
      <div className={styles.canvasLayer}>
        {hasWebGL2 ? (
          <Canvas camera={{ fov: 60, near: 0.1, far: 200 }} dpr={DPR}>
            <ConstellationScene />
          </Canvas>
        ) : (
          <NoWebGLFallback />
        )}
      </div>
      <main className={styles.content}>
        <HeroSection />
        <EducationSection />
        <InternshipSection />
        <ProjectSection />
        <SkillsSection />
        <CodingStatsSection />
        <CertificationsSection />
        <ContactSection />
      </main>
    </>
  );
}

export default App;
