// Confirm musical zones are reachable on actual front-facing GLB ray hits.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import * as THREE from "three";
let source = await readFile("components/WebGLSnippet/sampleGanesha.js", "utf8");
source = source.replace(
  /from "(three[^"\n]*)"/g,
  (_, name) =>
    `from "${pathToFileURL(
      path.resolve(
        "node_modules",
        name === "three" ? "three/build/three.module.js" : `${name}.js`
      )
    )}"`
);
const { loadSurface } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const topology = await readFile(
  "components/WebGLSnippet/audio/topology.js",
  "utf8"
);
const { musicalRegion, MUSIC_REGIONS, chooseNote } = await import(
  `data:text/javascript;base64,${Buffer.from(topology).toString("base64")}`
);
const bytes = await readFile("public/models/electricganesha.glb");
const surface = await loadSurface(
  `data:model/gltf-binary;base64,${bytes.toString("base64")}`
);
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const mesh = new THREE.Mesh(surface, material);
const ray = new THREE.Raycaster();
ray.ray.direction.set(0, 0, -1);
const size = surface.boundingBox.getSize(new THREE.Vector3());
const hits = [],
  position = new THREE.Vector3();
const counts = Object.fromEntries(
  Object.keys(MUSIC_REGIONS).map((k) => [k, 0])
);
const notes = new Set();
for (let x = 0; x < 70; x++)
  for (let y = 0; y < 90; y++) {
    ray.ray.origin.set(
      surface.boundingBox.min.x + ((x + 0.5) / 70) * size.x,
      surface.boundingBox.min.y + ((y + 0.5) / 90) * size.y,
      4
    );
    hits.length = 0;
    ray.intersectObject(mesh, false, hits);
    if (!hits.length) continue;
    position.copy(hits[0].point).sub(surface.boundingBox.min).divide(size);
    const region = musicalRegion(position.toArray());
    counts[region]++;
    const shape = MUSIC_REGIONS[region];
    for (let step = 0; step < shape.phrase.length; step++) {
      const note = chooseNote(position.toArray(), 0, { region, step });
      notes.add(note.midi);
      assert.ok(
        ["pluck", "resonance", "bell", "noise", "drone"].includes(note.voice)
      );
      assert.ok(Number.isFinite(note.frequency));
    }
  }
console.log(JSON.stringify({ counts, distinctPhrasePitches: notes.size }));
for (const [region, count] of Object.entries(counts))
  assert.ok(count > 0, `${region} must be reachable on visible geometry`);
assert.ok(
  notes.size >= 24,
  "The zones should offer at least two dozen phrase pitches"
);
surface.dispose();
material.dispose();
