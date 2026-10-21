/**
 * Shared GLSL for the particle field. Points and the network's edge lines
 * both call `fieldPos()` with the same per-particle attributes, so an edge
 * endpoint lands exactly where its particle is, drift and cursor push
 * included.
 *
 * Two kinds of particle, told apart by `aGroup`:
 *  - group 0 is "the model": a persistent ball that travels between page
 *    scenes. It has three shapes (`aShape0..2`, blended by `uShapeW`), is
 *    placed at `uBall` and sized by `uBallScale`.
 *  - group 1 is the background cloud: fixed to the viewport with a slow
 *    scroll parallax, never part of the ball.
 * `uAssemble` plays the intro, flying every particle in from far away.
 */
const FIELD_COMMON = /* glsl */ `
uniform float uTime;
uniform float uAssemble;
uniform float uSpin;
uniform float uBallScale;
uniform float uBallAlpha;
uniform float uCloudScroll;
uniform vec3 uBall;
uniform vec3 uShapeW;
uniform vec2 uCloudHalf;
uniform vec2 uMouse;

attribute vec3 aShape0;
attribute vec3 aShape1;
attribute vec3 aShape2;
attribute vec3 aCloud;
attribute float aSeed;
attribute float aGroup;

vec3 fieldPos() {
  vec3 f = aShape0 * uShapeW.x + aShape1 * uShapeW.y + aShape2 * uShapeW.z;
  float a = uTime * 0.12 * uSpin;
  f.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * f.xz;
  f = f * uBallScale + uBall;
  f += vec3(
    sin(uTime * 0.5 + aSeed * 20.0),
    cos(uTime * 0.45 + aSeed * 31.0),
    sin(uTime * 0.4 + aSeed * 13.0)
  ) * 0.03 * clamp(uBallScale, 0.3, 1.2);

  vec3 c = vec3(aCloud.xy * uCloudHalf, aCloud.z);
  c.xy += vec2(sin(uTime * 0.13 + aSeed * 40.0), cos(uTime * 0.11 + aSeed * 27.0)) * 0.3;
  float depth = 0.5 + (aCloud.z + 2.5) / 5.0;
  c.y = mod(c.y + uCloudScroll * depth + uCloudHalf.y, 2.0 * uCloudHalf.y) - uCloudHalf.y;

  vec3 p = mix(f, c, aGroup);

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
  vAlpha = mix(uBallAlpha, 0.38, aGroup);
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
  vA = (0.1 + 0.55 * pulse) * uBallAlpha;
}
`;

export const linesFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  gl_FragColor = vec4(uColor, vA);
}
`;
