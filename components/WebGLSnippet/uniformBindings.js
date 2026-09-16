export const UNIFORM_BINDINGS = {
  trailDuration: "uTrailDuration",
  trailRevealStrength: "uTrailReveal",
  rippleStrength: "uRippleStrength",
  rippleSpeed: "uRippleSpeed",
  textureInkBlend: "uTextureInkBlend",
  textureInkContrast: "uTextureInkContrast",
  inkDirection: "uInkDirection",
  shadowStrength: "uShadowStrength",
  contourStrength: "uContourStrength",
  occlusionStrength: "uOcclusionStrength",
  occlusionRadius: "uOcclusionRadius",
  inkSizeRange: "uInkSizeRange",
  interactionRadius: "uRadius",
  fieldHoverRadius: "uFieldHoverRadius",
  fieldHoverSize: "uFieldHoverSize",
  fieldRepelStrength: "uFieldRepel",
  coreFraction: "uCoreFraction",
  depthTolerance: "uDepthTolerance",
  displacementStrength: "uDisplacement",
  pointerRevealStrength: "uPointerReveal",
  fieldParticleSize: "uFieldSize",
  surfaceParticleSize: "uSurfaceSize",
  depthAccentsEnabled: "uDepthAccentsEnabled",
  depthAccentStrength: "uDepthAccentStrength",
  tonalContrastEnabled: "uTonalContrastEnabled",
  tonalContrast: "uTonalContrast",
  interactionTrailsEnabled: "uInteractionTrailsEnabled",
  interactionTrailLength: "uInteractionTrailLength",
  antialiasingEnabled: "uAntialiasingEnabled",
};

export const REBUILD_KEYS = [
  "particleCountDesktop",
  "particleCountMobile",
  "frontSamplingWeight",
  "faceSamplingWeight",
];

export const RESIZE_KEYS = [
  "scale",
  "mobileScale",
  "xOffset",
  "yOffset",
  "depth",
  "cameraDistance",
  "mobileCameraDistance",
  "maxDpr",
  "mobileMaxDpr",
  "fieldCountDesktop",
  "fieldCountMobile",
];

/**
 * Applies updated configuration values to active shader uniforms and triggers
 * geometry rebuilds or layout resizing when dimension-altering keys change.
 */
export function applyConfigPatch(config, patchKeys, uniforms, onResize) {
  patchKeys.forEach((key) => {
    const uniformName = UNIFORM_BINDINGS[key];
    const uniform = uniforms[uniformName];
    if (!uniform) return;
    if (Array.isArray(config[key])) {
      uniform.value.fromArray(config[key]);
    } else if (typeof config[key] === "boolean") {
      uniform.value = config[key] ? 1 : 0;
    } else {
      uniform.value = config[key];
    }
  });

  const rebuild = patchKeys.some((key) => REBUILD_KEYS.includes(key));
  if (rebuild || patchKeys.some((key) => RESIZE_KEYS.includes(key))) {
    onResize?.(rebuild);
  }
}
