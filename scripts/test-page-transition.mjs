import assert from "assert";
import { samplePageLayout } from "../components/PageTransition/samplePageLayout.js";
import { createTransitionMaterial } from "../components/PageTransition/transitionMaterial.js";

console.log("Testing TSL Page Transition Material and Layout Sampler...");

// 1. Test samplePageLayout fallback in Node environment
const particleCount = 1000;
const positions = samplePageLayout(particleCount);
assert(positions instanceof Float32Array, "positions must be Float32Array");
assert.strictEqual(positions.length, particleCount * 2, "positions must contain x, y for every particle");

for (let i = 0; i < positions.length; i++) {
  assert(!isNaN(positions[i]), `Position at index ${i} must not be NaN`);
  assert(positions[i] >= -1.0 && positions[i] <= 1.0, `Position at ${i} must be in clipspace [-1, 1]`);
}
console.log("✓ samplePageLayout generated valid clipspace coordinates.");

// 2. Test TSL Material construction
const { material, uniforms } = createTransitionMaterial();
assert(material !== null, "createTransitionMaterial must return a material");
assert(uniforms !== null, "createTransitionMaterial must return uniforms");
assert(uniforms.uProgress !== undefined, "uProgress uniform must be defined");
assert(uniforms.time !== undefined, "time uniform must be defined");
assert(uniforms.uDpr !== undefined, "uDpr uniform must be defined");

assert(material.vertexNode !== null && material.vertexNode !== undefined, "material must have vertexNode");
assert(material.colorNode !== null && material.colorNode !== undefined, "material must have colorNode");
assert(material.opacityNode !== null && material.opacityNode !== undefined, "material must have opacityNode");

assert.strictEqual(material.transparent, true, "material must be transparent");
assert.strictEqual(material.depthWrite, false, "material depthWrite must be false");
assert.strictEqual(material.depthTest, false, "material depthTest must be false");

console.log("✓ TSL MeshBasicNodeMaterial created cleanly with valid vertexNode and opacityNode graph!");
