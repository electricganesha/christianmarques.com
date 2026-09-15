# Electric Ganesha — musical interaction

Sound is off until the visitor clicks **Enable sound**. Enabling creates/resumes a
native Web Audio context inside that gesture; there are no audio samples to fetch,
no autoplay, no permission prompt, and no saved opt-in across reloads. **Mute sound**
fades the master and closes the context. Enabling again creates one fresh context.
The control is visible only while at least 20% of the hero is in view. Leaving the
hero, hiding the tab or blurring the window clears sequences and stops voices.
Unmounting/WebGL failure also disposes the engine.

## Musical behavior

The vocabulary is Yaman-inspired: Sa Re Ga tivra-Ma Pa Dha Ni, with distinct
regional phrase contours extending below/above octave boundaries. It is an
interactive interpretation, not a traditional raga performance. Microtonal centers
use the adjustable ratio palette `[1, 9/8, 5/4, 45/32, 3/2, 5/3, 15/8]`; these are
artistic tuning choices, not a claim of universal Indian intonation. Set
`microtonalBlend` to zero for equal temperament, one for the full ratio palette.
Melodic notes can glide continuously from a preceding note and make small grace
inflections, settling back to their tuned center. Harmonic partials bend together.

Actual GLB ray hits are transformed to normalized 3D model coordinates. Ellipsoids
in `MUSIC_REGIONS` classify crown, head, trunk, ears, hands, belly and base, with
boundary hysteresis. These are approximate anatomical zones, not semantic mesh
labels. Empty space has zero audio intensity. Crown/hands use bell resonances,
head has a clear harmonic voice, trunk uses a string-like FM pluck, ears use pitched
filtered noise, and belly/base have short low resonances.

Entering a surface, crossing a region, travelling a configurable distance, or
pressing deliberately articulates a note directly (8ms scheduling lead plus the
66ms interaction sampling interval and hardware latency). There is no periodic
probability gate on live gestures. Actual pointer movement gates travel so idle
rotation and smoothing cannot keep generating notes. Stillness schedules no new
notes, even during a stationary hold; existing envelopes decay.

A 70/30 choice keeps the expected phrase degree or varies it through a neighbouring, wider or octave leap
inside the vocabulary. Coherent noise shapes the direction, timbre and subtle
inflection; fresh random draws provide non-repeating variation. This is a
probability, not a promise of exactly three variants in every ten notes.

Press and drag over the sculpture, then release: up to eight sampled regions form
a temporary sequence. It replays for eight seconds, with note omissions and modest
pitch mutations between repetitions. Up to three paths coexist. A simple click
or hold without traversing at least three regions creates no loop. Pointer cancel,
scroll, blur, or entering HTML/debug controls cancels the unfinished path, preserving
mobile scrolling. Completed paths expire without leaving a scheduler behind.

## Audio and visual coupling

A frame-driven scheduler places events on the Web Audio clock with a short lookahead;
no catch-up burst occurs after a stalled/hidden frame. Notes have attack/release
envelopes, capped gain, stereo panning, a bounded filtered delay, and a compressor.
Maximum polyphony is twelve voices, with at most five sources per voice including a glitch grain. Sources
and their graph nodes disconnect on completion. Noise uses a reusable generated
buffer; musical variation draws randomness once per note, never per particle or audio sample.

Scheduled note events wait for `getOutputTimestamp()` (or an estimated output
latency fallback) before updating particle pulse uniforms. An analyser supplies
low/mid/high energy bands, gently displacing the corresponding vertical regions.
Recorded paths remain as locally revealed black stippling, and notes briefly
increase disc size/readability. Nothing glows or changes color. Reduced motion
keeps sound available but disables music-driven particle movement/reveal pulses.
Device audio latency may affect exact audiovisual alignment.

## Files and tuning

- `components/WebGLSnippet/audio/topology.js`: pitch set, region rules, coherent
  noise and `MUSIC_CONFIG` (volume, tonic, beat duration, polyphony, path limits).
- `components/WebGLSnippet/audio/ElectricGaneshaAudio.js`: opt-in context lifecycle,
  synthesis, scheduling, path recording/replay, analyser and cleanup.
- `components/WebGLSnippet/SoundControl.jsx` and `.module.scss`: small opt-in/mute
  control and discoverability hint.
- `components/WebGLSnippet/index.js`: reuses the existing smoothed model-space
  interaction, pointer lifecycle, animation loop and visibility observer.
- `components/WebGLSnippet/ganeshaMaterial.js`: bounded pulse/path loops and
  region-weighted audio response in the active TSL vertex shader.

No additional package, draw call, per-particle React component, or CPU particle
animation was added. At most 24 path points and 8 recent notes are shader uniforms.
Audio-disabled rendering zeros the audio response. Decoded geometry/ink
sampling is unchanged. The debug panel continues to tune visual parameters; musical
parameters currently live in `MUSIC_CONFIG`.

## Validation

- `node scripts/test-ganesha-music.mjs`: deterministic/coherent noise, pitch set,
  regional register, bounded detuning and stereo position.
