import * as THREE from "three/webgpu";
import { MeshBasicNodeMaterial } from "three/webgpu";
import {
  uniform,
  uniformArray,
  viewport,
  uv,
  attribute,
  instanceIndex,
  ceil,
  floor,
  length,
  fwidth,
  min,
  max,
  smoothstep,
  step,
  float,
  vec2,
  vec3,
  vec4,
  mat3,
  texture,
  modelViewMatrix,
  modelWorldMatrix,
  cameraViewMatrix,
  cameraProjectionMatrix,
  dot,
  abs,
  pow,
  exp,
  sin,
  cos,
  normalize,
  mix,
  clamp,
  fract,
  varying,
  positionLocal,
} from "three/tsl";
import { readLinearDepth, linearDepthToViewZ } from "./utils/tslDepth";
import {
  computeMusicInfluence,
  computePointerAndTrailInfluence,
  computeCoherenceAndTopology,
  computeDisplacement,
  computeFieldPosition,
} from "./utils/tslInfluence";

export function createGaneshaMaterial(config, depthTexture) {
  const uniforms = {
    time: uniform(0),
    uReveal: uniform(config.idleReveal),
    uLoad: uniform(0),
    uMotion: uniform(1),
    uDpr: uniform(1),
    uActivity: uniform(0),
    uAudioEnabled: uniform(0),
    uAudioBands: uniform(new THREE.Vector3()),
    uNotePulse: uniformArray(
      Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, -100))
    ),
    uNoteStrength: uniformArray(Array(8).fill(0), "float"),
    uMusicPath: uniformArray(
      Array.from({ length: 24 }, () => new THREE.Vector4())
    ),
    uMusicPathCount: uniform(0),
    uHold: uniform(0),
    uTrail: uniformArray(
      Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, -100))
    ),
    uTrailDuration: uniform(config.trailDuration),
    uTrailReveal: uniform(config.trailRevealStrength),
    uRippleStrength: uniform(config.rippleStrength),
    uRippleSpeed: uniform(config.rippleSpeed),
    uPulseOrigin: uniform(new THREE.Vector3()),
    uPulseStart: uniform(-100),
    uMousePos: uniform(new THREE.Vector3()),
    uRadius: uniform(config.interactionRadius),
    uFieldRayOrigin: uniform(new THREE.Vector3()),
    uFieldRayDirection: uniform(new THREE.Vector3(0, 0, -1)),
    uFieldHover: uniform(0),
    uFieldRepel: uniform(config.fieldRepelStrength),
    uFieldHoverRadius: uniform(config.fieldHoverRadius),
    uFieldHoverSize: uniform(config.fieldHoverSize),
    uFieldNote: uniform(new THREE.Vector4(0, 0, 0, -100)),
    uFieldFraction: uniform(0),
    uTextureInkBlend: uniform(config.textureInkBlend),
    uTextureInkContrast: uniform(config.textureInkContrast),
    uInkDirection: uniform(new THREE.Vector3(...config.inkDirection)),
    uShadowStrength: uniform(config.shadowStrength),
    uContourStrength: uniform(config.contourStrength),
    uOcclusionStrength: uniform(config.occlusionStrength),
    uOcclusionRadius: uniform(config.occlusionRadius),
    uInkSizeRange: uniform(new THREE.Vector2(...config.inkSizeRange)),
    uCoreFraction: uniform(config.coreFraction),
    uCameraRange: uniform(new THREE.Vector2(0.1, 40)),
    uDepthTolerance: uniform(config.depthTolerance),
    uDisplacement: uniform(config.displacementStrength),
    uPointerReveal: uniform(config.pointerRevealStrength),
    uFieldSize: uniform(config.fieldParticleSize),
    uSurfaceSize: uniform(config.surfaceParticleSize),
    uFieldExtent: uniform(new THREE.Vector2()),
    uTotalCoverage: uniform(0),
    uDepthAccentsEnabled: uniform(config.depthAccentsEnabled ? 1 : 0),
    uDepthAccentStrength: uniform(config.depthAccentStrength ?? 0.65),
    uTonalContrastEnabled: uniform(config.tonalContrastEnabled ? 1 : 0),
    uTonalContrast: uniform(config.tonalContrast ?? 0.45),
    uInteractionTrailsEnabled: uniform(config.interactionTrailsEnabled ? 1 : 0),
    uInteractionTrailLength: uniform(config.interactionTrailLength ?? 0.75),
    uAntialiasingEnabled: uniform(config.antialiasingEnabled ? 1 : 0),
  };

  const pos = attribute("aSurface", "vec3");
  const norm = attribute("aNormal", "vec3");
  const aField = attribute("aField", "vec3");
  const aSeed = attribute("aSeed", "float");
  const aTextureInk = attribute("aTextureInk", "float");
  const fieldState = attribute("aFieldState", "vec4");

  const depthTexNode = texture(depthTexture);
  const fieldCircle = float(1.0).sub(step(uniforms.uFieldFraction, aSeed));

  // 1. Background field position & ray interaction
  const field = computeFieldPosition(aField, uniforms);
  const fieldBase = field;
  const rayDelta = fieldBase.sub(uniforms.uFieldRayOrigin);
  const rayOffset = rayDelta.sub(
    uniforms.uFieldRayDirection.mul(dot(rayDelta, uniforms.uFieldRayDirection))
  );
  const rayDistSq = dot(rayOffset, rayOffset);
  const fieldHover = exp(
    rayDistSq
      .div(uniforms.uFieldHoverRadius.mul(uniforms.uFieldHoverRadius))
      .mul(-2.5)
  )
    .mul(uniforms.uFieldHover)
    .mul(fieldCircle);

  const fieldNoteDelta = fieldBase.sub(uniforms.uFieldNote.xyz);
  const fieldPulse = exp(
    dot(fieldNoteDelta, fieldNoteDelta)
      .mul(-80)
      .sub(max(0, uniforms.time.sub(uniforms.uFieldNote.w)).mul(5))
  )
    .mul(uniforms.uAudioEnabled)
    .mul(fieldCircle);

  // Moving cursor in the field near a particle directly awakens and attracts it to Ganesha
  const fieldInfluence = fieldHover.mul(uniforms.uActivity);

  // 2. Music & gesture influences
  const music = computeMusicInfluence(pos, uniforms);
  const { influence, trace } = computePointerAndTrailInfluence(
    pos,
    uniforms,
    fieldInfluence
  );

  // 3. Reveal, topology & core coherence
  const reveal = clamp(
    uniforms.uReveal
      .add(influence.mul(uniforms.uPointerReveal))
      .add(trace.mul(uniforms.uTrailReveal))
      .add(music.x.mul(0.65)),
    0.0,
    1.0
  );
  const { core, topology } = computeCoherenceAndTopology(
    aSeed,
    uniforms,
    reveal,
    fieldCircle
  );

  // Field particles are awakened and driven directly by their individual hover activation
  const activeTopology = mix(topology, fieldState.w, fieldCircle);

  // 4. Surface displacement
  const surface = computeDisplacement(pos, norm, uniforms, influence, music);

  // 5. Transit dynamics: particles in the field flow organically to form Ganesha
  const worldSurface = modelWorldMatrix.mul(vec4(surface, 1.0)).xyz;
  const transit = activeTopology.mul(float(1.0).sub(activeTopology)).mul(4.0);
  const flightSwirl = vec3(
    sin(field.y.mul(4.5).add(uniforms.time.mul(1.6))),
    cos(field.x.mul(4.5).add(uniforms.time.mul(1.6))),
    sin(field.z.mul(5.5).add(uniforms.time.mul(1.2)))
  )
    .mul(transit)
    .mul(0.12)
    .mul(uniforms.uMotion);

  // Gentle magnetic attraction to the cursor while in the field
  const fieldAttract = rayOffset
    .negate()
    .mul(fieldHover)
    .mul(0.3)
    // Once carried, use only the delayed trail target rather than also
    // tugging toward the live cursor on every pass over the pickup location.
    .mul(float(1).sub(smoothstep(0.015, 0.08, length(fieldState.xyz))))
    .mul(uniforms.uMotion)
    .mul(float(1.0).sub(activeTopology));

  const restingPos = mix(
    field.add(fieldAttract),
    worldSurface,
    activeTopology
  ).add(flightSwirl);

  // Stateful carry offsets belong only to the surrounding field particles.
  const pointerFollow = fieldState.xyz
    .mul(fieldCircle)
    .mul(float(1).sub(activeTopology))
    .mul(uniforms.uMotion);
  const finalPos = restingPos.add(pointerFollow);

  // 5. Stipple, tone & cavity ambient occlusion
  const baseView = modelViewMatrix.mul(vec4(pos, 1.0));
  const viewPosition = cameraViewMatrix.mul(vec4(finalPos, 1.0));
  const clipPosition = cameraProjectionMatrix.mul(viewPosition);
  const clipBase = cameraProjectionMatrix.mul(baseView);

  const normalMat = mat3(modelViewMatrix);
  const n = normalize(normalMat.mul(norm));

  const shade = float(1.0).sub(
    max(float(0.0), dot(n, normalize(uniforms.uInkDirection)))
  );
  const contour = pow(
    float(1.0).sub(abs(dot(n, normalize(baseView.xyz.negate())))),
    float(2.0)
  );

  // Projected clip UVs are bottom-up; TSL texture UVs are top-down.
  const uvCavity = clipBase.xy.div(clipBase.w).mul(0.5).add(0.5);
  const projFocal = vec2(
    cameraProjectionMatrix.element(0).x,
    cameraProjectionMatrix.element(1).y
  );
  const radiusCavity = uniforms.uOcclusionRadius
    .mul(projFocal)
    .div(baseView.z.negate().mul(2.0));

  let cavity = float(0.0);
  for (let i = 0; i < 16; i++) {
    const angle = i * 2.39996323;
    const ring = i < 8 ? 0.65 : 2.0;
    const dir = vec2(Math.cos(angle), Math.sin(angle));
    const sampleUV = uvCavity.add(dir.mul(radiusCavity.mul(ring)));
    const depthSample = depthTexNode.sample(sampleUV.flipY());
    const depthVal = readLinearDepth(depthSample);
    const z = linearDepthToViewZ(
      depthVal,
      uniforms.uCameraRange.x,
      uniforms.uCameraRange.y
    );
    const neighbor = vec3(
      sampleUV.mul(2.0).sub(1.0).mul(z.negate()).div(projFocal),
      z
    );
    const delta = neighbor.sub(baseView.xyz);
    const dist = length(delta);
    const aboveTangent = max(
      float(0.0),
      dot(n, delta.div(max(dist, 0.0001))).sub(0.12)
    );
    const weight = float(1.0).sub(
      smoothstep(
        uniforms.uOcclusionRadius.mul(ring),
        uniforms.uOcclusionRadius.mul(ring * 3),
        dist
      )
    );
    cavity = cavity.add(aboveTangent.mul(weight));
  }

  // Feature proximity detection (eyes, trunk, hands)
  const eyeDist = min(
    length(pos.sub(vec3(-0.13, 0.43, 0.38))),
    length(pos.sub(vec3(0.13, 0.43, 0.38)))
  );
  const eyeZone = exp(eyeDist.mul(eyeDist).mul(-45.0));

  const trunkDistX = abs(pos.x);
  const trunkZone = exp(trunkDistX.mul(trunkDistX).mul(-25.0))
    .mul(smoothstep(-0.25, 0.45, pos.y))
    .mul(smoothstep(0.1, 0.35, pos.z));

  const handDist = min(
    length(pos.sub(vec3(-0.62, -0.05, 0.32))),
    length(pos.sub(vec3(0.62, -0.05, 0.32)))
  );
  const handZone = exp(handDist.mul(handDist).mul(-22.0));

  const featureZone = eyeZone
    .mul(1.6)
    .add(trunkZone.mul(1.3))
    .add(handZone.mul(1.2));

  // Depth-aware ink accents: strengthen contours and creases around eyes, trunk, and hands
  const creaseAccent = smoothstep(float(0.1), float(0.6), cavity.mul(0.15));
  const contourAccent = smoothstep(float(0.25), float(0.8), contour);
  const depthAccents = creaseAccent
    .mul(1.5)
    .add(contourAccent.mul(0.8))
    .mul(float(1.0).add(featureZone.mul(1.4)))
    .mul(uniforms.uDepthAccentStrength)
    .mul(uniforms.uDepthAccentsEnabled);

  let baseTone = shade
    .mul(uniforms.uShadowStrength)
    .add(contour.mul(uniforms.uContourStrength))
    .add(cavity.mul(0.125).mul(uniforms.uOcclusionStrength));

  baseTone = baseTone.add(depthAccents.mul(0.32));
  let tone = clamp(baseTone, 0.0, 1.0);

  const textureTone = clamp(
    aTextureInk.sub(0.5).mul(uniforms.uTextureInkContrast).add(0.5),
    0.0,
    1.0
  );
  tone = mix(
    tone,
    mix(tone, textureTone, uniforms.uTextureInkBlend),
    step(float(0.0), aTextureInk)
  );

  // Gentle tonal contrast: deepen faint particles without crushing dense regions into solid black
  const liftedToe = pow(tone, float(0.72));
  const softShoulder = float(1.0).sub(pow(float(1.0).sub(tone), float(1.2)));
  const gentleToneCurve = mix(liftedToe, softShoulder, tone);
  tone = mix(
    tone,
    gentleToneCurve,
    uniforms.uTonalContrast.mul(uniforms.uTonalContrastEnabled)
  );

  // 6. Point size calculation
  const density = mix(
    smoothstep(0.72, 0.98, activeTopology),
    mix(float(0.5), float(1.0), reveal),
    core
  );
  const faintBoost = smoothstep(float(0.1), float(0.6), density)
    .mul(float(0.18))
    .mul(uniforms.uTonalContrast)
    .mul(uniforms.uTonalContrastEnabled);
  const contrastDensity = clamp(density.add(faintBoost), 0.0, 1.0);
  const breathing = float(0.7).add(
    sin(aSeed.mul(91.0).add(uniforms.time.mul(0.6)))
      .mul(0.3)
      .mul(uniforms.uMotion)
  );
  const randomSize = fract(aSeed.mul(317.17));
  const graphicSize = mix(
    uniforms.uInkSizeRange.x,
    uniforms.uInkSizeRange.y,
    tone
  ).mul(float(0.85).add(randomSize.mul(0.3)));
  const inFieldFactor = fieldCircle.mul(float(1.0).sub(activeTopology));
  const sizeVariation = mix(
    graphicSize,
    float(0.55).add(pow(randomSize, float(3.0)).mul(1.45)),
    inFieldFactor
  );
  const size = mix(
    uniforms.uSurfaceSize,
    uniforms.uFieldSize.mul(breathing),
    inFieldFactor
  );
  const perspective = clamp(
    float(4.8).div(max(float(0.5), viewPosition.z.negate())),
    0.65,
    1.5
  );
  const finalSize = max(
    float(1.0),
    size
      .mul(sizeVariation)
      .mul(perspective)
      .mul(uniforms.uDpr)
      .mul(
        float(1.0)
          .add(influence.mul(0.24))
          .add(trace.mul(0.12))
          .add(music.x.mul(0.35))
          .add(
            fieldHover
              .mul(uniforms.uFieldHoverSize)
              .mul(float(1.0).sub(activeTopology))
          )
          .add(fieldPulse.mul(0.65))
      )
  );

  // 7. Surface visibility & opacity
  const depthClip = readLinearDepth(depthTexNode.sample(uvCavity.flipY()));
  const frontZ = linearDepthToViewZ(
    depthClip,
    uniforms.uCameraRange.x,
    uniforms.uCameraRange.y
  );
  const visible = float(1.0).sub(
    smoothstep(
      uniforms.uDepthTolerance,
      uniforms.uDepthTolerance.mul(2.0),
      frontZ.sub(baseView.z)
    )
  );

  let finalOpacity = mix(
    fieldCircle.mul(0.92),
    contrastDensity.mul(visible),
    activeTopology
  );

  const screenUV = clipPosition.xy.div(clipPosition.w).mul(0.5).add(0.5);
  const fieldDepth = readLinearDepth(depthTexNode.sample(screenUV.flipY()));
  const clearSculpture = float(1.0)
    .sub(step(0.9999, fieldDepth))
    .mul(smoothstep(0.08, 0.65, uniforms.uReveal))
    .mul(float(1.0).sub(activeTopology));
  finalOpacity = finalOpacity.mul(
    mix(
      float(1.0),
      mix(float(1.0), float(0.08), clearSculpture),
      step(float(0.5), fieldCircle)
    )
  );

  // 8. Motion vector calculation for brief interaction trails
  const motionDelta = flightSwirl.add(fieldAttract).add(surface.sub(pos)).add(pointerFollow);
  const motionView = mat3(cameraViewMatrix).mul(motionDelta);
  const motionSpeed = length(motionDelta);
  const motionDir = normalize(motionView.xy.add(vec2(0.0001, 0.0001)));

  const interactionActivity = max(
    uniforms.uActivity,
    max(fieldHover, max(music.x, trace))
  );
  const trailScale = clamp(motionSpeed.mul(30.0), 0.0, 1.0)
    .mul(interactionActivity)
    .mul(uniforms.uInteractionTrailLength)
    .mul(uniforms.uInteractionTrailsEnabled);

  // instanceIndex is a GPU builtin, not an additional vertex buffer.
  const loadViewport = viewport.zw.div(uniforms.uDpr);
  const loadColumns = ceil(loadViewport.x.div(32));
  const loadRows = ceil(loadViewport.y.div(32));
  const loadIndex = float(instanceIndex);
  const loadGrid = vec3(
    loadIndex.mod(loadColumns).mul(32).add(1).div(loadViewport.x).mul(2).sub(1),
    float(1).sub(
      floor(loadIndex.div(loadColumns))
        .mul(32)
        .add(1)
        .div(loadViewport.y)
        .mul(2)
    ),
    float(1).sub(step(loadColumns.mul(loadRows), loadIndex))
  );
  // Leave time for the matching CSS grid to hand off before it starts moving.
  const arrival = smoothstep(0.35, 1.0, uniforms.uLoad);
  const loadSize = mix(uniforms.uDpr.mul(3), finalSize, arrival);
  const loadCenter = mix(
    vec4(loadGrid.xy, 0, 1),
    clipPosition.div(clipPosition.w),
    arrival
  );
  const quadDelta = positionLocal.xy.sub(arrival.mul(0.5));

  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  // Camera-facing instanced quads - undistorted circular particles
  material.vertexNode = loadCenter.add(
    vec4(quadDelta.mul(loadSize).mul(2).div(viewport.zw), 0, 0)
  );

  const vOpacity = varying(
    mix(loadGrid.z.mul(0.12), finalOpacity, arrival),
    "vOpacity"
  );

  // Antialiased circular disc rasterization
  const radius = length(uv().sub(vec2(0.5)));
  const edge = max(fwidth(radius), float(0.008));
  const discAlpha = float(1.0).sub(
    smoothstep(float(0.5).sub(edge), float(0.5), radius)
  );

  // Antialiasing: continuous subpixel filtering and energy preservation to eliminate edge shimmer during motion
  const aaWidth = max(fwidth(radius).mul(1.4), float(0.025));
  const smoothDisc = float(1.0).sub(
    smoothstep(
      float(0.5).sub(aaWidth),
      float(0.5).add(aaWidth.mul(0.35)),
      radius
    )
  );
  const subpixelFade = clamp(loadSize.div(float(1.8)), float(0.25), float(1.0));
  const antialiasedDisc = smoothDisc.mul(subpixelFade);

  const effectiveDisc = mix(
    discAlpha,
    antialiasedDisc,
    uniforms.uAntialiasingEnabled
  );

  const finalAlpha = effectiveDisc.mul(vOpacity);

  material.alphaTest = 0.002;
  material.colorNode = vec3(0.0);
  material.opacityNode = finalAlpha;

  // Secondary trail particle system (soft circular ghost blur echoes, without distorting particles)
  const trailMat1 = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const trailOffset1 = motionDir
    .negate()
    .mul(
      clamp(motionSpeed.mul(35.0), 0.0, 1.5)
        .mul(interactionActivity)
        .mul(uniforms.uInteractionTrailLength)
        .mul(finalSize)
        .mul(1.4)
    );
  trailMat1.vertexNode = clipPosition.add(
    vec4(
      quadDelta
        .mul(finalSize.mul(0.85))
        .add(trailOffset1)
        .mul(2.0)
        .div(viewport.zw)
        .mul(clipPosition.w),
      0.0,
      0.0
    )
  );
  const trailRadius = length(uv().sub(vec2(0.5)));
  const trailSoftDisc1 = float(1.0).sub(
    smoothstep(float(0.15), float(0.5), trailRadius)
  );
  trailMat1.alphaTest = 0.001;
  trailMat1.colorNode = vec3(0.0);
  trailMat1.opacityNode = trailSoftDisc1
    .mul(vOpacity)
    .mul(0.32)
    .mul(trailScale);

  const trailMat2 = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const trailOffset2 = motionDir
    .negate()
    .mul(
      clamp(motionSpeed.mul(35.0), 0.0, 1.5)
        .mul(interactionActivity)
        .mul(uniforms.uInteractionTrailLength)
        .mul(finalSize)
        .mul(2.8)
    );
  trailMat2.vertexNode = clipPosition.add(
    vec4(
      quadDelta
        .mul(finalSize.mul(0.7))
        .add(trailOffset2)
        .mul(2.0)
        .div(viewport.zw)
        .mul(clipPosition.w),
      0.0,
      0.0
    )
  );
  const trailSoftDisc2 = float(1.0).sub(
    smoothstep(float(0.08), float(0.5), trailRadius)
  );
  trailMat2.alphaTest = 0.001;
  trailMat2.colorNode = vec3(0.0);
  trailMat2.opacityNode = trailSoftDisc2
    .mul(vOpacity)
    .mul(0.16)
    .mul(trailScale);

  uniforms.uSurfaceDepth = depthTexNode;

  // UniformArrayNode owns a padded GPU buffer in .value; the loop edits .array.
  const bindings = { ...uniforms };
  for (const key of ["uNotePulse", "uNoteStrength", "uMusicPath", "uTrail"]) {
    bindings[key] = { value: uniforms[key].array };
  }
  return {
    material,
    trailMaterials: [trailMat1, trailMat2],
    uniforms: bindings,
    viewDepth: varying(viewPosition.z.negate(), "particleViewDepth"),
  };
}
