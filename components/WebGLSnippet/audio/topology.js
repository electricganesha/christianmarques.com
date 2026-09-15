// Yaman-inspired vocabulary (tivra Ma) with an adjustable ratio-based tuning.
// Phrase contours matter as well as the seven pitches; this is an interpretation.
export const PITCH_SET = [0, 2, 4, 6, 7, 9, 11];
// An artistic just-intonation palette, not a universal Indian tuning standard.
export const TUNING_RATIOS = [1, 9 / 8, 5 / 4, 45 / 32, 3 / 2, 5 / 3, 15 / 8];
export const MUSIC_CONFIG = {
  tonicMidi: 48,
  microtonalBlend: 1, // 0 = equal temperament; 1 = full ratio-based tuning.
  ornamentCents: 38,
  glideSeconds: 0.14,
  variation: 0.3, // Keep the phrase anchor; variations can now make wider leaps.
  variationSteps: [1, 2, 4, 7],
  glitchProbability: 0.32,
  noiseAmount: 0.22,
  gestureSpacing: 0.085, // Travel in normalized model space per articulation.
  minimumInterval: 0.18,
  fieldNoteInterval: 0.35,
  fieldNoteVolume: 0.85,
  beatSeconds: 0.24,
  masterVolume: 0.75,
  maxVoices: 12,
  pathLifetime: 8,
  maxPaths: 3,
  maxPathPoints: 8,
};
const fract = (x) => x - Math.floor(x);
const smooth = (x) => x * x * (3 - 2 * x);
const hash = (x, y, z) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
// Trilinear value noise gives nearby regions a shared, slowly evolving tendency.
export function fieldNoise(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const tx = smooth(fract(x)),
    ty = smooth(fract(y)),
    tz = smooth(fract(z));
  let result = 0;
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++)
      for (let dz = 0; dz < 2; dz++) {
        result +=
          hash(ix + dx, iy + dy, iz + dz) *
          (dx ? tx : 1 - tx) *
          (dy ? ty : 1 - ty) *
          (dz ? tz : 1 - tz);
      }
  return result;
}
// Ohm Choir harmonic voices (Just Intonation overtone series of sacred AUM chanting)
export const OHM_CHOIR = [
  { name: "deepRoot", octaveShift: -1, degree: 0, formant: 420 }, // Low Sa (C2, 65.4 Hz) - Deep monk chest drone
  { name: "subFifth", octaveShift: -1, degree: 4, formant: 480 }, // Low Pa (G2, 98.1 Hz) - Grounding fifth
  { name: "rootChant", octaveShift: 0, degree: 0, formant: 520 }, // Mid Sa (C3, 130.8 Hz) - Foundation chant
  { name: "sereneThird", octaveShift: 0, degree: 2, formant: 580 }, // Mid Ga (E3, 163.5 Hz) - Meditative third
  { name: "sacredFifth", octaveShift: 0, degree: 4, formant: 640 }, // Mid Pa (G3, 196.2 Hz) - Overtone fifth
  { name: "upperSa", octaveShift: 1, degree: 0, formant: 700 }, // High Sa' (C4, 261.6 Hz) - Singing bowl crown
];

