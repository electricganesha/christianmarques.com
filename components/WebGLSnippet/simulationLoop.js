import * as THREE from "three/webgpu";
import { updateFieldPosition } from "./utils/fieldMotion";

/**
 * Coordinates the per-frame simulation loop: delta timing, rotation easing,
 * raycasting, field repulsion, gesture accumulators, audio synchronization,
 * uniform updates, and multi-pass rendering.
 */
export class SimulationLoop {
  constructor({
    ganeshaScene,
    interaction,
    configRef,
    audioRef,
    audioEventRef,
    previewRef,
    onInteractionRef,
  }) {
    this.scene = ganeshaScene;
    this.interaction = interaction;
    this.configRef = configRef;
    this.audioRef = audioRef;
    this.previewRef = previewRef;
    this.onInteractionRef = onInteractionRef;

    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.animationFrameId = null;
    this.isRunning = false;

    // Raycasting and hit caches
    this.raycaster = new THREE.Raycaster();
    this.hits = [];
    this.localHit = new THREE.Vector3();
    this.audioHit = new THREE.Vector3();
    this.hasAudioHit = false;
    this.normalized = new THREE.Vector3();
    this.fieldRayOffset = new THREE.Vector3();
    this.pointerPath = [];
    this.trailRay = new THREE.Ray();
    this.trailTarget = new THREE.Vector3();
    this.fieldHit = null;
    this.fieldNoteCount = 0;
    this.totalCoverage = 0;

    // Gesture & state variables
    this.targetDepth = this.configRef.current.depth;
    this.smoothDepth = this.configRef.current.depth;
    this.interactionWeight = 0;
    this.surfaceActive = false;
    this.hoverIntent = 0;
    this.trailIndex = 0;
    this.lastTrailTime = -100;
    this.lastPulseTime = -100;
    this.lastTrailPoint = new THREE.Vector3(100, 100, 100);
    this.lastRaycast = -100;
    this.lastAudioSample = -100;
    this.noteIndex = 0;

    this.dimensions = new THREE.Vector3();
    this.scene.surface.boundingBox.getSize(this.dimensions);
    this.neutralPlane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      -this.configRef.current.depth,
    );

