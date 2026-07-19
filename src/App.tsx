import { CustomCursor } from '@/components/CustomCursor';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Nav } from '@/components/Nav';
import { HeroSection } from '@/sections/HeroSection';
import { ExperienceSection } from '@/sections/ExperienceSection';
import { ProjectSection } from '@/sections/ProjectSection';
import { EducationSection } from '@/sections/EducationSection';
import { ContactSection } from '@/sections/ContactSection';

function App() {
  return (
    <>
      <CustomCursor />
      <LoadingScreen />
      <Nav />
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
