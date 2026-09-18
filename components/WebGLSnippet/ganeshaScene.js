import * as THREE from "three/webgpu";
import { positionView, cameraNear, cameraFar, vec4 } from "three/tsl";
import { loadSurface, sampleParticles } from "./sampleGanesha";
import { GaneshaDof } from "./ganeshaDof";
import { createGaneshaMaterial } from "./ganeshaMaterial";

/**
 * Manages the Three.js / WebGPU scene graph, renderer, linear depth target,
 * instanced particle geometry, and responsive viewport sizing.
 */
export class GaneshaScene {
  constructor(container, config) {
    this.container = container;
    this.config = config;

    this.scene = new THREE.Scene();
    this.depthScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);

    this.renderer = null;
    this.surface = null;
    this.geometry = null;
    this.material = null;
    this.hitMaterial = null;
    this.depthTarget = null;
    this.particles = null;
    this.hitSurface = null;
    this.uniforms = null;

    this.mobile = false;
    this.fieldPoints = [];
    this.disposed = false;
  }

  async init(signal) {
    this.surface = await loadSurface(this.config.modelUrl, signal);
    if (this.disposed || signal?.aborted) {
      this.surface.dispose();
      return;
    }

    this.renderer = new THREE.WebGPURenderer({ antialias: true, alpha: false });
    this.renderer.setClearColor(0xffffff, 1);
    await this.renderer.init();

    if (this.disposed || signal?.aborted) {
      this.renderer.dispose();
      return;
    }

    this.container.dataset.renderer = this.renderer.backend.isWebGPUBackend
      ? "webgpu"
      : "webgl2";
    this.container.appendChild(this.renderer.domElement);

    this.depthTarget = new THREE.RenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });

    // Linear view depth in a float target avoids backend clip-depth conventions.
    this.hitMaterial = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
    });
    this.hitMaterial.fragmentNode = vec4(
      positionView.z.negate().sub(cameraNear).div(cameraFar.sub(cameraNear)),
      0,
      0,
      1
    );

    this.hitSurface = new THREE.Mesh(this.surface, this.hitMaterial);
    this.depthScene.add(this.hitSurface);

    const ganeshaMat = createGaneshaMaterial(
      this.config,
      this.depthTarget.texture
    );
    this.material = ganeshaMat.material;
    this.uniforms = ganeshaMat.uniforms;
    this.dof = new GaneshaDof(
      this.renderer,
      this.material,
      ganeshaMat.viewDepth
    );

    this.particles = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);

    this.trailMeshes = (ganeshaMat.trailMaterials || []).map((trailMat) => {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), trailMat);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      return mesh;
    });
    this.scene.trailMeshes = this.trailMeshes;

    this.resize();

    // Warm up GPU pipelines and precompile shaders while loading overlay is visible
    this.render();
  }

  resize = (rebuild = false) => {
    if (!this.renderer || !this.surface) return;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const nextMobile = width < 768;

    if (nextMobile !== this.mobile || rebuild === true || !this.geometry) {
      this.mobile = nextMobile;
      const samples = sampleParticles(
        this.surface,
        this.mobile
          ? this.config.particleCountMobile
          : this.config.particleCountDesktop,
        this.config
      );

      const quad = new THREE.PlaneGeometry(1, 1);
      const newGeometry = new THREE.InstancedBufferGeometry();
      newGeometry.index = quad.index;
      newGeometry.attributes = { ...quad.attributes };

      for (const [name, attr] of Object.entries(samples.attributes)) {
        if (name === "uv") continue; // Disc UVs belong to the quad, not the model.
        const target =
          name === "position"
            ? "aSurface"
            : name === "normal"
            ? "aNormal"
            : name;
        newGeometry.setAttribute(
          target,
          new THREE.InstancedBufferAttribute(attr.array, attr.itemSize)
        );
      }

      // One buffer for carry XYZ and activation W keeps WebGPU within its
      // baseline limit of eight vertex buffers.
      newGeometry.setAttribute(
        "aFieldState",
        new THREE.InstancedBufferAttribute(
          new Float32Array(samples.attributes.position.count * 4), 4
        ).setUsage(THREE.DynamicDrawUsage)
      );

      newGeometry.instanceCount = samples.attributes.position.count;
      samples.dispose();
      quad.dispose();

      this.particles.geometry?.dispose();
      this.particles.geometry = newGeometry;
      if (this.trailMeshes) {
        for (const mesh of this.trailMeshes) {
          mesh.geometry = newGeometry;
        }
      }
      this.geometry = newGeometry;
    }

    const {
      uniforms,
      camera,
      config,
      renderer,
      depthTarget,
      particles,
      hitSurface,
    } = this;

    uniforms.uFieldFraction.value =
      (this.mobile ? config.fieldCountMobile : config.fieldCountDesktop) /
      this.geometry.instanceCount;

    camera.aspect = width / height;
    camera.position.z = this.mobile
      ? config.mobileCameraDistance
      : config.cameraDistance;
    camera.updateProjectionMatrix();

    const halfHeight =
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;

    uniforms.uFieldExtent.value.set(halfHeight * camera.aspect, halfHeight);

    uniforms.uDpr.value = Math.min(
      window.devicePixelRatio || 1,
      this.mobile ? config.mobileMaxDpr : config.maxDpr
    );

    renderer.setPixelRatio(uniforms.uDpr.value);
    renderer.setSize(width, height);

    depthTarget.setSize(
      Math.round(width * uniforms.uDpr.value),
      Math.round(height * uniforms.uDpr.value)
    );

    this.dof?.resize(
      Math.round(width * uniforms.uDpr.value),
      Math.round(height * uniforms.uDpr.value)
    );

    particles.scale.setScalar(
      config.scale * (this.mobile ? config.mobileScale : 1)
    );
    particles.position.set(config.xOffset, config.yOffset, config.depth);
    hitSurface.scale.copy(particles.scale);
    hitSurface.position.copy(particles.position);

    this.rebuildFieldPoints();
  };

  rebuildFieldPoints() {
    this.fieldPoints = [];
    const fields = this.geometry.attributes.aField;
    const seeds = this.geometry.attributes.aSeed;
    const surfaces = this.geometry.attributes.aSurface;
    if (!fields || !seeds) return;

    const bb = this.surface?.boundingBox;
    const dim = this.dimensions;

    for (let i = 0; i < seeds.count; i++) {
      if (seeds.getX(i) >= this.uniforms.uFieldFraction.value) continue;
      const sx =
        surfaces && bb && dim && dim.x > 0
          ? (surfaces.getX(i) - bb.min.x) / dim.x
          : 0.5;
      const sy =
        surfaces && bb && dim && dim.y > 0
          ? (surfaces.getY(i) - bb.min.y) / dim.y
          : 0.5;
      const sz =
        surfaces && bb && dim && dim.z > 0
          ? (surfaces.getZ(i) - bb.min.z) / dim.z
          : 0.5;

      this.fieldPoints.push({
        id: i,
        progress: 0,
        awakened: false,
        carried: false,
        deposited: false,
        carryOffset: new THREE.Vector3(),
        field: [fields.getX(i), fields.getY(i), fields.getZ(i)],
        rendered: new THREE.Vector3(),
        position: new THREE.Vector3(
          fields.getX(i) * this.uniforms.uFieldExtent.value.x,
          fields.getY(i) * this.uniforms.uFieldExtent.value.y,
          fields.getZ(i) * 0.8
        ),
        normalized: [
          fields.getX(i) * 0.5 + 0.5,
          fields.getY(i) * 0.5 + 0.5,
          fields.getZ(i) + 0.5,
        ],
        surfaceNormalized: [
          THREE.MathUtils.clamp(sx, 0, 1),
          THREE.MathUtils.clamp(sy, 0, 1),
          THREE.MathUtils.clamp(sz, 0, 1),
        ],
      });
    }
  }

  render() {
    if (!this.renderer) return;
    this.renderer.setRenderTarget(this.depthTarget);
    this.renderer.render(this.depthScene, this.camera);
    this.renderer.setRenderTarget(null);

    const trailsActive = Boolean(this.config.interactionTrailsEnabled);
    if (this.trailMeshes) {
      for (const mesh of this.trailMeshes) {
        mesh.visible = trailsActive;
      }
    }

    if (
      this.config.dofEnabled &&
      this.config.dofAperture > 0 &&
      this.config.dofMaxBlur > 0
    ) {
      this.dof.render(this.scene, this.camera, this.config, this.mobile);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  createSnapshot(extraState = {}) {
    if (typeof window === "undefined" || window.location.hash !== "#debug") {
      return null;
    }

    return {
      backend: this.container.dataset.renderer,
      reveal: this.uniforms.uReveal.value,
      hold: this.uniforms.uHold.value,
      activity: this.uniforms.uActivity.value,
      pointer: this.uniforms.uMousePos.value.toArray(),
      particleCount: this.geometry?.instanceCount ?? 0,
      fieldHit: extraState.fieldHit?.id ?? null,
      surfaceHit: extraState.hasAudioHit ?? false,
      fieldNoteCount: extraState.fieldNoteCount ?? 0,
      fieldPoints: this.fieldPoints.map((p) => ({
        id: p.id,
        position: p.rendered.toArray(),
        restPosition: p.position.toArray(),
      })),
      musicPathCount: this.uniforms.uMusicPathCount.value,
      noteTimes: this.uniforms.uNotePulse.value.map((p) => p.w),
      drawCalls: this.renderer.info.render.drawCalls,
      uniforms: Object.fromEntries(
        Object.entries(this.uniforms)
          .filter(([, u]) => typeof u.value === "number")
          .map(([key, u]) => [key, u.value])
      ),
    };
  }

  dispose() {
    this.disposed = true;
    this.geometry?.dispose();
    this.surface?.dispose();
    this.material?.dispose();
    if (this.trailMeshes) {
      for (const mesh of this.trailMeshes) {
        mesh.material?.dispose();
      }
    }
    this.hitMaterial?.dispose();
    this.depthTarget?.dispose();
    this.dof?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement?.remove();
  }
}
