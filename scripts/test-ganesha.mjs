// Run: node scripts/test-ganesha.mjs (uses the project's installed Three.js).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

// The app uses extensionless webpack imports; resolve those for this Node check.
let source = await readFile(
  new URL("../components/WebGLSnippet/sampleGanesha.js", import.meta.url),
  "utf8"
);
source = source.replace(/from "(three[^"\n]*)"/g, (_, name) => {
  const file = name === "three" ? "three/build/three.module.js" : `${name}.js`;
  return `from "${pathToFileURL(path.resolve("node_modules", file))}"`;
});
const { loadSurface, sampleParticles, sampleTextureInk } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const bytes = await readFile(
  new URL("../public/models/electricganesha.glb", import.meta.url)
);
const url = `data:model/gltf-binary;base64,${bytes.toString("base64")}`;
const surface = await loadSurface(url);
assert.ok(
  Math.abs(surface.boundingBox.max.y - surface.boundingBox.min.y - 2) < 1e-5
);
assert.ok(
  Math.abs(surface.boundingBox.max.x + surface.boundingBox.min.x) < 1e-5
);
const particles = sampleParticles(surface, 8000);
const again = sampleParticles(surface, 8000);
assert.deepEqual(
  particles.attributes.position.array,
  again.attributes.position.array
);
for (const name of ["position", "normal", "aField", "aSeed"]) {
  assert.equal(particles.attributes[name].count, 8000);
  assert.ok(particles.attributes[name].array.every(Number.isFinite));
}
for (let i = 0; i < 8000; i++) {
  const normals = particles.attributes.normal.array;
  assert.ok(
    Math.abs(Math.hypot(...normals.subarray(i * 3, i * 3 + 3)) - 1) < 1e-5
  );
}
// A real GLB fixture: two visible triangles with 1:4 transformed areas, plus
// an unused mesh. This catches accidentally sampling only the first child.
const triangle = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
const doc = {
  asset: { version: "2.0" },
  scene: 0,
  scenes: [{ nodes: [0, 1] }],
  nodes: [{ mesh: 0 }, { mesh: 0, translation: [5, 0, 0], scale: [2, 2, 2] }],
  meshes: [
    { primitives: [{ attributes: { POSITION: 0 } }] },
    { primitives: [{ attributes: { POSITION: 0 } }] },
  ],
  buffers: [{ byteLength: triangle.byteLength }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: triangle.byteLength }],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: "VEC3",
      min: [0, 0, 0],
      max: [1, 1, 0],
    },
  ],
};
let json = JSON.stringify(doc);
json += " ".repeat((4 - (json.length % 4)) % 4);
const glb = Buffer.alloc(28 + json.length + triangle.byteLength);
glb.writeUInt32LE(0x46546c67, 0);
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(glb.length, 8);
glb.writeUInt32LE(json.length, 12);
glb.writeUInt32LE(0x4e4f534a, 16);
glb.write(json, 20);
glb.writeUInt32LE(triangle.byteLength, 20 + json.length);
glb.writeUInt32LE(0x004e4942, 24 + json.length);
Buffer.from(triangle.buffer).copy(glb, 28 + json.length);
const multi = await loadSurface(
  `data:model/gltf-binary;base64,${glb.toString("base64")}`
);
const multiPoints = sampleParticles(multi, 10000);
let right = 0;
const positions = multiPoints.attributes.position;
for (let i = 0; i < positions.count; i++) if (positions.getX(i) > 0) right++;
assert.ok(
  right > 7700 && right < 8300,
  `Expected ~80% on the larger transformed mesh; got ${right / 100}%`
);
const imageFixture = {
  width: 2,
  height: 2,
  pixels: new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
  ]),
  matrix: { elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
  flipY: false,
  wrapS: 1001,
  wrapT: 1001,
};
assert.equal(sampleTextureInk(imageFixture, 0, 0), 1);
assert.ok(Math.abs(sampleTextureInk(imageFixture, 1, 0)) < 1e-6);
assert.equal(sampleTextureInk(imageFixture, 0.5, 0.5), 0.5);
assert.ok(
  Math.abs(sampleTextureInk({ ...imageFixture, flipY: true }, 0, 0)) < 1e-6
);
assert.ok(
  particles.attributes.aTextureInk.array.every((value) => value === -1),
  "Missing images must retain geometry-only fallback"
);
surface.userData.inkImages = [imageFixture];
surface.attributes.aInkImage.array.fill(0);
const textured = sampleParticles(surface, 8000);
assert.ok(
  textured.attributes.aTextureInk.array.every(
    (value) => value >= 0 && value <= 1
  )
);
assert.ok(
  new Set(textured.attributes.aTextureInk.array).size > 100,
  "UV interpolation must produce varying per-particle ink"
);
assert.deepEqual(
  textured.attributes.position.array,
  particles.attributes.position.array,
  "Texture sampling must not move the sculpture"
);
textured.dispose();
[surface, particles, again, multi, multiPoints].forEach((g) => g.dispose());
console.log(
  "PASS: real GLB, normalization, finite unit normals, deterministic sampling, transformed multi-mesh area weighting, UV ink interpolation/orientation and missing-texture fallback."
);
