/**
 * Shared GLSL for the particle field. Points and the network's edge lines
 * both call `fieldPos()` with the same per-particle attributes, so an edge
 * endpoint lands exactly where its particle is, drift and cursor push
 * included.
 *
 * Each particle has two homes: `aFormed` (the shape it assembles into near
 * the hero stage) and `aCloud` (its spot in the page-wide background cloud).
 * `uMorph` blends formed -> cloud with a per-particle stagger as the page
 * scrolls; `uAssemble` plays the intro, flying particles in from the cloud.
 */
const FIELD_COMMON = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uAssemble;
uniform float uSpin;
uniform float uFormedScale;
uniform float uDim;
uniform vec3 uStage;
uniform vec2 uCloudHalf;
uniform vec2 uMouse;

attribute vec3 aFormed;
attribute vec3 aCloud;
attribute float aSeed;

vec3 fieldPos() {
  float a = uTime * 0.12 * uSpin;
  vec3 f = aFormed * uFormedScale;
  f.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * f.xz;
  f += uStage;
  f += vec3(
    sin(uTime * 0.5 + aSeed * 20.0),
    cos(uTime * 0.45 + aSeed * 31.0),
    sin(uTime * 0.4 + aSeed * 13.0)
  ) * 0.035;

  vec3 c = vec3(aCloud.xy * uCloudHalf, aCloud.z);
  c.xy += vec2(sin(uTime * 0.13 + aSeed * 40.0), cos(uTime * 0.11 + aSeed * 27.0)) * 0.3;

  float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.25 - aSeed * 0.25, 0.0, 1.0));
  vec3 p = mix(f, c, m);

  float e = clamp(uAssemble * 1.5 - aSeed * 0.5, 0.0, 1.0);
  e = 1.0 - pow(1.0 - e, 3.0);
  vec3 start = vec3(aCloud.xy * uCloudHalf * 1.6, aCloud.z - 4.0);
  p = mix(start, p, e);

  vec2 d = p.xy - uMouse;
  float dist = length(d);
  p.xy += (d / (dist + 0.0001)) * exp(-dist * dist * 0.9) * 0.7;
  return p;
}
`;

export const pointsVertex = /* glsl */ `
${FIELD_COMMON}
uniform float uPx;
attribute float aSize;
attribute float aWarm;
varying float vAlpha;
varying float vWarm;

void main() {
  vec3 p = fieldPos();
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx * (18.0 / -mv.z);
  vAlpha = mix(1.0, 0.38, uMorph) * uDim;
  vWarm = aWarm;
}
`;

export const pointsFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uWarmColor;
varying float vAlpha;
varying float vWarm;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(mix(uColor, uWarmColor, vWarm), a * vAlpha);
}
`;

export const linesVertex = /* glsl */ `
${FIELD_COMMON}
attribute float aT;
attribute float aEdge;
varying float vA;

void main() {
  vec3 p = fieldPos();
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float pulse = exp(-pow((aT - fract(uTime * 0.22 + aEdge)) * 5.0, 2.0));
  vA = (0.1 + 0.55 * pulse) * (1.0 - smoothstep(0.0, 0.5, uMorph)) * uDim;
}
`;

export const linesFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  gl_FragColor = vec4(uColor, vA);
}
`;