- `scripts/test-ganesha-audio-browser.cjs`: no context before opt-in, actual nonzero
  bounded waveform output, gesture synthesis, drag path creation/replay/expiry,
  GPU note pulses, context closure on mute, re-enable and offscreen silence.
- Existing geometry and browser regression scripts retain their checks for sampling,
  responsive rendering, touch scroll, hold/release, inactivity and reduced motion.

Run browser tests with the same `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` and optional
`GANESHA_PREVIEW_URL` variables documented in `electric-ganesha.md`. Browser tests
verify signal generation and behavior, not subjective sound quality or physical
mobile audio latency. Real Safari/iOS and headphone listening remain unverified.

Implementation references: [Web Audio user-gesture guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices),
[frequency analysis](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData).

Additional tuning in `MUSIC_CONFIG`: `variation`, `gestureSpacing`,
`minimumInterval`, `microtonalBlend`, `ornamentCents`, and `glideSeconds`.
Edit `MUSIC_REGIONS` centers/radii, octave and phrase degree arrays to change each
region. Phrase degree -1 means the lower Ni; 7 is the next Sa. Pitch centers span
several octaves; slides and inflections move continuously between them.

Musical references: [Yaman/Kalyan vocabulary](https://raag-hindustani.com/Scales3.html),
[phrase ornamentation and meend](https://raag-hindustani.com/Embellishment.html).

### Wider variation and glitch texture

The 30% variation branch now selects leaps of 1, 2, 4 or 7 scale degrees, bounded
to the regional octave and its neighbours. Microtonal tuning remains intact.
`variationSteps` controls these intervals. `glitchProbability` (0.32 at maximum
gesture intensity, lower for gentle strokes) introduces three short amplitude cuts
and a filtered 35–100ms noise grain. `noiseAmount` controls grain level. Both are
part of the same capped voice and its existing cleanup; no autonomous glitch loop
runs at rest. A glitch adds one buffer source (up to five sources per voice).

### Expanded musical anatomy

There are now 18 zones: crown, head, trunk, trunk tip, left/right eyes, tusks, ears,
hands, arms and feet, plus belly and base. Left/right refer to the camera view.
Small-zone depths were checked against front-facing GLB ray hits. These remain
artistic anatomical approximations, not semantic segmentation of the mesh.
Each region has its own phrase and register, with 29 distinct phrase pitches
before randomized leaps and continuous microtonal ornaments. Left/right regions
use complementary phrases rather than sharing one sequence. The seven-degree
Yaman-inspired vocabulary remains shared across octaves for musical coherence.

`MUSIC_REGIONS.voice` separates anatomy from timbre: `pluck`, `resonance`, `bell`,
`noise`, or `drone`. New regions therefore reuse the bounded synthesis engine,
voice limit, note scheduling and cleanup. Run `node scripts/test-ganesha-regions.mjs`
to verify every zone can be reached on actual front-facing model geometry.

### Playable background field

Hovering the sparse abstract circles now increases their size and gently displaces
them away from the pointer ray. This runs in TSL in the same particle draw call.
`fieldHoverRadius` and `fieldHoverSize` are adjustable in #debug → Interaction.
The small field population is cached on resize/rebuild; at 15Hz the CPU checks
ray distance to those anchors, not all sculpture particles. CPU picking and TSL share `FIELD_MOTION` coefficients for drifting positions and
hover displacement. Large field circles stay in world space instead of partially
morphing toward their unrelated surface samples.

With sound enabled, entering a field circle or moving to another circle articulates
a note from the existing spatial pitch vocabulary. Field circles take priority while the sculpture is still hidden (reveal below
0.45); revealed sculpture hits take priority where the large field circles fade.
Field notes pulse their world-space circle, without activating model-space audio
pulses or entering the sculpture's drag paths. A stationary cursor plays no new
notes; UI controls, scrolling and audio lifecycle keep their existing behavior.
Reduced motion disables displacement and limits the hover size response.

`node scripts/test-ganesha-field-browser.cjs` verifies a real circle outside the
sculpture on WebGPU, sound opt-in, field note feedback, stationary silence and
navigation exclusion.

### Resting field instrument

The floating circles drift slowly around their own resting positions. A local
repulsion pushes nearby circles away from the pointer, then relaxes back as the
pointer moves away; distant circles continue their idle drift. There is no global
mouse-follow translation. `fieldRepelStrength` and `fieldHoverRadius` tune the
repulsion in the hidden debugger; size growth is deliberately small. This works
without enabling audio or revealing Ganesha. CPU picking and TSL use the same
rest positions and repulsion math.

Field sound is a separate minimal voice: two sine partials, a 0.55s decay, 45% of
the sculpture note gain and at most one articulation every 0.35s. It uses the
microtonal melodic vocabulary but adds neither a drone nor glitch bursts.
`MUSIC_CONFIG.fieldNoteVolume` and `fieldNoteInterval` control that restraint.
Sound remains opt-in and a still cursor schedules no new notes.
