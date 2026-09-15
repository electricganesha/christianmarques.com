import * as THREE from "three";
import assert from "assert";

// Test the per-particle hover activation logic isolated from DOM
const config = {
  fieldHoverRadius: 0.32,
  revealDuration: 2.8,
  releaseDuration: 2.8,
};

const decay = 1 / config.releaseDuration;
const hoverRadiusSq = config.fieldHoverRadius ** 2;

const fieldPoints = [
  { id: 0, position: new THREE.Vector3(-1.5, 0.8, 0), progress: 0, awakened: false },
  { id: 1, position: new THREE.Vector3(1.5, -0.8, 0), progress: 0, awakened: false },
];

const rayOffset = new THREE.Vector3();
const ray = new THREE.Ray(new THREE.Vector3(-1.5, 0.8, 5), new THREE.Vector3(0, 0, -1));

// Frame 1: Pointer active directly above particle 0
let dt = 0.016;
let stillTime = 0.05;
let pointerActive = true;
let totalProgress = 0;

for (const point of fieldPoints) {
  ray.closestPointToPoint(point.position, rayOffset);
  rayOffset.subVectors(point.position, rayOffset);
  const distSq = rayOffset.lengthSq();
  const isHovered = pointerActive && distSq < hoverRadiusSq;
  const influence = isHovered ? Math.exp((-2.5 * distSq) / hoverRadiusSq) : 0;
  const shouldDecay = !pointerActive || stillTime > 0.3;

  if (isHovered) {
    point.awakened = true;
    point.progress = Math.min(1.0, point.progress + dt * (2.5 + 2.0 * influence));
  } else if (shouldDecay) {
    point.progress = Math.max(0.0, point.progress - dt * decay);
    if (point.progress === 0) point.awakened = false;
  } else if (point.awakened) {
    point.progress = Math.min(1.0, point.progress + dt * 1.8);
  }
  totalProgress += point.progress;
}

assert(fieldPoints[0].progress > 0, "Particle 0 should activate when hovered");
assert(fieldPoints[0].awakened === true, "Particle 0 should be awakened");
assert(fieldPoints[1].progress === 0, "Distant particle 1 must remain at 0 (no quadrant artifact!)");
assert(fieldPoints[1].awakened === false, "Distant particle 1 must not be awakened");

console.log("PASS: Per-particle hover test: particle 0 activated, distant particle 1 completely untouched.");

// Test decay: user stops moving
stillTime = 0.5;
const prevProgress = fieldPoints[0].progress;
for (const point of fieldPoints) {
  const shouldDecay = !pointerActive || stillTime > 0.3;
  if (shouldDecay) {
    point.progress = Math.max(0.0, point.progress - dt * decay);
    if (point.progress === 0) point.awakened = false;
  }
}

assert(fieldPoints[0].progress < prevProgress, "Particle 0 should decay when stillTime > 0.3");
console.log("PASS: Decay test: particle 0 decays over symmetrical releaseDuration.");