    // Wire audio event receiver to update visual note uniforms
    audioEventRef.current = (event) => {
      const uniforms = this.scene.uniforms;
      if (!uniforms) return;
      if (event.source === "field") {
        uniforms.uFieldNote.value.set(...event.position, this.elapsed);
        this.fieldNoteCount++;
        return;
      }
      uniforms.uNotePulse.value[this.noteIndex].set(
        ...event.position,
        this.elapsed,
      );
      uniforms.uNoteStrength.value[this.noteIndex] = event.strength;
      this.noteIndex = (this.noteIndex + 1) % 8;
    };
  }

  getSnapshotExtra() {
    return {
      fieldHit: this.fieldHit,
      hasAudioHit: this.hasAudioHit,
      fieldNoteCount: this.fieldNoteCount,
    };
  }

  tick = () => {
    if (!this.isRunning) {
      this.animationFrameId = null;
      return;
    }

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;
    const damping = 1 - Math.exp(-dt * 3.5);
    const config = this.configRef.current;
    const { uniforms, particles, hitSurface } = this.scene;
    const { interaction } = this;
    const reducedMotion = interaction.reducedMotion;

    if (
      interaction.touch &&
      !interaction.pressed &&
      this.elapsed - interaction.lastPointerTime > 1.2
    ) {
      interaction.leave();
    }

    if (interaction.pulseRequested) {
      interaction.pulseRequested = false;
      this.lastPulseTime = -100;
    }

    uniforms.time.value = reducedMotion ? 0 : this.elapsed;
    uniforms.uLoad.value = reducedMotion
      ? 1
      : Math.min(1, uniforms.uLoad.value + dt * 0.5);

    // 1. Rotation & orientation
    this.updateRotation(dt, damping, reducedMotion, config);

    // 2. Pointer tracking & raycasting
    this.updateRaycasting(dt, reducedMotion, config);

    // 3. Depth following & surface activity
    this.updateDepthAndActivity(dt, damping, config);

    // 4. Audio synchronization & music paths
    this.updateAudioSync(reducedMotion);

    // 5. Gesture accumulators, hover intent, hold, pulse, trail & reveal easing
    this.updateGesturesAndReveal(dt, reducedMotion, config);

    // 6. Multi-pass render
    this.scene.render();

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  updateRotation(dt, damping, reducedMotion, config) {
    const { particles, hitSurface } = this.scene;
    const { interaction } = this;
    const rotate = reducedMotion ? 0.15 : 1;
    const idle = reducedMotion
      ? 0
      : Math.sin(this.elapsed * 0.16) * config.idleRotationStrength;

    particles.rotation.x = THREE.MathUtils.lerp(
      particles.rotation.x,
      config.rotationX -
        (interaction.pointerActive ? interaction.pointer.y : 0) *
          config.pointerRotationStrength *
          rotate,
      damping,
    );
    particles.rotation.y = THREE.MathUtils.lerp(
      particles.rotation.y,
      config.rotationY +
        (interaction.pointerActive ? interaction.pointer.x : 0) *
          config.pointerRotationStrength *
          rotate +
        idle,
      damping,
    );
    particles.rotation.z = config.rotationZ;
    particles.updateMatrixWorld();
    hitSurface.quaternion.copy(particles.quaternion);
    hitSurface.updateMatrixWorld();
  }

  updateRaycasting(dt, reducedMotion, config) {
    const { uniforms, camera, hitSurface, surface, fieldPoints, geometry } =
      this.scene;
    const { interaction, raycaster } = this;

    interaction.smoothPointer.lerp(
      interaction.pointer,
      1 - Math.exp(-dt * config.pointerSmoothing),
    );
    raycaster.setFromCamera(interaction.smoothPointer, camera);
    uniforms.uFieldRayOrigin.value.copy(raycaster.ray.origin);
    uniforms.uFieldRayDirection.value.copy(raycaster.ray.direction);

    uniforms.uFieldHover.value +=
      ((interaction.pointerActive ? (reducedMotion ? 0.25 : 1) : 0) -
        uniforms.uFieldHover.value) *
      (1 - Math.exp(-dt * 10));

    // Per-particle hover activation and smooth transit to Ganesha
    const attr = geometry?.attributes.aFieldState;
    const stillTime = this.elapsed - interaction.lastPointerTime;
    const moving = interaction.pointerActive && stillTime < 0.3;
    if (moving && !reducedMotion) {
      this.pointerPath.push({
        time: this.elapsed,
        origin: raycaster.ray.origin.clone(),
        direction: raycaster.ray.direction.clone(),
      });
      while (this.pointerPath.length > 2 && this.pointerPath[1].time < this.elapsed - 0.9) {
        this.pointerPath.shift();
      }
    } else {
      this.pointerPath.length = 0;
    }
    // Use a fresh surface hit for depositing; stale hover hits must not catch particles.
    const raycastDue = this.elapsed - this.lastRaycast >= config.raycastInterval;
    if (raycastDue) {
      this.lastRaycast = this.elapsed;
      this.hasAudioHit = false;
      if (interaction.pointerActive) {
        this.hits.length = 0;
        raycaster.intersectObject(hitSurface, false, this.hits);
        if (this.hits.length) {
          this.targetDepth = this.hits[0].point.z;
          this.audioHit.copy(this.hits[0].point);
          hitSurface.worldToLocal(this.audioHit);
          this.hasAudioHit = true;
        }
      }
    }
    const hoverRadiusSq = config.fieldHoverRadius ** 2;
    let totalProgress = 0;
    this.fieldHit = null;
    let closestField = hoverRadiusSq;

    if (fieldPoints && fieldPoints.length > 0) {
      for (const point of fieldPoints) {
        updateFieldPosition(
          point.position,
          point.field,
          uniforms.uFieldExtent.value,
          uniforms.time.value,
          uniforms.uMotion.value,
        );
        raycaster.ray.closestPointToPoint(point.position, this.fieldRayOffset);
        this.fieldRayOffset.subVectors(point.position, this.fieldRayOffset);
        const distSq = this.fieldRayOffset.lengthSq();

        // Exact per-particle hover detection
        const isHovered = interaction.pointerActive && distSq < hoverRadiusSq;
        const influence = isHovered
          ? Math.exp((-2.5 * distSq) / hoverRadiusSq)
          : 0;

        if (reducedMotion) {
          point.progress = 1;
          point.carried = false;
          point.carryOffset.set(0, 0, 0);
        } else {
          if (!point.deposited && !point.carried && moving && isHovered) {
            point.carried = true;
            point.pickedUpAt = this.elapsed;
          }
          if (point.carried && moving && raycastDue && this.hasAudioHit) {
            point.deposited = true;
            point.carried = false;
          }
          if (!moving) point.carried = false;

          if (point.deposited) {
            // Keep deposits while exploring, then disperse on idle as before.
            point.progress = moving
              ? Math.min(1, point.progress + dt * 2.2)
              : Math.max(0, point.progress - dt / config.releaseDuration);
            if (!moving) {
              point.carryOffset.multiplyScalar(Math.exp(-dt * 3));
              if (point.progress === 0) point.deposited = false;
            }
          } else {
            point.progress = 0;
            this.trailTarget.set(0, 0, 0);
            if (point.carried && this.pointerPath.length) {
              // Stagger particles along the actual cursor path, including turns.
              const spread = (point.id * 0.61803398875) % 1;
              // Never pull a newly caught particle back to a pre-pickup cursor position.
              const targetTime = Math.max(
                point.pickedUpAt,
                this.elapsed - (0.06 + spread * 0.45),
              );
              let before = this.pointerPath[0];
              let after = before;
              for (const sample of this.pointerPath) {
                after = sample;
                if (sample.time >= targetTime) break;
                before = sample;
              }
              const blend = THREE.MathUtils.clamp(
                (targetTime - before.time) / Math.max(0.0001, after.time - before.time),
                0, 1,
              );
              this.trailRay.origin.copy(before.origin).lerp(after.origin, blend);
              this.trailRay.direction.copy(before.direction).lerp(after.direction, blend).normalize();
              this.trailRay.closestPointToPoint(point.position, this.trailTarget);
              this.trailTarget.sub(point.position).multiplyScalar(0.97);
            }
            point.carryOffset.lerp(
              this.trailTarget,
              1 - Math.exp(-dt * (point.carried ? 7 : 3)),
            );
          }
        }
        totalProgress += point.progress;
        if (attr) {
          attr.setXYZW(
            point.id,
            point.carryOffset.x, point.carryOffset.y, point.carryOffset.z,
            point.progress,
          );
        }

        point.rendered
          .copy(point.position)
          .addScaledVector(point.carryOffset, 1 - point.progress)
          .addScaledVector(
            this.fieldRayOffset,
            -influence * uniforms.uFieldHover.value * 0.3 * uniforms.uMotion.value *
              (1 - THREE.MathUtils.smoothstep(point.carryOffset.length(), 0.015, 0.08)),
          );

        const distance = raycaster.ray.distanceSqToPoint(point.rendered);
        if (interaction.pointerActive && distance < closestField) {
          closestField = distance;
          this.fieldHit = point;
        }
      }

      if (attr) {
        attr.needsUpdate = true;
      }

      this.totalCoverage = totalProgress / fieldPoints.length;
    } else {
      this.totalCoverage = 0;
    }

    if (uniforms.uTotalCoverage) {
      uniforms.uTotalCoverage.value = this.totalCoverage;
    }

    if (raycastDue) {
      if (this.onInteractionRef.current) {
        this.normalized
          .copy(uniforms.uMousePos.value)
          .sub(surface.boundingBox.min)
          .divide(this.dimensions)
          .clampScalar(0, 1);

        this.onInteractionRef.current({
          position: uniforms.uMousePos.value.toArray(),
          normalizedPosition: this.normalized.toArray(),
          region:
            this.normalized.y < 0.33
              ? "lower"
              : this.normalized.y < 0.67
              ? "middle"
              : "upper",
          intensity: this.surfaceActive ? uniforms.uActivity.value : 0,
        });
      }
    }
  }

  updateDepthAndActivity(dt, damping, config) {
    const { uniforms, surface, hitSurface } = this.scene;
    const { interaction, raycaster } = this;

    this.smoothDepth = THREE.MathUtils.lerp(
      this.smoothDepth,
      this.targetDepth,
      1 - Math.exp(-dt * config.depthSmoothing),
    );
    this.neutralPlane.constant = -this.smoothDepth;

    let surfaceWeight = 0;
    if (
      interaction.pointerActive &&
      raycaster.ray.intersectPlane(this.neutralPlane, this.localHit)
    ) {
      hitSurface.worldToLocal(this.localHit);
      uniforms.uMousePos.value.lerp(
        this.localHit,
        1 - Math.exp(-dt * config.pointerSmoothing),
      );
      const distance = surface.boundingBox.distanceToPoint(this.localHit);
      surfaceWeight =
        1 - THREE.MathUtils.smoothstep(distance, 0, config.interactionRadius);
      const fieldWeight = this.fieldHit
        ? 0.85
        : (1 -
            THREE.MathUtils.smoothstep(
              distance,
              config.interactionRadius,
              config.interactionRadius * 3.0,
            )) *
          0.5;
      this.interactionWeight = Math.max(surfaceWeight, fieldWeight);
    } else {
      this.interactionWeight = 0;
    }

    const stillTime = this.elapsed - interaction.lastPointerTime;
    const motionWeight = interaction.pressed
      ? 1
      : 1 -
        THREE.MathUtils.smoothstep(
          stillTime,
          config.idleDelay,
          config.idleDelay + config.idleFadeDuration,
        );
    this.interactionWeight *= motionWeight;
    this.surfaceActive = surfaceWeight > 0.01;
    uniforms.uActivity.value +=
      (this.interactionWeight - uniforms.uActivity.value) * damping;
  }

  updateAudioSync(reducedMotion) {
    const audio = this.audioRef.current;
    const { uniforms, surface } = this.scene;
    const { interaction } = this;

    if (audio && this.elapsed - this.lastAudioSample > 0.066) {
      this.lastAudioSample = this.elapsed;
      this.normalized
        .copy(this.audioHit)
        .sub(surface.boundingBox.min)
        .divide(this.dimensions)
        .clampScalar(0, 1);

      const fieldPoint = this.fieldHit;
      // Floating particles before becoming Ganesha play Ohm choir
      // Forming or formed Ganesha particles (progress >= 0.5) or hovering Ganesha surface play regional raga melody
      const isFloatingField =
        interaction.pointerActive &&
        fieldPoint &&
        (!this.hasAudioHit && (!fieldPoint.progress || fieldPoint.progress < 0.5));

      const hasAudioTarget = interaction.pointerActive && (this.hasAudioHit || fieldPoint);

      audio.interact({
        source: isFloatingField ? "field" : "surface",
        particleId: fieldPoint ? fieldPoint.id : null,
        position: isFloatingField
          ? fieldPoint.position.toArray()
          : this.audioHit.toArray(),
        normalizedPosition: isFloatingField
          ? fieldPoint.normalized
          : fieldPoint && fieldPoint.progress >= 0.5 && !this.hasAudioHit && fieldPoint.surfaceNormalized
          ? fieldPoint.surfaceNormalized
          : this.normalized.toArray(),
        intensity: hasAudioTarget ? 1 : 0,
        moving:
          interaction.pointerActive &&
          this.elapsed - interaction.lastPointerTime < 0.18,
        pressed: interaction.pressed && interaction.pointerActive,
      });
    }

    const bands = audio?.tick();
    uniforms.uAudioEnabled.value = audio?.enabled && !reducedMotion ? 1 : 0;
    if (bands) uniforms.uAudioBands.value.fromArray(bands);
    else uniforms.uAudioBands.value.set(0, 0, 0);

    let musicPathCount = 0;
    if (audio?.enabled && !reducedMotion) {
      for (const path of audio.paths) {
        const life = Math.max(
          0,
          (path.expires - audio.context.currentTime) /
            (path.expires - path.born),
        );
        for (const point of path.points) {
          if (musicPathCount >= 24) break;
          uniforms.uMusicPath.value[musicPathCount++].set(
            ...point.position,
            life,
          );
        }
      }
    }
    uniforms.uMusicPathCount.value = musicPathCount;
  }

  updateGesturesAndReveal(dt, reducedMotion, config) {
    const { uniforms } = this.scene;
    const { interaction } = this;

    const rest = reducedMotion ? config.reducedMotionReveal : config.idleReveal;

    this.hoverIntent +=
      (this.interactionWeight - this.hoverIntent) *
      (1 - Math.exp(-dt / config.hoverDwell));

    const holding =
      interaction.pressed &&
      interaction.pointerActive &&
      this.interactionWeight > 0.1;

    uniforms.uHold.value = THREE.MathUtils.clamp(
      uniforms.uHold.value +
        (holding ? dt / config.holdDuration : -dt / config.releaseDuration),
      0,
      1,
    );

    if (
      !reducedMotion &&
      holding &&
      uniforms.uHold.value > 0.12 &&
      this.elapsed - this.lastPulseTime > 1.8
    ) {
      uniforms.uPulseOrigin.value.copy(uniforms.uMousePos.value);
      uniforms.uPulseStart.value = this.elapsed;
      this.lastPulseTime = this.elapsed;
    }

    if (
      !reducedMotion &&
      interaction.pointerActive &&
      this.interactionWeight > 0.1 &&
      this.elapsed - this.lastTrailTime > 0.14 &&
      this.lastTrailPoint.distanceToSquared(uniforms.uMousePos.value) > 0.0012
    ) {
      const point = uniforms.uMousePos.value;
      uniforms.uTrail.value[this.trailIndex].set(
        point.x,
        point.y,
        point.z,
        this.elapsed,
      );
      this.trailIndex = (this.trailIndex + 1) % 6;
      this.lastTrailPoint.copy(point);
      this.lastTrailTime = this.elapsed;
    }

    const hoverReveal = reducedMotion
      ? Math.min(1, rest + 0.04)
      : config.hoverReveal;
    const holdReveal = reducedMotion
      ? Math.min(1, rest + 0.08)
      : config.pressedReveal;

    // Full reconstruction requires sweeping across the whole screen.
    // Exploring one area allows up to 25% reveal; full screen exploration reaches 100%.
    const coverageMultiplier = reducedMotion
      ? 1
      : 0.25 + 0.75 * this.totalCoverage;

    let targetReveal =
      THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(rest, hoverReveal, this.hoverIntent),
        holdReveal,
        THREE.MathUtils.smoothstep(uniforms.uHold.value, 0, 1),
      ) * coverageMultiplier;

    const preview = this.previewRef.current;
    if (preview === "rest") targetReveal = rest;
    if (preview === "hover") targetReveal = config.hoverReveal;
    if (preview === "held") targetReveal = config.pressedReveal;

    const revealRate =
      targetReveal > uniforms.uReveal.value
        ? 1 / config.revealDuration
        : 1 / config.releaseDuration;

    uniforms.uReveal.value +=
      (targetReveal - uniforms.uReveal.value) *
      (1 - Math.exp(-dt * revealRate));
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.clock.getDelta();
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
