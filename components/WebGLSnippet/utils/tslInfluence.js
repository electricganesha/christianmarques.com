import {
  float,
  vec2,
  vec3,
  max,
  smoothstep,
  step,
  dot,
  pow,
  exp,
  sin,
  distance,
  mix,
  clamp,
  fract,
} from "three/tsl";
import { snoise } from "./tslNoise";
import { FIELD_MOTION } from "./fieldMotion";

/**
 * Calculates audio pulse, music path, and spectral band resonance influence.
 */
export function computeMusicInfluence(pos, uniforms) {
  let pulse = float(0.0);
  for (let i = 0; i < 8; i++) {
    const pItem = uniforms.uNotePulse.element(i);
    const age = max(float(0.0), uniforms.time.sub(pItem.w));
    const delta = pos.sub(pItem.xyz);
    const pulseContribution = exp(
      dot(delta, delta).mul(-32.0).sub(age.mul(4.0)),
    ).mul(uniforms.uNoteStrength.element(i));
    pulse = max(pulse, pulseContribution);
  }

  let path = float(0.0);
  for (let i = 0; i < 24; i++) {
    const mItem = uniforms.uMusicPath.element(i);
    const delta = pos.sub(mItem.xyz);
    const pathContribution = exp(dot(delta, delta).mul(-45.0))
      .mul(mItem.w)
      .mul(step(float(i + 0.5), uniforms.uMusicPathCount));
    path = max(path, pathContribution);
  }

  const height = clamp(pos.y.mul(0.5).add(0.5), 0.0, 1.0);
  const resonance = uniforms.uAudioBands.x
    .mul(float(1.0).sub(smoothstep(0.1, 0.5, height)))
    .add(
      uniforms.uAudioBands.y
        .mul(exp(pow(height.sub(0.5).mul(4.0), float(2.0)).negate()))
        .mul(0.5),
    )
    .add(uniforms.uAudioBands.z.mul(smoothstep(0.65, 1.0, height)).mul(0.35));

  const musicRaw = vec2(
    max(pulse, path.mul(0.75)),
    pulse.mul(0.7).add(resonance.mul(0.3)),
  );

  return mix(vec2(0.0), musicRaw, step(float(0.5), uniforms.uAudioEnabled));
}

/**
 * Calculates pointer falloff and trail fade influences.
 */
export function computePointerAndTrailInfluence(
  pos,
  uniforms,
  fieldInfluence = float(0.0),
) {
  const pointerDelta = pos.sub(uniforms.uMousePos).div(uniforms.uRadius);
  const surfaceInfluence = exp(dot(pointerDelta, pointerDelta).mul(-2.5)).mul(
    uniforms.uActivity,
  );
  const influence = max(surfaceInfluence, fieldInfluence);

  let trace = float(0.0);
  for (let i = 0; i < 6; i++) {
    const tItem = uniforms.uTrail.element(i);
    const age = max(float(0.0), uniforms.time.sub(tItem.w));
    const delta = pos
      .sub(tItem.xyz)
      .div(uniforms.uTrailDuration ? uniforms.uRadius : uniforms.uRadius);
    const traceContribution = exp(
      dot(delta, delta).mul(-3.0).sub(age.div(uniforms.uTrailDuration)),
    );
    trace = max(trace, traceContribution);
  }
  trace = trace.mul(uniforms.uMotion);

  return { influence, trace };
}

/**
 * Calculates landmark coherence core and topology reveal factors.
 */
export function computeCoherenceAndTopology(
  aSeed,
  uniforms,
  reveal,
  fieldCircle,
) {
  const threshold = fract(aSeed.mul(13.37));
  const coherentFraction = mix(
    float(0.1),
    uniforms.uCoreFraction,
    smoothstep(0.2, 0.86, reveal),
  );
  const core = float(1.0)
    .sub(
      smoothstep(
        coherentFraction.sub(0.05),
        coherentFraction.add(0.05),
        threshold,
      ),
    )
    .mul(smoothstep(0.04, 0.3, reveal));

  let topology = mix(
    smoothstep(
      threshold.mul(0.72),
      float(0.18).add(threshold.mul(0.8)),
      reveal,
    ),
    mix(float(0.998), float(1.0), reveal),
    core,
  );
  topology = topology.mul(
    uniforms.uLoad.mul(smoothstep(0.0, 0.25, reveal)),
  );

  return { core, topology, threshold };
}

/**
 * Calculates surface breath, ripple, and pulse displacements.
 */
export function computeDisplacement(pos, norm, uniforms, influence, music) {
  const breath = snoise(
    pos.mul(2.4).add(vec3(0.0, uniforms.time.mul(0.17), 0.0)),
  );
  const ripple = sin(
    distance(pos, uniforms.uMousePos).mul(12.0).sub(uniforms.time.mul(2.0)),
  );
  const pulseAge = max(float(0.0), uniforms.time.sub(uniforms.uPulseStart));
  const waveFront = distance(pos, uniforms.uPulseOrigin).sub(
    pulseAge.mul(uniforms.uRippleSpeed),
  );
  const surfacePulse = exp(
    waveFront.mul(waveFront).mul(-100.0).sub(pulseAge.mul(0.75)),
  ).mul(sin(waveFront.mul(24.0)));

  const surfaceDisp = uniforms.uDisplacement
    .mul(
      breath
        .mul(0.12)
        .mul(uniforms.uMotion)
        .add(
          influence.mul(
            float(0.45).add(ripple.mul(0.16).mul(uniforms.uMotion)),
          ),
        ),
    )
    .add(
      surfacePulse
        .mul(uniforms.uRippleStrength)
        .mul(uniforms.uMotion)
        .mul(float(0.4).add(uniforms.uHold.mul(0.6))),
    )
    .add(music.y.mul(0.016));

  return pos.add(norm.mul(surfaceDisp));
}

/**
 * Computes background abstract field coordinates based on FIELD_MOTION.
 */
export function computeFieldPosition(aField, uniforms) {
  const fieldXY = aField.xy
    .mul(uniforms.uFieldExtent)
    .add(
      vec2(
        sin(
          aField.x
            .mul(FIELD_MOTION.x[0])
            .add(aField.y.mul(FIELD_MOTION.x[1]))
            .add(uniforms.time.mul(FIELD_MOTION.x[2])),
        ),
        sin(
          aField.x
            .mul(FIELD_MOTION.y[0])
            .add(aField.y.mul(FIELD_MOTION.y[1]))
            .add(FIELD_MOTION.phase)
            .add(uniforms.time.mul(FIELD_MOTION.y[2])),
        ),
      ).mul(uniforms.uMotion.mul(FIELD_MOTION.amplitude)),
    );
  return vec3(fieldXY, aField.z.mul(0.8));
}
