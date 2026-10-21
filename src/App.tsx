import { BackgroundField } from '@/components/BackgroundField';
import { CustomCursor } from '@/components/CustomCursor';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Nav } from '@/components/Nav';
import { ScrollRail } from '@/components/ScrollRail';
import { SmoothScroll } from '@/components/SmoothScroll';
import { HeroSection } from '@/sections/HeroSection';
import { ExperienceSection } from '@/sections/ExperienceSection';
import { ProjectSection } from '@/sections/ProjectSection';
import { EducationSection } from '@/sections/EducationSection';
import { ContactSection } from '@/sections/ContactSection';

function App() {
  return (
    <>
      <SmoothScroll />
      <BackgroundField />
      <CustomCursor />
      <LoadingScreen />
      <Nav />
      <ScrollRail />
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
