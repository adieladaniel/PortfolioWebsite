export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScrollProgress;
  uniform float uAspect;

  // warm-ember color grammar, matching src/styles/tokens.css (sRGB hex / 255).
  // The renderer applies sRGB output encoding, so these are converted to
  // linear before use below — otherwise they render ~2x too bright.
  const vec3 COLOR_BG = vec3(0.0706, 0.0549, 0.0471);
  const vec3 COLOR_RUST = vec3(0.4196, 0.2902, 0.2078);
  const vec3 COLOR_AMBER = vec3(0.8784, 0.5412, 0.2431);
  const vec3 COLOR_HOT = vec3(1.0, 0.9451, 0.8706);

  vec3 srgbToLinear(vec3 srgb) {
    return pow(srgb, vec3(2.2));
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * valueNoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);

    float driftRaw = fbm(uv * 1.4 + uTime * 0.015);
    float drift = driftRaw * driftRaw; // bias dark, only occasional faint bright wisps

    vec2 mousePos = uMouse * vec2(uAspect, 1.0) * 0.5;
    float mouseDist = length(uv - mousePos);
    float mouseGlow = (1.0 - smoothstep(0.0, 0.55, mouseDist)) * 0.16;

    float vignette = 1.0 - smoothstep(0.25, 1.3, length(uv));

    vec3 ember = mix(COLOR_RUST, COLOR_AMBER, clamp(uScrollProgress * 1.4, 0.0, 1.0));
    ember = mix(ember, COLOR_HOT, clamp((uScrollProgress - 0.7) * 3.0, 0.0, 1.0));
    ember = srgbToLinear(ember);

    vec3 color = srgbToLinear(COLOR_BG);
    color += ember * drift * 0.06 * vignette;
    color += srgbToLinear(COLOR_AMBER) * mouseGlow;

    gl_FragColor = vec4(color, 1.0);
  }
`;
