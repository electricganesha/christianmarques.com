import {
  MUSIC_CONFIG as config,
  chooseNote,
  fieldNoise,
  musicalRegion,
  createNoiseBuffer,
  applyGlitchGate,
  computeFrequencyBands,
  OHM_CHOIR,
  PITCH_SET,
  TUNING_RATIOS,
} from "./topology";

export class ElectricGaneshaAudio {
  constructor(onEvent) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error("Web Audio is unavailable in this browser.");
    this.context = new Context({ latencyHint: "interactive" });
    this.onEvent = onEvent;
    this.enabled = false;
    this.active = true;
    this.disposed = false;
    this.voices = new Set();
    this.paths = [];
    this.recording = null;
    this.pending = [];
    this.lastSample = null;
    this.velocity = 0;
    this.travel = 0;
    this.phraseStep = 0;
    this.region = null;
    this.lastMelody = null;
    this.lastLiveNote = -100;
    this.output = this.context.createGain();
    this.output.gain.value = config.masterVolume;
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.ratio.value = 6;
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.bins = new Uint8Array(this.analyser.frequencyBinCount);
    this.bands = [0, 0, 0];
    this.bus = this.context.createGain();
    this.bus.connect(this.compressor);
    this.compressor.connect(this.output);
    this.output.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    // Bounded, dark feedback delay: atmosphere without a permanent drone.
    this.delay = this.context.createDelay(1);
    this.delay.delayTime.value = config.beatSeconds * 1.5;
    this.feedback = this.context.createGain();
    this.feedback.gain.value = 0.15;
    this.delayFilter = this.context.createBiquadFilter();
    this.delayFilter.type = "lowpass";
    this.delayFilter.frequency.value = 2400;
    this.wet = this.context.createGain();
    this.wet.gain.value = 0.1;
    this.bus.connect(this.delay);
    this.delay.connect(this.delayFilter);
    this.delayFilter.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delayFilter.connect(this.wet);
    this.wet.connect(this.compressor);
    this.noise = createNoiseBuffer(this.context);
  }
  async enable() {
    await this.context.resume();
    if (this.disposed) return;
    if (this.context.state !== "running")
      throw new Error("Tap Enable sound again to start audio.");
    this.enabled = true;
  }
  setActive(active) {
    if (active === this.active || this.disposed) return;
    this.active = active;
    if (!active) {
      this.cancelPath();
      this.paths = [];
      this.pending = [];
      this.lastSample = null;
      for (const voice of this.voices) voice.stop();
      this.output.gain.cancelScheduledValues(this.context.currentTime);
      this.output.gain.setTargetAtTime(0, this.context.currentTime, 0.025);
    } else {
      this.output.gain.setTargetAtTime(
        config.masterVolume,
        this.context.currentTime,
        0.04
      );
    }
  }
  beginPath() {
    if (this.enabled && this.active) this.recording = [];
  }
  cancelPath() {
    this.recording = null;
  }
  endPath() {
    const points = this.recording;
    this.recording = null;
    if (!points || points.length < 3 || !this.enabled || !this.active) return;
    const now = this.context.currentTime;
    this.paths.push({
      points,
      born: now,
      expires: now + config.pathLifetime,
      next: now + config.beatSeconds,
      index: 0,
      cycle: 0,
    });
    if (this.paths.length > config.maxPaths) this.paths.shift();
  }
  interact(sample) {
    if (!this.enabled || !this.active || this.disposed) return;
    const now = this.context.currentTime;
    const previous = this.lastSample;
    const active = sample.intensity > 0.1;
    const moving = active && sample.moving;
    const region = musicalRegion(sample.normalizedPosition, this.region);
    const distance =
      previous && active && previous.intensity > 0.1
        ? Math.hypot(
            ...sample.normalizedPosition.map(
              (v, i) => v - previous.normalizedPosition[i]
            )
          )
        : 0;
    const dt = Math.max(0.016, now - (previous?.time ?? now));
    this.velocity +=
      ((moving ? Math.min(1, distance / dt / 0.8) : 0) - this.velocity) * 0.45;
    if (moving) this.travel += Math.min(distance, 0.15);
    else this.travel = 0;
    const entering = moving && (!previous || previous.intensity <= 0.1);
    const pressing = active && sample.pressed && !previous?.pressed;
    const crossing =
      moving &&
      (region !== this.region ||
        sample.source !== previous?.source ||
        (sample.source === "field" &&
          sample.particleId !== previous?.particleId));
    const stroke = moving && this.travel >= config.gestureSpacing;
    const direction =
      previous && sample.normalizedPosition[1] < previous.normalizedPosition[1]
        ? -1
        : 1;
    const voicedSample = {
      ...sample,
      region,
      direction,
      step: this.phraseStep,
    };
    if (
      (entering || pressing || crossing || stroke) &&
      now - this.lastLiveNote >=
        (sample.source === "field"
          ? config.fieldNoteInterval
          : config.minimumInterval)
    ) {
      // Quantize pitch, not onset: every deliberate articulation sounds immediately.
      this.play(voicedSample, now + 0.008, Math.max(0.25, this.velocity));
      this.lastLiveNote = now;
      this.phraseStep++;
      this.travel = 0;
      this.region = region;
    }
    this.lastSample = { ...sample, time: now };
    if (
      this.recording &&
      sample.source !== "field" &&
      sample.intensity > 0.15 &&
      this.recording.length < config.maxPathPoints
    ) {
      const previous = this.recording[this.recording.length - 1];
      if (
        !previous ||
        Math.hypot(...sample.position.map((v, i) => v - previous.position[i])) >
          0.1
      ) {
        this.recording.push({
          ...voicedSample,
          position: [...sample.position],
          normalizedPosition: [...sample.normalizedPosition],
        });
      }
    }
  }
  play(sample, time, strength, mutation = 0) {
    if (this.voices.size >= config.maxVoices || this.disposed) return;
    const isField = sample.source === "field";
    let note;
    if (isField) {
      const choirIndex = Math.abs(
        sample.particleId != null
          ? sample.particleId * 7 + 1
          : Math.floor(Math.random() * 6)
      ) % OHM_CHOIR.length;
      const voiceDef = OHM_CHOIR[choirIndex];
      const tonicFreq = 440 * 2 ** ((config.tonicMidi - 69) / 12);
      const ratio =
        TUNING_RATIOS[PITCH_SET.indexOf(PITCH_SET[voiceDef.degree])] *
        2 ** voiceDef.octaveShift;
      const freq = tonicFreq * ratio;
      const midi =
        config.tonicMidi +
        voiceDef.octaveShift * 12 +
        PITCH_SET[voiceDef.degree];

      note = {
        region: "field",
        voice: "field",
        glitch: false,
        ornamentCents: 0,
        midi,
        frequency: freq,
        detune: 0,
        brightness: 0.8,
        formant: voiceDef.formant,
        pan: Math.max(
          -0.75,
          Math.min(0.75, (sample.normalizedPosition?.[0] ?? 0.5) * 1.5 - 0.75)
        ),
      };
    } else {
      note = chooseNote(sample.normalizedPosition, time, {
        region: sample.region,
        step: (sample.step || 0) + mutation,
        direction: sample.direction,
        random: Math.random(),
        colorRandom: Math.random(),
        glitchRandom: Math.random(),
        intensity: strength,
      });
    }
    const ctx = this.context;
    const melodic = note.voice === "pluck" || note.voice === "resonance";
    const previousMelody = this.lastMelody;
    if (melodic) this.lastMelody = { frequency: note.frequency, time };
    const envelope = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.pan.value = note.pan;
    const gate = ctx.createGain();
    envelope.connect(gate);
    gate.connect(pan);
    pan.connect(this.bus);
    const sources = [],
      nodes = [envelope, gate, pan];
    const duration = isField
      ? 1.8
      : note.voice === "drone"
      ? 2.4
      : note.voice === "noise"
      ? 0.75
      : 1.6;
    const peak =
      Math.min(0.24, 0.08 + strength * 0.14) *
      (isField ? config.fieldNoteVolume : 1);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(
      peak,
      time + (isField ? 0.12 : duration > 2 ? 0.16 : 0.012)
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    const oscillator = (frequency, amplitude = 1, detune = note.detune) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      // Keep every harmonic aligned during continuous, microtonal pitch bends.
      const partial = frequency / note.frequency;
      if (
        melodic &&
        previousMelody &&
        time - previousMelody.time < 0.75 &&
        Math.abs(Math.log2(note.frequency / previousMelody.frequency)) < 0.6
      ) {
        osc.frequency.setValueAtTime(previousMelody.frequency * partial, time);
        osc.frequency.exponentialRampToValueAtTime(
          frequency,
          time + config.glideSeconds * (1.2 - strength * 0.5)
        );
      } else osc.frequency.value = frequency;
      osc.detune.setValueAtTime(
        detune + (melodic ? note.ornamentCents : 0),
        time
      );
      if (melodic && note.ornamentCents) {
        osc.detune.linearRampToValueAtTime(detune, time + 0.11);
        osc.detune.linearRampToValueAtTime(
          detune - note.ornamentCents * 0.25,
          time + 0.28
        );
        osc.detune.linearRampToValueAtTime(detune, time + 0.48);
      }
      const gain = ctx.createGain();
      gain.gain.value = amplitude;
      osc.connect(gain);
      gain.connect(envelope);
      sources.push(osc);
      nodes.push(osc, gain);
      return osc;
    };
    if (isField) {
      // Ohm Choir: warm vocal chant with twin detuned fundamental sines, chest sub, and vowel formant filtering
      oscillator(note.frequency, 0.65, -1.8);
      oscillator(note.frequency, 0.65, 1.8);
      oscillator(note.frequency * 0.5, 0.35); // sub-octave chest resonance
      oscillator(note.frequency * 2, 0.16);   // throat overtone
      oscillator(note.frequency * 3, 0.08);   // singing bowl harmonic

      // Vocal vowel formant filter: sculpts the raw oscillators into a resonant 'Ohm' vocal hum
      const formantFilter = ctx.createBiquadFilter();
      formantFilter.type = "bandpass";
      formantFilter.frequency.setValueAtTime(note.formant || 550, time);
      formantFilter.Q.setValueAtTime(1.6, time);

      const formantGain = ctx.createGain();
      formantGain.gain.value = 0.45;
      envelope.connect(formantFilter);
      formantFilter.connect(formantGain);
      formantGain.connect(gate);
      nodes.push(formantFilter, formantGain);
    } else if (note.voice === "noise") {
      // Soft melodic air/flute tone instead of harsh static noise
      oscillator(note.frequency, 0.55);
      oscillator(note.frequency * 2, 0.1);
    } else if (note.voice === "drone") {
      oscillator(note.frequency, 0.5, -3);
      oscillator(note.frequency, 0.5, 3);
      oscillator(note.frequency * 2, 0.14);
      oscillator(note.frequency * 3, 0.07);
    } else if (note.voice === "resonance") {
      oscillator(note.frequency, 0.7);
      oscillator(note.frequency * 2, 0.12);
    } else if (note.voice === "bell") {
      oscillator(note.frequency, 0.6);
      oscillator(note.frequency * 2.71, 0.18);
      oscillator(note.frequency * 4.07, 0.07);
    } else {
      const carrier = oscillator(note.frequency, 0.62);
      // A quiet octave resonance gives the pluck a string-like body.
      oscillator(note.frequency * 2, 0.1);
      const modulator = ctx.createOscillator();
      modulator.frequency.value = note.frequency * 2;
      const index = ctx.createGain();
      // Gentle, clean harmonic brightness rather than harsh metallic distortion
      index.gain.setValueAtTime(
        note.frequency * (0.12 + note.brightness * 0.18) * (0.35 + strength * 0.35),
        time
      );
      index.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
      modulator.connect(index);
      index.connect(carrier.frequency);
      sources.push(modulator);
      nodes.push(modulator, index);
    }
    const voice = {
      stop: () => {
        for (const source of sources) {
          try {
            source.stop();
          } catch {
            /* already ended */
          }
        }
      },
    };
    this.voices.add(voice);
    let remaining = sources.length;
    for (const source of sources) {
      source.onended = () => {
        if (--remaining === 0) {
          nodes.forEach((node) => node.disconnect());
          this.voices.delete(voice);
        }
      };
      source.start(time);
      source.stop(time + duration + 0.02);
    }
    this.pending.push({
      time,
      position: [...sample.position],
      source: sample.source,
      strength,
      region: note.region,
      midi: note.midi,
      varied: note.varied,
    });
    this.pending.sort((a, b) => a.time - b.time);
    if (this.pending.length > 32) this.pending.shift();
  }
  tick() {
    if (
      !this.enabled ||
      !this.active ||
      this.disposed ||
      this.context.state !== "running"
    )
      return this.bands.fill(0);
    const now = this.context.currentTime;
    for (const path of this.paths) {
      if (now >= path.expires || now + 0.05 < path.next) continue;
      const point = path.points[path.index];
      const life = Math.max(0, (path.expires - now) / config.pathLifetime);
      const omit = fieldNoise(path.index, path.cycle, now * 0.1) > 0.85;
      if (!omit)
        this.play(
          point,
          Math.max(now + 0.01, path.next),
          life * 0.6,
          path.cycle
        );
      path.index = (path.index + 1) % path.points.length;
      if (path.index === 0) path.cycle++;
      path.next = Math.max(now + 0.01, path.next) + config.beatSeconds * 2;
    }
    for (let i = this.paths.length - 1; i >= 0; i--) {
      if (now >= this.paths[i].expires) this.paths.splice(i, 1);
    }
    const stamp = this.context.getOutputTimestamp?.();
    const audibleNow =
      stamp?.contextTime > 0
        ? stamp.contextTime
        : now - (this.context.baseLatency || 0);
    while (this.pending.length && this.pending[0].time <= audibleNow)
      this.onEvent(this.pending.shift());
    this.analyser.getByteFrequencyData(this.bins);
    computeFrequencyBands(
      this.bins,
      this.context.sampleRate,
      this.analyser.fftSize,
      this.bands
    );
    return this.bands;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.enabled = false;
    this.paths = [];
    this.pending = [];
    this.recording = null;
    this.output.gain.setTargetAtTime(0, this.context.currentTime, 0.015);
    // Let the master fade before disconnecting oscillators and the feedback loop.
    setTimeout(() => {
      for (const voice of this.voices) voice.stop();
      this.voices.clear();
      [
        this.bus,
        this.delay,
        this.feedback,
        this.delayFilter,
        this.wet,
        this.compressor,
        this.output,
        this.analyser,
      ].forEach((node) => node.disconnect());
      this.context.close().catch(() => {});
    }, 60);
  }
}
