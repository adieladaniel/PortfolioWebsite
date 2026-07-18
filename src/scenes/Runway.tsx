import { deviceTier } from '@/utils/deviceTier';
import { RunwayPath } from './RunwayPath';
import { RunwayCubeSwarm } from './RunwayCubeSwarm';
import { RunwayCubeFill } from './RunwayCubeFill';
import { RunwayBuildingShell } from './RunwayBuildingShell';

/**
 * Replaces the abstract node/edge cloud (still available, just unplugged —
 * see NodesInstanced.tsx) with a literal skyline built Ra.One-style: a
 * ground line connecting each milestone, with a swarm of small cubes at
 * each one assembling into a tower as the camera approaches, solidifying
 * (RunwayCubeFill) as they lock into place, then wrapped in a single solid
 * facade (RunwayBuildingShell) once mostly assembled — the cubes handle the
 * "materializing" motion, the shell is what gives the finished result an
 * actual building face rather than a loose pile of cubes. The fill layer is
 * a visual nicety on top of the wireframe shell, not core content — skipped
 * on low-tier devices to cut 11 extra draw calls (one per milestone group).
 */
export function Runway() {
  return (
    <>
      <RunwayPath />
      <RunwayCubeSwarm />
      {deviceTier !== 'low' && <RunwayCubeFill />}
      <RunwayBuildingShell />
    </>
  );
}
