/**
 * transitionShader.js
 *
 * Shaders for the Cosmic Stipple Particle Swarm + Airy Ink Wash transition.
 * 
 * 1. Background Wash: Soft, translucent watercolor vignette (max opacity ~0.22).
 *    Never blacks out the screen.
 * 2. Particle Swarm: 4,000+ discrete pointillist stipple particles (gl.POINTS)
 *    erupting from click origin in an organic spiral curl turbulence, directly
 *    echoing the Electric Ganesha pointillist aesthetic.
 */

export function createTransitionProgram() {
  return null;
}

export const washVertexShader = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export const washFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform vec2 uOrigin;
  uniform float uProgress; // 0.0 -> 1.0
  uniform float uTime;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 delta = (vUv - uOrigin);
    delta.x *= aspect;
    float dist = length(delta);

    // Subtle paper grain
    float grain = hash(gl_FragCoord.xy + fract(uTime) * 31.7);

    // Expanding soft watercolor wash radius
    float radius = pow(uProgress, 0.7) * 1.6;

    // Soft feathered bloom
    float bloom = smoothstep(radius, 0.0, dist);

    // Fade envelope: rises quickly, fades out smoothly
    float envelope = sin(uProgress * 3.14159);

    // Air-light charcoal wash with subtle paper tone
    vec3 inkColor = vec3(0.08, 0.09, 0.12);

    // Max opacity is very light (~0.18) so page is ALWAYS luminous and legible
    float alpha = bloom * envelope * 0.18 + (grain - 0.5) * 0.02 * envelope;

    if (alpha <= 0.002) {
      discard;
    }

    gl_FragColor = vec4(inkColor, clamp(alpha, 0.0, 1.0));
  }
`;

export const particleVertexShader = `
  attribute vec2 aSeed;   // x: angle (0..2pi), y: speed factor
  attribute vec2 aParams; // x: size (px), y: ink type (0 = charcoal, 1 = gold stardust)

  uniform vec2 uResolution;
  uniform vec2 uOrigin;
  uniform float uProgress; // 0.0 -> 1.0
  uniform float uTime;

  varying vec4 vColor;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    // Spiral angle rotates dynamically as particles travel
    float swirl = (aSeed.y - 0.5) * 3.14159 * 1.5;
    float angle = aSeed.x + uProgress * swirl;

    // Explosive ease-out expansion curve
    float speed = aSeed.y * 1.25 + 0.35;
    float dist = pow(uProgress, 0.55) * speed;

    // Direction vector with aspect correction
    vec2 dir = vec2(cos(angle) / aspect, sin(angle));
    vec2 pos = uOrigin + dir * dist;

    // Gentle fluid curl turbulence
    float turbulence = sin(pos.y * 8.0 + uTime * 2.5 + aSeed.x) * 0.04 * uProgress;
    pos.x += turbulence;
    pos.y += cos(pos.x * 8.0 + uTime * 2.0) * 0.03 * uProgress;

    // Convert normalized UV (0..1) to WebGL Clipspace (-1..1)
    vec2 clipPos = pos * 2.0 - 1.0;
    gl_Position = vec4(clipPos.x, clipPos.y, 0.0, 1.0);

    // Stipple particle size with slight perspective breathing
    float life = 1.0 - uProgress;
    gl_PointSize = aParams.x * (0.8 + life * 0.6);

    // Palette: Deep charcoal sumi ink (80%) vs warm gold stardust (20%)
    vec3 charcoal = vec3(0.08, 0.09, 0.13);
    vec3 gold = vec3(0.82, 0.76, 0.62);
    vec3 col = mix(charcoal, gold, aParams.y);

    // Alpha lifecycle: snappy fade-in, long graceful dissolve
    float fadeIn = smoothstep(0.0, 0.08, uProgress);
    float fadeOut = smoothstep(1.0, 0.65, uProgress);
    float alpha = fadeIn * fadeOut * 0.9;

    vColor = vec4(col, alpha);
  }
`;

export const particleFragmentShader = `
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

    // Antialiased soft dot rim
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

export function createWashProgram(gl) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, washVertexShader);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, washFragmentShader);
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Wash program link error: " + info);
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return prog;
}

export function createParticleProgram(gl) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, particleVertexShader);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, particleFragmentShader);
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Particle program link error: " + info);
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return prog;
}
