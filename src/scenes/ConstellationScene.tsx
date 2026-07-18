import { projects } from '@/data/projects';
import { CameraRig } from './CameraRig';
import { BackgroundShader } from './BackgroundShader';
import { Runway } from './Runway';
import { JourneyAssembly } from './JourneyAssembly';
import { ProjectObject } from './ProjectObject';
import { CodingStatsCluster } from './CodingStatsCluster';

// NodesInstanced + main-graph EdgesLines (the abstract floating node cloud)
// are unplugged in favor of Runway, per Adiel's request — kept in the
// codebase, not deleted, since going back to (or combining with) them is
// still an open option pending how the runway reads in practice.

export function ConstellationScene() {
  return (
    <>
      <CameraRig />
      <BackgroundShader />
      <Runway />
      <JourneyAssembly />
      {projects.map((project) => (
        <ProjectObject key={project.id} project={project} />
      ))}
      <CodingStatsCluster />
    </>
  );
}