// Ellipsoids in normalized model coordinates, including depth (front = +Z).
// Artistic approximations of this GLB's anatomy, rather than semantic mesh labels.
// Left/right are viewed from the camera; voices can be shared by distinct regions.
// Melodic phrases are rooted in Raga Yaman (Kalyani) arohana, avarohana, and pakad.
export const MUSIC_REGIONS = {
  crown: {
    centers: [[0.5, 0.91, 0.5]],
    radius: [0.2, 0.16, 0.45],
    octave: 2,
    voice: "bell",
    // Celestial upper-octave raga flourish: P D N S' R' S' N D P
    phrase: [4, 5, 6, 7, 8, 7, 6, 5, 4, 6, 7, 4],
  },
  head: {
    centers: [[0.5, 0.73, 0.65]],
    radius: [0.19, 0.16, 0.35],
    octave: 1,
    voice: "resonance",
    // Classical Yaman pakad (signature): N. R G, R G M# P, M# G R S
    phrase: [-1, 1, 2, 1, 2, 3, 4, 3, 2, 1, -1, 1, 0],
  },
  trunk: {
    centers: [[0.52, 0.52, 0.91]],
    radius: [0.16, 0.25, 0.27],
    octave: 1,
    voice: "pluck",
    // Complete expressive raga chalan (ascent & descent with meend glides):
    // N. R G M# P D N S' N D P M# G R S
    phrase: [-1, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0],
  },
  trunkTip: {
    centers: [[0.56, 0.4, 0.74]],
    radius: [0.11, 0.1, 0.2],
    octave: 0,
    voice: "pluck",
    // Playful ground phrase resolving to Sa: P M# G R, G R S, N. R S
    phrase: [4, 3, 2, 1, 2, 1, 0, -1, 1, 0],
  },
  leftEye: {
    centers: [[0.43, 0.715, 0.664]],
    radius: [0.08, 0.07, 0.16],
    octave: 2,
    voice: "resonance",
    // Murki (graceful turn): M# D N S' N D P
    phrase: [3, 5, 6, 7, 6, 5, 4, 5],
  },
  rightEye: {
    centers: [[0.57, 0.715, 0.669]],
    radius: [0.08, 0.07, 0.16],
    octave: 2,
    voice: "resonance",
    // Mirror murki: P M# G M# P D P M#
    phrase: [4, 3, 2, 3, 4, 5, 4, 3],
  },
  leftTusk: {
    centers: [[0.41, 0.59, 0.656]],
    radius: [0.09, 0.09, 0.2],
    octave: 2,
    voice: "bell",
    // Glinting upward bell: G P N S'
    phrase: [2, 4, 6, 7, 6, 4, 2, 4],
  },
  rightTusk: {
    centers: [[0.63, 0.59, 0.484]],
    radius: [0.09, 0.09, 0.2],
    octave: 1,
    voice: "bell",
    // Downward bell descent: S' N D P M# G
    phrase: [7, 6, 5, 4, 3, 2, 1, 2],
  },
  leftEar: {
    centers: [[0.25, 0.71, 0.51]],
    radius: [0.19, 0.2, 0.32],
    octave: 2,
    voice: "noise",
    // Bansuri flute breath: M# P D P M# G R
    phrase: [3, 4, 5, 4, 3, 2, 1, 2],
  },
  rightEar: {
    centers: [[0.75, 0.71, 0.51]],
    radius: [0.19, 0.2, 0.32],
    octave: 1,
    voice: "noise",
    // Bansuri flute descent: P D P M# G R S N.
    phrase: [4, 5, 4, 3, 2, 1, 0, -1],
  },
  leftHand: {
    centers: [[0.13, 0.49, 0.6]],
    radius: [0.22, 0.25, 0.42],
    octave: 1,
    voice: "bell",
    // Rhythmic temple bells: G M# D P, M# D N S'
    phrase: [2, 3, 5, 4, 3, 5, 6, 7],
  },
  rightHand: {
    centers: [[0.87, 0.49, 0.6]],
    radius: [0.22, 0.25, 0.42],
    octave: 2,
    voice: "bell",
    // Auspicious mudra bells: S R G M# P M# G R
    phrase: [0, 1, 2, 3, 4, 3, 2, 1],
  },
  leftArm: {
    centers: [[0.28, 0.43, 0.61]],
    radius: [0.13, 0.15, 0.3],
    octave: 0,
    voice: "pluck",
    // Sitar stroke phrase: S R G R, G M# P M#
    phrase: [0, 1, 2, 1, 2, 3, 4, 3],
  },
  rightArm: {
    centers: [[0.72, 0.43, 0.61]],
    radius: [0.13, 0.15, 0.3],
    octave: 1,
    voice: "pluck",
    // Sitar stroke phrase: P M# G R, G M# P D
    phrase: [4, 3, 2, 1, 2, 3, 4, 5],
  },
  belly: {
    centers: [[0.5, 0.31, 0.68]],
    radius: [0.3, 0.2, 0.4],
    octave: 0,
    voice: "drone",
    // Deep warm tanpura chord movement: S G P D P G R S
    phrase: [0, 2, 4, 5, 4, 2, 1, 0],
  },
  leftFoot: {
    centers: [[0.3, 0.16, 0.72]],
    radius: [0.19, 0.1, 0.27],
    octave: 0,
    voice: "pluck",
    // Grounding pluck: S N. D. N. R S
    phrase: [0, -1, -2, -1, 1, 0, 2, 0],
  },
  rightFoot: {
    centers: [[0.7, 0.16, 0.72]],
    radius: [0.19, 0.1, 0.27],
    octave: 0,
    voice: "resonance",
    // Resonant grounding: M#. P. N. R S
    phrase: [-4, -3, -1, 1, 0, 2, 1, 0],
  },
  base: {
    centers: [[0.5, 0.08, 0.5]],
    radius: [0.6, 0.14, 0.6],
    octave: -1,
    voice: "drone",
    // Foundational low Sa-Pa drone: S. S. P. S. N.. S.
    phrase: [0, 0, 4, 0, -1, 0, 4, 0],
  },
};

