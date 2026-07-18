function probeWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

/** Computed once at module load, before the Canvas would otherwise mount. */
export const hasWebGL2: boolean = probeWebGL2();
