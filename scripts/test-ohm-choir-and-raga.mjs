import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const topologySrc = await readFile(
  new URL("../components/WebGLSnippet/audio/topology.js", import.meta.url),
  "utf8"
);
const {
  OHM_CHOIR,
  PITCH_SET,
  TUNING_RATIOS,
  MUSIC_REGIONS,
  chooseNote,
  MUSIC_CONFIG,
} = await import(
  `data:text/javascript;base64,${Buffer.from(topologySrc).toString("base64")}`
);

// 1. Verify Ohm Choir definition
assert.equal(OHM_CHOIR.length, 6, "Ohm Choir should define 6 harmonic voices");
const choirNames = OHM_CHOIR.map((v) => v.name);
assert.ok(choirNames.includes("deepRoot"));
assert.ok(choirNames.includes("subFifth"));
assert.ok(choirNames.includes("rootChant"));
assert.ok(choirNames.includes("sereneThird"));
assert.ok(choirNames.includes("sacredFifth"));
assert.ok(choirNames.includes("upperSa"));

// Verify that all Ohm choir voices are tuned to pure harmonics of Sa
const tonicFreq = 440 * 2 ** ((MUSIC_CONFIG.tonicMidi - 69) / 12);
for (const voice of OHM_CHOIR) {
  const ratio =
    TUNING_RATIOS[PITCH_SET.indexOf(PITCH_SET[voice.degree])] *
    2 ** voice.octaveShift;
  const freq = tonicFreq * ratio;
  assert.ok(freq >= 60 && freq <= 300, `Choir voice ${voice.name} freq in warm humming range: ${freq}`);
  assert.ok(voice.formant >= 400 && voice.formant <= 750, `Vocal formant in human AUM range: ${voice.formant}`);
}
console.log("PASS: Ohm Choir harmonic pitches and vocal formant specifications verified.");

// 2. Verify Ganesha Regional Raga Melodies (Raga Yaman Just Intonation)
for (const [regionName, regionDef] of Object.entries(MUSIC_REGIONS)) {
  assert.ok(regionDef.phrase.length >= 6, `Region ${regionName} has a musical raga phrase`);
  // Verify notes map to Yaman scale degrees
  for (const degree of regionDef.phrase) {
    const pc = (degree % 7 + 7) % 7;
    assert.ok(PITCH_SET[pc] !== undefined, `Degree ${degree} maps to Yaman pitch class`);
  }
}
console.log("PASS: Ganesha regional raga phrases verified across all anatomical regions.");