function regionDistance(position, region) {
  return Math.min(
    ...region.centers.map((center) =>
      position.reduce(
        (sum, value, i) => sum + ((value - center[i]) / region.radius[i]) ** 2,
        0,
      ),
    ),
  );
}
export function musicalRegion(position, previous) {
  let result = "trunk",
    score = Infinity;
  for (const [name, region] of Object.entries(MUSIC_REGIONS)) {
    const next = regionDistance(position, region);
    if (next < score) {
      result = name;
      score = next;
    }
  }
  // Hysteresis prevents boundary jitter from alternating instruments.
  if (
    MUSIC_REGIONS[previous] &&
    regionDistance(position, MUSIC_REGIONS[previous]) < score * 1.3
  )
    return previous;
  return result;
}
export function chooseNote(normalized, time, expression = {}) {
  const [x, y, z] = normalized;
  const region = expression.region || musicalRegion(normalized);
  const shape = MUSIC_REGIONS[region];
  const step = expression.step || 0;
  const direction = expression.direction < 0 ? -1 : 1;
  const index =
    (((step * direction) % shape.phrase.length) + shape.phrase.length) %
    shape.phrase.length;
  const noise = fieldNoise(x * 4, y * 4, z * 3 + time * 0.12);
  const varied = (expression.random ?? 1) < MUSIC_CONFIG.variation;
  // Variation stays inside the vocabulary: no chromatic random-note scatter.
  const choice = Math.max(
    0,
    Math.min(0.999999, expression.colorRandom ?? noise),
  );
  const leap =
    MUSIC_CONFIG.variationSteps[
      Math.floor(choice * MUSIC_CONFIG.variationSteps.length)
    ];
  const degree = Math.max(
    -7,
    Math.min(
      14,
      shape.phrase[index] + (varied ? leap * (noise > 0.5 ? 1 : -1) : 0),
    ),
  );
  const intensity = Math.max(0, Math.min(1, expression.intensity ?? 0));
  const glitch =
    (expression.glitchRandom ?? 1) <
    MUSIC_CONFIG.glitchProbability * (0.3 + intensity * 0.7);
  const midi =
    MUSIC_CONFIG.tonicMidi +
    shape.octave * 12 +
    PITCH_SET[(degree + 7) % 7] +
    Math.floor(degree / 7) * 12;
  const pitchClass = (degree + 7) % 7;
  const tuningCents =
    (1200 * Math.log2(TUNING_RATIOS[pitchClass]) -
      PITCH_SET[pitchClass] * 100) *
    MUSIC_CONFIG.microtonalBlend;
  return {
    region,
    voice: shape.voice,
    midi,
    glitch,
    grainDuration: 0.035 + choice * 0.065,
    tuningCents,
    ornamentCents: varied
      ? MUSIC_CONFIG.ornamentCents * (0.65 + noise * 0.35) * direction
      : 0,
    varied,
    frequency: 440 * 2 ** ((midi - 69 + tuningCents / 100) / 12),
    detune: (noise - 0.5) * 7,
    brightness: 0.7 + noise * 0.3,
    pan: Math.max(
      -0.75,
      Math.min(0.75, (x - 0.5) * 1.2 + (noise - 0.5) * 0.12),
    ),
  };
}

/**
 * Synthesizes a deterministic white noise buffer using a linear congruential generator (LCG).
 */
export function createNoiseBuffer(
  context,
  durationSeconds = 1,
  initialSeed = 1789,
) {
  const length = Math.floor(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = initialSeed;

  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    data[i] = (seed >>> 0) / 2147483648 - 1;
  }

  return buffer;
}

/**
 * Extracts bass (<600Hz), mid (600Hz-2200Hz), and high (2200Hz-7000Hz) frequency bands
 * from analyser FFT bin data.
 */
export function computeFrequencyBands(
  bins,
  sampleRate,
  fftSize,
  outBands = [0, 0, 0],
) {
  let bass = 0;
  let mid = 0;
  let high = 0;

  for (let i = 1; i < bins.length; i++) {
    const hz = (i * sampleRate) / fftSize;
    const level = bins[i] / 255;
    if (hz < 600) bass = Math.max(bass, level);
    else if (hz < 2200) mid = Math.max(mid, level);
    else if (hz < 7000) high = Math.max(high, level);
  }

  outBands[0] = bass;
  outBands[1] = mid;
  outBands[2] = high;
  return outBands;
}

/**
 * Applies three short amplitude cuts with linear ramps to emulate a digital glitch
 * without uncontrolled loud clicks.
 */
export function applyGlitchGate(gate, time) {
  gate.gain.setValueAtTime(1, time);
  for (let i = 0; i < 3; i++) {
    const cut = time + 0.025 + i * 0.037;
    gate.gain.setValueAtTime(1, cut);
    gate.gain.linearRampToValueAtTime(0.08, cut + 0.003);
    gate.gain.setValueAtTime(0.08, cut + 0.013);
    gate.gain.linearRampToValueAtTime(1, cut + 0.017);
  }
}
