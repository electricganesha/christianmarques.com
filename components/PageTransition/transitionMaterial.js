import { MeshBasicNodeMaterial, Vector4 } from "three/webgpu";
import {
  attribute,
  uniform,
  float,
  vec2,
  vec3,
  vec4,
  mix,
  smoothstep,
  sin,
  cos,
  length,
  uv,
  positionLocal,
  viewport,
  fwidth,
} from "three/tsl";

export function createTransitionMaterial() {
  const uniforms = {
    uProgress: uniform(0),
    time: uniform(0),
    uDpr: uniform(1),
    // Direction, flow phase, scatter scale and per-particle timing spread.
    uVariation: uniform(new Vector4(0, 0, 1, 0.1)),
  };
  const origin = attribute("aOrigin", "vec2");
  const target = attribute("aTarget", "vec2");
  const seed = attribute("aSeed", "vec2");
  const delay = seed.x.mul(uniforms.uVariation.w);
  const progress = smoothstep(
    delay,
    float(1).sub(uniforms.uVariation.w).add(delay),
    uniforms.uProgress
  );
  const transit = progress.mul(float(1).sub(progress)).mul(4);
  const base = mix(origin, target, progress);

  // Organic radial scatter to simulate dust/ink disassembling from the content
  const angle = seed.x.mul(6.283185).add(uniforms.uVariation.x);
  const scatterDir = vec2(cos(angle), sin(angle));
  const scatterDist = seed.y.pow(1.5).mul(0.065).add(0.015);
  const scatter = scatterDir
    .mul(scatterDist)
    .mul(transit)
    .mul(uniforms.uVariation.z);
  const breeze = vec2(cos(uniforms.uVariation.x), sin(uniforms.uVariation.x))
    .mul(0.045)
    .mul(transit)
    .mul(uniforms.uVariation.z);

  // Ganesha's restrained topology flow, applied to the bridging ink particles
  const flow = vec2(
    sin(base.y.mul(4.5).add(uniforms.time.mul(1.6).add(uniforms.uVariation.y))),
    cos(base.x.mul(4.5).add(uniforms.time.mul(1.6).add(uniforms.uVariation.y)))
  )
    .mul(transit)
    .mul(0.045);

  const size = seed.y.pow(2).mul(3.5).add(1.4).mul(uniforms.uDpr);
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.vertexNode = vec4(
    base
      .add(flow)
      .add(scatter)
      .add(breeze)
      .add(positionLocal.xy.mul(size).mul(2).div(viewport.zw)),
    0,
    1
  );
  material.colorNode = vec3(0);
  const radius = length(uv().sub(0.5));
  const disc = float(1).sub(
    smoothstep(float(0.5).sub(fwidth(radius).max(0.005)), 0.5, radius)
  );

  // Particles ARE the content during the transition — visible immediately and throughout.
  // Fade out synced with content emerging at 40% → smooth crossfade, never a snap.
  const fadeIn = smoothstep(0.0, 0.02, uniforms.uProgress);
  const fadeOut = float(1).sub(smoothstep(0.4, 0.92, uniforms.uProgress));
  const envelope = fadeIn.mul(fadeOut);

  material.opacityNode = disc.mul(envelope).mul(0.85);
  return { material, uniforms };
}
