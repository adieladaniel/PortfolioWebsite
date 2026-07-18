export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // uColor is set via THREE.Color in JS, which already does sRGB->linear
  // conversion — do NOT feed it through pow(x, 2.2) here too (that mistake
  // already cost a debugging pass once on the background shader).
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uSeed;
  // real floor count for this building's actual height (see computeFloors
  // in RunwayBuildingShell.tsx) — was a hardcoded 6.0 regardless of height,
  // so a stubby early-milestone building and a tall "now" tower both got
  // the same window grid, squashed or stretched to fit.
  uniform float uFloors;

  // cameraPosition is auto-injected by three.js for ShaderMaterial (not
  // RawShaderMaterial) — no need to declare it ourselves.

  // sin()-based hashes lose precision once the argument gets large under
  // mediump (uSeed can run into the hundreds), which silently collapsed
  // every cellSeed to near-identical values and left every window "unlit" —
  // this fract-based hash stays bounded regardless of uSeed's magnitude.
  float hash(vec2 p) {
    vec2 p3 = fract(p * vec2(0.1031, 0.1030));
    p3 += dot(p3, p3.yx + 33.33);
    return fract((p3.x + p3.y) * p3.x);
  }

  void main() {
    vec3 facadeDark = vec3(0.02, 0.015, 0.012);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    // glass curtain-wall edge glow: grazing-angle view rays pick up the
    // milestone's accent color, so facades read as reflective glass rather
    // than flat matte panels — strongest right at the silhouette edge.
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0), 3.0);
    vec3 rimGlow = uColor * fresnel * 0.4;

    // roof/floor caps: plain dark panel, no window grid
    if (abs(vNormal.y) > 0.85) {
      gl_FragColor = vec4(facadeDark + rimGlow, uOpacity);
      return;
    }

    const float windowsPerFloor = 4.0;
    vec2 grid = vec2(vUv.x * windowsPerFloor, vUv.y * uFloors);
    vec2 cell = floor(grid);
    vec2 cellUv = fract(grid);

    // dark mullions between window panes
    float frame = step(0.1, cellUv.x) * step(0.1, cellUv.y) * step(cellUv.x, 0.9) * step(cellUv.y, 0.9);

    float cellSeed = hash(cell + uSeed);
    // which windows are lit is static per-window (seeded); flicker only
    // modulates brightness *within* an already-lit window. Unlit windows
    // stay a fixed dark tone independent of uColor — earlier attempt tied
    // both lit and unlit windows to uColor's brightness, which washed out
    // to a flat pale box for bright (near-white) milestones since there
    // was nothing dark left to contrast against.
    float isLit = step(0.5, cellSeed);
    float flicker = 0.75 + 0.25 * sin(uTime * 0.5 + cellSeed * 60.0);

    vec3 unlitWindow = facadeDark * 2.2;
    vec3 litWindow = uColor * (0.6 + flicker * 0.9);
    vec3 windowColor = mix(unlitWindow, litWindow, isLit);
    vec3 finalColor = mix(facadeDark, windowColor, frame) + rimGlow;

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;
