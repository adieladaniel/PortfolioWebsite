export type DeviceTier = 'low' | 'mid' | 'high';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Computed once, synchronously, at module load — before the 3D scene mounts
 * or any per-milestone geometry is built — so data-layer code (runwayCubes,
 * JourneyAssembly) can scale counts down at construction time rather than
 * building the full-detail version and discarding it.
 */
function computeDeviceTier(): DeviceTier {
  if (typeof navigator === 'undefined') return 'high';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const isCoarsePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  if (cores <= 4 && (memory <= 4 || isCoarsePointer)) return 'low';
  if (cores <= 6 || memory <= 6) return 'mid';
  return 'high';
}

export const deviceTier: DeviceTier = computeDeviceTier();
