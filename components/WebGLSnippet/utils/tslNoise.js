import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  dot,
  abs,
  max,
  min,
  step,
  floor,
} from "three/tsl";

// --- Perlin Simplex 3D Noise in pure Three.js Shading Language (TSL) ---

export const permute = Fn(([x]) => {
  return x.mul(34.0).add(1.0).mul(x).mod(289.0);
});

export const taylorInvSqrt = Fn(([r]) => {
  return float(1.79284291400159).sub(r.mul(0.85373472095314));
});

export const snoise = Fn(([v]) => {
  const C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const D = vec4(0.0, 0.5, 1.0, 2.0);

  const i = floor(v.add(dot(v, C.yyy)));
  const x0 = v.sub(i).add(dot(i, C.xxx));

  const g = step(x0.yzx, x0.xyz);
  const l = float(1.0).sub(g);
  const i1 = min(g.xyz, l.zxy);
  const i2 = max(g.xyz, l.zxy);

  const x1 = x0.sub(i1).add(C.xxx);
  const x2 = x0.sub(i2).add(C.xxx.mul(2.0));
  const x3 = x0.sub(D.yyy);

  const iMod = i.mod(289.0);
  const p = permute(
    permute(
      permute(iMod.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
        .add(iMod.y)
        .add(vec4(0.0, i1.y, i2.y, 1.0))
    )
      .add(iMod.x)
      .add(vec4(0.0, i1.x, i2.x, 1.0))
  );

  const ns = vec3(D.wyz).mul(0.142857142857).sub(D.xzx);
  const j = p.sub(floor(p.mul(ns.z).mul(ns.z)).mul(49.0));

  const x_ = floor(j.mul(ns.z));
  const y_ = floor(j.sub(x_.mul(7.0)));

  const x = x_.mul(ns.x).add(ns.yyyy);
  const y = y_.mul(ns.x).add(ns.yyyy);
  const h = float(1.0).sub(abs(x)).sub(abs(y));

  const b0 = vec4(x.xy, y.xy);
  const b1 = vec4(x.zw, y.zw);

  const s0 = floor(b0).mul(2.0).add(1.0);
  const s1 = floor(b1).mul(2.0).add(1.0);
  const sh = step(h, vec4(0.0)).negate();

  const a0 = b0.xzyw.add(s0.xzyw.mul(sh.xxyy));
  const a1 = b1.xzyw.add(s1.xzyw.mul(sh.zzww));

  const p0 = vec3(a0.xy, h.x);
  const p1 = vec3(a0.zw, h.y);
  const p2 = vec3(a1.xy, h.z);
  const p3 = vec3(a1.zw, h.w);

  const norm = taylorInvSqrt(
    vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
  );
  const p0n = p0.mul(norm.x);
  const p1n = p1.mul(norm.y);
  const p2n = p2.mul(norm.z);
  const p3n = p3.mul(norm.w);

  const m = max(
    float(0.6).sub(vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
    0.0
  );
  const m2 = m.mul(m);
  const m4 = m2.mul(m2);

  return dot(
    m4,
    vec4(dot(p0n, x0), dot(p1n, x1), dot(p2n, x2), dot(p3n, x3))
  ).mul(42.0);
});
