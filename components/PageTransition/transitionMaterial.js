import { MeshBasicNodeMaterial } from "three/webgpu";
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
  };
  const origin = attribute("aOrigin", "vec2");
  const target = attribute("aTarget", "vec2");
  const seed = attribute("aSeed", "vec2");
  const progress = smoothstep(0.1, 0.9, uniforms.uProgress);
  const transit = progress.mul(float(1).sub(progress)).mul(4);
  const base = mix(origin, target, progress);
  // Ganesha's restrained topology flow, applied to the bridging ink particles.
  const flow = vec2(
    sin(base.y.mul(4.5).add(uniforms.time.mul(1.6))),
    cos(base.x.mul(4.5).add(uniforms.time.mul(1.6)))
  )
    .mul(transit)
    .mul(0.045);
  const size = seed.y.pow(3).mul(4).add(1.2).mul(uniforms.uDpr);
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.vertexNode = vec4(
    base.add(flow).add(positionLocal.xy.mul(size).mul(2).div(viewport.zw)),
    0,
    1
  );
  material.colorNode = vec3(0);
  const radius = length(uv().sub(0.5));
  const disc = float(1).sub(
    smoothstep(float(0.5).sub(fwidth(radius).max(0.005)), 0.5, radius)
  );
  material.opacityNode = disc
    .mul(smoothstep(0.12, 0.4, uniforms.uProgress))
    .mul(float(1).sub(smoothstep(0.6, 0.92, uniforms.uProgress)))
    .mul(0.65);
  return { material, uniforms };
}
