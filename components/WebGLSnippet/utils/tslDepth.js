import { Fn } from "three/tsl";

/**
 * Float linear depth uses the same convention on both WebGPU and WebGL2 backends.
 */
export const readLinearDepth = Fn(([rgba]) => {
  return rgba.r;
});

/**
 * Converts stored inverse clip depth into linear view space Z coordinate.
 */
export const linearDepthToViewZ = Fn(([invClipZ, near, far]) => {
  return near.add(invClipZ.mul(far.sub(near))).negate();
});
