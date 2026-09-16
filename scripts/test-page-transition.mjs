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

// 3. Test SCSS View Transition selectors for cards mode
import fs from "fs";
import sass from "sass";
const scssContent = fs.readFileSync("styles/globals.scss", "utf8");
const compiledCss = sass.renderSync({ data: scssContent }).css.toString();

// Verify no invalid descendant spaces before ::view-transition in transition-mode rules
const invalidSpaceRegex = /html\[data-transition-mode=[^\]]+\]\s+::view-transition/;
assert(!invalidSpaceRegex.test(compiledCss), "SCSS must not emit descendant space between html[data-transition-mode] and ::view-transition");

// Verify essential selectors exist without spaces
assert(compiledCss.includes("html[data-transition-mode=cards]::view-transition-group(root)"), "Must contain root group override");
assert(compiledCss.includes("html[data-transition-mode=cards]::view-transition-old(root)"), "Must contain root old override");
assert(compiledCss.includes("html[data-transition-mode=cards]::view-transition-new(root)"), "Must contain root new override");
assert(compiledCss.includes("html[data-transition-mode=cards]::view-transition-group(projects-cards)"), "Must contain projects-cards group rule");
assert(compiledCss.includes("html[data-transition-mode=cards]::view-transition-old(projects-cards)"), "Must contain projects-cards old rule");
assert(compiledCss.includes("html[data-transition-mode=cards]::view-transition-new(projects-cards)"), "Must contain projects-cards new rule");

console.log("✓ SCSS view transition selectors for cards mode compiled cleanly without descendant spaces!");
