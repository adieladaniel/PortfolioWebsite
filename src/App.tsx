import { useState } from 'react';
import { BackgroundField } from '@/components/BackgroundField';
import { CustomCursor } from '@/components/CustomCursor';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LookSwitcher } from '@/components/LookSwitcher';
import { Nav } from '@/components/Nav';
import { SmoothScroll } from '@/components/SmoothScroll';
import type { HeroLook } from '@/scenes/ParticleField';
import { HeroSection } from '@/sections/HeroSection';
import { ExperienceSection } from '@/sections/ExperienceSection';
import { ProjectSection } from '@/sections/ProjectSection';
import { EducationSection } from '@/sections/EducationSection';
import { ContactSection } from '@/sections/ContactSection';

function App() {
  const [look, setLook] = useState<HeroLook>('network');

  return (
    <>
      <SmoothScroll />
      <BackgroundField look={look} />
      <CustomCursor />
      <LoadingScreen />
      <Nav />
      <LookSwitcher look={look} onChange={setLook} />
      <main>
        <HeroSection />
        <ExperienceSection />
        <ProjectSection />
        <EducationSection />
        <ContactSection />
      </main>
    </>
  );
}

export default App;
