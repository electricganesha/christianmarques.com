import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const src = await readFile(
  new URL("../components/WebGLSnippet/audio/topology.js", import.meta.url),
  "utf8"
);
const {
  fieldNoise,
  chooseNote,
  musicalRegion,
  PITCH_SET,
  MUSIC_REGIONS,
  TUNING_RATIOS,
  MUSIC_CONFIG,
} = await import(
  `data:text/javascript;base64,${Buffer.from(src).toString("base64")}`
);
for (let i = 0; i < 200; i++) {
  const x = i / 200,
    y = ((i * 17) % 200) / 200,
    z = ((i * 31) % 200) / 200;
  const noise = fieldNoise(x, y, z);
  assert.ok(noise >= 0 && noise <= 1);
  assert.ok(Math.abs(noise - fieldNoise(x + 0.001, y, z)) < 0.01);
  const note = chooseNote([x, y, z], i * 0.7, {
    step: i,
    random: (i % 10) / 10,
  });
  assert.ok(PITCH_SET.includes(note.midi % 12));
  assert.ok(note.frequency > 25 && note.frequency < 5000);
  assert.ok(Math.abs(note.detune) <= 3.5);
  assert.ok(Math.abs(note.pan) <= 0.75);
  assert.deepEqual(
    note,
    chooseNote([x, y, z], i * 0.7, { step: i, random: (i % 10) / 10 })
  );
}
for (const [name, region] of Object.entries(MUSIC_REGIONS)) {
  for (const center of region.centers)
    assert.equal(musicalRegion(center), name);
}
assert.notEqual(
  musicalRegion([0.5, 0.6, 0.95]),
  musicalRegion([0.5, 0.6, 0.1]),
  "Depth must influence anatomical region"
);
const pitches = new Set();
let varied = 0;
for (let step = 0; step < 100; step++) {
  const note = chooseNote([0.52, 0.52, 0.91], 0, {
    region: "trunk",
    step,
    random: (step % 10) / 10,
  });
  pitches.add(note.midi);
  if (note.varied) varied++;
  const pc = PITCH_SET.indexOf(note.midi % 12);
  const tonic = 440 * 2 ** ((MUSIC_CONFIG.tonicMidi - 69) / 12);
  const octave = Math.floor((note.midi - MUSIC_CONFIG.tonicMidi) / 12);
  assert.ok(
    Math.abs(note.frequency - tonic * TUNING_RATIOS[pc] * 2 ** octave) < 1e-8
  );
}
assert.equal(varied, 30, "30% of explicit draws choose variation");
assert.ok(
  pitches.size >= 8,
  "Phrases traverse the seven degrees and octave boundaries"
);
const micro = chooseNote([0.5, 0.73, 0.65], 0, { region: "head", step: 2 });
assert.ok(
  Math.abs(micro.tuningCents) > 10,
  "Ga should depart audibly from equal temperament"
);
console.log(
  "PASS: 3D regions, coherent noise, phrase vocabulary, 70/30 variation, microtonal ratios and bounded expression."
);

// Exercise gesture scheduling without an audio device; play() records exact onsets.
const engineSource = await readFile(
  new URL(
    "../components/WebGLSnippet/audio/ElectricGaneshaAudio.js",
    import.meta.url
  ),
  "utf8"
);
const topologyURL = `data:text/javascript;base64,${Buffer.from(src).toString(
  "base64"
)}`;
const { ElectricGaneshaAudio } = await import(
  `data:text/javascript;base64,${Buffer.from(
    engineSource.replace('"./topology"', JSON.stringify(topologyURL))
  ).toString("base64")}`
);
const engine = Object.create(ElectricGaneshaAudio.prototype);
Object.assign(engine, {
  enabled: true,
  active: true,
  disposed: false,
  context: { currentTime: 0, state: "running", sampleRate: 48000 },
  lastSample: null,
  velocity: 0,
  travel: 0,
  region: null,
  phraseStep: 0,
  lastLiveNote: -100,
  recording: null,
  paths: [],
  pending: [],
  bands: [0, 0, 0],
  bins: new Uint8Array(128),
  analyser: { fftSize: 256, getByteFrequencyData() {} },
});
const events = [];
engine.play = (sample, time, strength) =>
  events.push({ sample, time, strength });
const sample = {
  position: [0, 0, 0.3],
  normalizedPosition: [0.52, 0.52, 0.91],
  intensity: 1,
  moving: true,
  pressed: false,
};
engine.interact(sample);
assert.equal(events.length, 1, "Entering the surface must sound immediately");
assert.ok(
  events[0].time <= 0.01,
  "Pitch quantization must not delay gesture onset to a beat"
);
for (let i = 1; i < 100; i++) {
  engine.context.currentTime = i * 0.1;
  engine.interact({ ...sample, moving: false });
  engine.tick();
}
assert.equal(
  events.length,
  1,
  "Stillness must never schedule new notes, even with intensity held high"
);
engine.context.currentTime = 10;
engine.interact({ ...sample, moving: false, pressed: true });
assert.equal(
  events.length,
  2,
  "A deliberate stationary press must articulate once"
);
engine.context.currentTime = 10.1;
engine.interact({ ...sample, moving: false, pressed: true });
assert.equal(
  events.length,
  2,
  "Holding must not create an endless backing drone"
);
engine.context.currentTime = 11;
engine.interact({ ...sample, intensity: 0, moving: true, pressed: false });
assert.equal(events.length, 2, "Empty space must not play notes");
console.log(
  "PASS gesture scheduling: immediate onset, intentional press, stationary silence and empty-space silence."
);

const expressive = new Set();
for (const colorRandom of [0, 0.3, 0.6, 0.99]) {
  const n = chooseNote([0.52, 0.52, 0.91], 0, {
    region: "trunk",
    step: 4,
    random: 0,
    colorRandom,
    glitchRandom: 0,
    intensity: 1,
  });
  expressive.add(n.midi);
  assert.ok(n.glitch && n.grainDuration >= 0.035 && n.grainDuration <= 0.1);
  assert.ok(PITCH_SET.includes(n.midi % 12));
}
assert.ok(
  expressive.size >= 3,
  "Variation must offer distinct neighbouring, wider and octave leaps"
);
assert.equal(
  chooseNote([0.5, 0.5, 0.5], 0, { glitchRandom: 1, intensity: 1 }).glitch,
  false
);
console.log(
  "PASS wider pitch variation and bounded gesture-dependent glitch selection."
);

engine.context.currentTime = 12;
engine.beginPath();
engine.interact({ ...sample, source: "field", particleId: 1 });
const firstField = events.length;
engine.context.currentTime = 12.4;
engine.interact({ ...sample, source: "field", particleId: 2 });
assert.equal(
  events.length,
  firstField + 1,
  "Crossing another field circle articulates even within the same musical region"
);
assert.equal(
  engine.recording.length,
  0,
  "World-space field notes must not enter model-space recorded paths"
);
engine.context.currentTime = 12.8;
engine.interact({ ...sample, source: "field", particleId: 2, moving: false });
assert.equal(events.length, firstField + 1, "Stationary field hover is silent");
console.log(
  "PASS field note identity, stationary silence and coordinate-space separation."
);
