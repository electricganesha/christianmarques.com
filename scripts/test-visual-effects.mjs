import * as THREE from "three/webgpu";
import { GANESHA_CONFIG } from "../components/WebGLSnippet/ganeshaConfig.js";
import { applyConfigPatch, UNIFORM_BINDINGS } from "../components/WebGLSnippet/uniformBindings.js";
import { readFile } from "fs/promises";
import { pathToFileURL } from "url";
import path from "path";

function resolveImports(code) {
  return code.replace(/from "(three[^"\n]*)"/g, (_, name) => {
    let file;
    if (name === "three") file = "three/build/three.module.js";
    else if (name === "three/webgpu") file = "three/build/three.webgpu.js";
    else if (name === "three/tsl") file = "three/build/three.tsl.js";
    else file = `${name}.js`;
    return `from "${pathToFileURL(path.resolve("node_modules", file))}"`;
  });
}

let depth = await readFile(
  new URL("../components/WebGLSnippet/utils/tslDepth.js", import.meta.url),
  "utf8"
);
const depthUri = `data:text/javascript;base64,${Buffer.from(resolveImports(depth)).toString("base64")}`;

let noise = await readFile(
  new URL("../components/WebGLSnippet/utils/tslNoise.js", import.meta.url),
  "utf8"
);
const noiseUri = `data:text/javascript;base64,${Buffer.from(resolveImports(noise)).toString("base64")}`;

let fieldMotion = await readFile(
  new URL("../components/WebGLSnippet/utils/fieldMotion.js", import.meta.url),
  "utf8"
);
const fieldMotionUri = `data:text/javascript;base64,${Buffer.from(resolveImports(fieldMotion)).toString("base64")}`;

let infl = await readFile(
  new URL("../components/WebGLSnippet/utils/tslInfluence.js", import.meta.url),
  "utf8"
);
infl = resolveImports(infl);
infl = infl.replace('from "./tslNoise"', `from "${noiseUri}"`);
infl = infl.replace('from "./fieldMotion"', `from "${fieldMotionUri}"`);
const inflUri = `data:text/javascript;base64,${Buffer.from(infl).toString("base64")}`;

let src = await readFile(
  new URL("../components/WebGLSnippet/ganeshaMaterial.js", import.meta.url),
  "utf8"
);
src = resolveImports(src);
src = src.replace('from "./utils/tslDepth"', `from "${depthUri}"`);
src = src.replace('from "./utils/tslInfluence"', `from "${inflUri}"`);

const dataUri = `data:text/javascript;base64,${Buffer.from(src).toString("base64")}`;
const { createGaneshaMaterial } = await import(dataUri);

const dummyTarget = new THREE.RenderTarget(1, 1);
const { material, trailMaterials, uniforms } = createGaneshaMaterial(GANESHA_CONFIG, dummyTarget.texture);

console.log("Checking material and trail materials...");
if (!material || !material.vertexNode || !material.opacityNode) {
  throw new Error("Primary material missing vertexNode or opacityNode");
}
if (!Array.isArray(trailMaterials) || trailMaterials.length < 2) {
  throw new Error("trailMaterials must have at least 2 trail stages");
}
for (let i = 0; i < trailMaterials.length; i++) {
  const tm = trailMaterials[i];
  if (!tm.vertexNode || !tm.opacityNode) {
    throw new Error(`Trail material ${i} missing vertexNode or opacityNode`);
  }
}
console.log("PASS: Primary material and trail materials created successfully!");

console.log("Checking effect uniforms...");
const requiredUniforms = [
  "uDepthAccentsEnabled",
  "uDepthAccentStrength",
  "uTonalContrastEnabled",
  "uTonalContrast",
  "uInteractionTrailsEnabled",
  "uInteractionTrailLength",
  "uAntialiasingEnabled",
];

for (const u of requiredUniforms) {
  if (uniforms[u] === undefined || uniforms[u].value === undefined) {
    throw new Error(`Missing uniform: ${u}`);
  }
  console.log(`- ${u}: value = ${uniforms[u].value}`);
}

console.log("Checking UNIFORM_BINDINGS mappings...");
const requiredKeys = [
  "depthAccentsEnabled",
  "depthAccentStrength",
  "tonalContrastEnabled",
  "tonalContrast",
  "interactionTrailsEnabled",
  "interactionTrailLength",
  "antialiasingEnabled",
];
for (const key of requiredKeys) {
  if (!UNIFORM_BINDINGS[key]) {
    throw new Error(`Missing UNIFORM_BINDINGS mapping for ${key}`);
  }
}

console.log("Testing applyConfigPatch toggles...");
const patch1 = {
  depthAccentsEnabled: false,
  depthAccentStrength: 1.25,
  tonalContrastEnabled: false,
  tonalContrast: 0.85,
  interactionTrailsEnabled: false,
  interactionTrailLength: 1.5,
  antialiasingEnabled: false,
};
applyConfigPatch(patch1, Object.keys(patch1), uniforms);

if (uniforms.uDepthAccentsEnabled.value !== 0) throw new Error("uDepthAccentsEnabled should be 0");
if (uniforms.uDepthAccentStrength.value !== 1.25) throw new Error("uDepthAccentStrength should be 1.25");
if (uniforms.uTonalContrastEnabled.value !== 0) throw new Error("uTonalContrastEnabled should be 0");
if (uniforms.uTonalContrast.value !== 0.85) throw new Error("uTonalContrast should be 0.85");
if (uniforms.uInteractionTrailsEnabled.value !== 0) throw new Error("uInteractionTrailsEnabled should be 0");
if (uniforms.uInteractionTrailLength.value !== 1.5) throw new Error("uInteractionTrailLength should be 1.5");
if (uniforms.uAntialiasingEnabled.value !== 0) throw new Error("uAntialiasingEnabled should be 0");

const patch2 = {
  depthAccentsEnabled: true,
  tonalContrastEnabled: true,
  interactionTrailsEnabled: true,
  antialiasingEnabled: true,
};
applyConfigPatch(patch2, Object.keys(patch2), uniforms);

if (uniforms.uDepthAccentsEnabled.value !== 1) throw new Error("uDepthAccentsEnabled should be 1");
if (uniforms.uTonalContrastEnabled.value !== 1) throw new Error("uTonalContrastEnabled should be 1");
if (uniforms.uInteractionTrailsEnabled.value !== 1) throw new Error("uInteractionTrailsEnabled should be 1");
if (uniforms.uAntialiasingEnabled.value !== 1) throw new Error("uAntialiasingEnabled should be 1");

console.log("PASS: All visual effect uniforms and toggles verified successfully!");
