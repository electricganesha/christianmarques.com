import * as THREE from "three/webgpu";
import { texture, uniform, vec3 } from "three/tsl";
import { dof } from "three/addons/tsl/display/DepthOfFieldNode.js";

// A separate particle-depth pass follows the same vertex motion and disc alpha.
// The hidden solid model's depth would incorrectly focus empty field regions.
export class GaneshaDof {
  constructor(renderer, material, viewDepth) {
    this.renderer = renderer;
    this.color = new THREE.RenderTarget(1, 1);
    this.depth = new THREE.RenderTarget(1, 1, { type: THREE.FloatType });
    this.depthMaterial = material.clone();
    this.depthMaterial.colorNode = vec3(viewDepth);
    this.depthMaterial.transparent = false;
    this.depthMaterial.depthTest = true;
    this.depthMaterial.depthWrite = true;
    this.depthMaterial.toneMapped = false;
    this.focus = uniform(4.8);
    this.aperture = uniform(0.002);
    this.maxBlur = uniform(0.003);
    this.post = new THREE.PostProcessing(renderer);
    this.post.outputNode = dof(
      texture(this.color.texture),
      texture(this.depth.texture).r.negate(),
      this.focus,
      this.aperture,
      this.maxBlur
    );
    this.clearColor = new THREE.Color();
    this.depthClear = new THREE.Color();
  }
  resize(width, height) {
    this.color.setSize(width, height);
    this.depth.setSize(width, height);
  }
  render(scene, camera, config, mobile) {
    const renderer = this.renderer;
    this.focus.value = Math.max(
      camera.near,
      camera.position.z - config.depth + config.dofFocusOffset
    );
    this.aperture.value = config.dofAperture;
    this.maxBlur.value = mobile
      ? Math.min(config.dofMaxBlur, 0.002)
      : config.dofMaxBlur;
    const override = scene.overrideMaterial;
    const target = renderer.getRenderTarget();
    renderer.getClearColor(this.clearColor);
    const alpha = renderer.getClearAlpha();
    try {
      renderer.setRenderTarget(this.color);
      renderer.render(scene, camera);
      scene.overrideMaterial = this.depthMaterial;
      // Empty white space stays in focus rather than becoming a far-plane halo.
      renderer.setClearColor(
        this.depthClear.setRGB(
          this.focus.value,
          this.focus.value,
          this.focus.value
        ),
        1
      );
      const trailMeshes = scene.trailMeshes || [];
      for (const m of trailMeshes) m.visible = false;
      renderer.setRenderTarget(this.depth);
      renderer.render(scene, camera);
      for (const m of trailMeshes) m.visible = Boolean(config.interactionTrailsEnabled);
      scene.overrideMaterial = override;
      renderer.setRenderTarget(target);
      this.post.render();
    } finally {
      scene.overrideMaterial = override;
      renderer.setRenderTarget(target);
      renderer.setClearColor(this.clearColor, alpha);
    }
  }
  dispose() {
    this.color.dispose();
    this.depth.dispose();
    this.depthMaterial.dispose();
    this.post.dispose();
  }
}
