/**
 * reconstructShader.js
 *
 * Shaders for Content Disintegration & Particle Reconstruction.
 * Particles lift off from aOrigin (old page content), swarm through
 * 3D space with curl turbulence, and reassemble onto aTarget (new page content).
 */

export const reconstructVertexShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  attribute vec2 aOrigin;  // Source position on old page (0..1)
  attribute vec2 aTarget;  // Destination position on new page (0..1)
  attribute vec2 aSeed;    // x: random angle (0..2pi), y: turbulence seed (0..1)
  attribute vec2 aParams;  // x: size (px), y: color type (0 = charcoal, 1 = gold)

  uniform vec2 uResolution;
  uniform float uProgress; // 0.0 -> 1.0
  uniform float uTime;

  varying vec4 vColor;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    // Smooth ease-in-out flight interpolation curve
    float t = smoothstep(0.12, 0.88, uProgress);
    vec2 basePos = mix(aOrigin, aTarget, t);

    // Mid-flight arch and expansion envelope (peaks at uProgress = 0.5)
    float midFlight = sin(uProgress * 3.14159265);

    // Dynamic spiral swirl around flight path
    float swirlAngle = aSeed.x + uProgress * (aSeed.y - 0.5) * 6.28318;
    float swirlRadius = (aSeed.y * 0.22 + 0.05) * midFlight;
    vec2 swirlOffset = vec2(cos(swirlAngle) / aspect, sin(swirlAngle)) * swirlRadius;

    // Organic curl noise turbulence
    vec2 pos = basePos + swirlOffset;
    float turbX = sin(pos.y * 7.0 + uTime * 2.2 + aSeed.x) * 0.035 * midFlight;
    float turbY = cos(pos.x * 7.0 + uTime * 2.0 + aSeed.y) * 0.025 * midFlight;
    pos += vec2(turbX, turbY);

    // Convert UV (0..1) to WebGL Clip Space (-1..1)
    vec2 clipPos = pos * 2.0 - 1.0;
    gl_Position = vec4(clipPos.x, clipPos.y, 0.0, 1.0);

    // Particle size with gentle mid-flight expansion
    float sizeScale = 0.85 + midFlight * 0.45;
    gl_PointSize = aParams.x * sizeScale;

    // Ink palette: 80% Sumi charcoal pointillism, 20% warm gold stardust
    vec3 charcoal = vec3(0.08, 0.09, 0.12);
    vec3 gold = vec3(0.82, 0.76, 0.60);
    vec3 col = mix(charcoal, gold, aParams.y);

    // Alpha envelope: dissolves in from old text, stays sharp, dissolves into new text
    float fadeIn = smoothstep(0.0, 0.07, uProgress);
    float fadeOut = smoothstep(1.0, 0.88, uProgress);
    float alpha = fadeIn * fadeOut * 0.95;

    vColor = vec4(col, alpha);
  }
`;

export const reconstructFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  varying vec4 vColor;

  void main() {
    // Crisp circular pointillist stipple dot
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord);

    if (r > 0.5) {
      discard;
    }

    // Antialiased dot rim
    float dotMask = smoothstep(0.5, 0.32, r);
    float alpha = vColor.a * dotMask;

    if (alpha <= 0.005) {
      discard;
    }

    gl_FragColor = vec4(vColor.rgb, alpha);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + info);
  }
  return shader;
}

export function createReconstructProgram(gl) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, reconstructVertexShader);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, reconstructFragmentShader);
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Reconstruct program link error: " + info);
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return prog;
}
