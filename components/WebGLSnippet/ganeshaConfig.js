// World units are normalized: the source sculpture is 2 units tall.
export const GANESHA_CONFIG = {
  modelUrl: "/models/electricganesha.glb",
  particleCountDesktop: 60000,
  particleCountMobile: 20000,
  // Depth of field toggle and parameters.
  dofEnabled: false,
  dofFocusOffset: 5.0,
  dofAperture: 0.0001,
  dofMaxBlur: 0.003,
  // Visual effects toggles and strengths.
  depthAccentsEnabled: true,
  depthAccentStrength: 2.0,
  tonalContrastEnabled: true,
  tonalContrast: 1.0,
  interactionTrailsEnabled: false,
  interactionTrailLength: 0.75,
  antialiasingEnabled: true,
  maxDpr: 2,
  mobileMaxDpr: 1.5,
  scale: 0.95,
  mobileScale: 0.9,
  xOffset: 0,
  yOffset: 0.2,
  depth: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  cameraDistance: 4.8,
  mobileCameraDistance: 6.6,
  idleReveal: 0,
  hoverReveal: 0.52,
  pressedReveal: 0.96,
  reducedMotionReveal: 0.72,
  pointerRevealStrength: 0.48,
  interactionRadius: 0.58,
  displacementStrength: 0.022,
  pointerRotationStrength: 0.105, // Six degrees, in radians.
  idleRotationStrength: 0.018,
  fieldParticleSize: 8,
  fieldHoverRadius: 0.32,
  fieldRepelStrength: 1.6,
  fieldHoverSize: 0.35,
  surfaceParticleSize: 2.1,
  textureInkBlend: 0.65, // 0 = geometry only; 1 = texture brightness only.
  textureInkContrast: 1.2,
  inkDirection: [-0.6, 0.8, 1.0], // Camera-space direction of the white/paper side.
  shadowStrength: 0.95,
  contourStrength: 0.35,
  occlusionStrength: 1.4,
  occlusionRadius: 0.035, // World-space neighborhood for folds and overlaps.
  inkSizeRange: [0.4, 1.75], // Highlight/shadow disc sizes, relative to surfaceParticleSize.
  frontSamplingWeight: 4,
  faceSamplingWeight: 3.5,
  fieldCountDesktop: 320,
  fieldCountMobile: 140,
  coreFraction: 0.9, // Surface landmarks persist while the surrounding field dissolves.
  idleDelay: 1.2, // Brief pause before a stationary pointer stops revealing.
  idleFadeDuration: 2.0, // Fade pointer activity after the pause.
  hoverDwell: 2.8, // Seconds for a lingering hover to gather the form.
  holdDuration: 4.0, // Seconds to reach the full deliberate reveal.
  revealDuration: 2.8, // Easing time constant for gathering the form.
  releaseDuration: 2.8, // Exactly symmetrical: takes the same time to spread out as to reconstruct.
  trailDuration: 2.5,
  trailRevealStrength: 0.4,
  rippleStrength: 0.035,
  rippleSpeed: 0.65,
  pointerSmoothing: 12, // Frame-rate-independent cursor following (1/seconds).
  depthSmoothing: 5, // Slower depth following bridges ears, trunk and silhouette gaps.
  depthTolerance: 0.006, // World-space tolerance for the invisible visibility pass.
  raycastInterval: 0.066, // At most 15 surface queries/second; never raycast points.
};
