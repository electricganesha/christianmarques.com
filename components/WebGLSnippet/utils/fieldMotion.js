// Shared coefficients keep CPU picking aligned with the TSL field animation.
export const FIELD_MOTION = {
  amplitude: 0.055,
  x: [2.17, 1.31, 0.15],
  y: [-1.47, 2.71, 0.17],
  phase: 100,
};
export function updateFieldPosition(target, field, extent, time, motion) {
  const { x, y, amplitude, phase } = FIELD_MOTION;
  target.set(
    field[0] * extent.x +
      Math.sin(field[0] * x[0] + field[1] * x[1] + time * x[2]) *
        amplitude *
        motion,
    field[1] * extent.y +
      Math.sin(field[0] * y[0] + field[1] * y[1] + phase + time * y[2]) *
        amplitude *
        motion,
    field[2] * 0.8
  );
  return target;
}
