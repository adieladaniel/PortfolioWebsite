export const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // perspective-scaled point size: bigger when close, smaller far away.
    // Hard-clamped — the camera can pass within ~1.6 world units of a node
    // (see MIN_NODE_DISTANCE in timeline.ts), and without a ceiling the
    // 1/-z perspective term blows a close point up to thousands of pixels.
    float pointSize = aSize * (40.0 / -mvPosition.z);
    gl_PointSize = min(pointSize, 42.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float dist = length(centered) * 2.0;
    // soft radial falloff: bright core fading smoothly to nothing at the edge
    float alpha = smoothstep(1.0, 0.0, dist);
    alpha = pow(alpha, 1.8);
    gl_FragColor = vec4(vColor, alpha);
  }
`;
