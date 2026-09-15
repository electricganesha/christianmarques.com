import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";

// Deterministic samples keep responsive rebuilds and visual comparisons stable.
function randomGenerator() {
  let state = 713;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

export async function loadSurface(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Ganesha geometry: HTTP ${response.status}`);
  const data = await response.arrayBuffer();
  const loader = new GLTFLoader();
  // Decode base color only as a CPU ink signal. No original material is built
  // and no color texture is uploaded to the visible particle shader.
  const placeholder = new THREE.MeshBasicMaterial();
  const inkImages = [];
  loader.register((parser) => ({
    name: "PARTICLE_INK",
    loadMaterial: async (index) => {
      const material = placeholder.clone();
      material.userData.inkImage = -1;
      const info =
        parser.json.materials[index].pbrMetallicRoughness?.baseColorTexture;
      if (!info || typeof document === "undefined") return material;
      let texture;
      try {
        texture = await parser.getDependency("texture", info.index);
        if (!texture) return material;
        // KHR_texture_transform is applied without instantiating a PBR material.
        const transform = info.extensions?.KHR_texture_transform;
        if (transform?.offset) texture.offset.fromArray(transform.offset);
        if (transform?.scale) texture.repeat.fromArray(transform.scale);
        if (transform?.rotation !== undefined)
          texture.rotation = transform.rotation;
        texture.updateMatrix();
        const canvas = document.createElement("canvas");
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(texture.image, 0, 0);
        material.userData.inkImage = inkImages.length;
        material.userData.inkUv = transform?.texCoord ?? info.texCoord ?? 0;
        inkImages.push({
          pixels: context.getImageData(0, 0, canvas.width, canvas.height).data,
          width: canvas.width,
          height: canvas.height,
          matrix: texture.matrix.clone(),
          flipY: texture.flipY,
          wrapS: texture.wrapS,
          wrapT: texture.wrapT,
        });
      } catch (error) {
        console.warn(
          "Texture ink unavailable; retaining geometry shading:",
          error,
        );
      } finally {
        texture?.dispose();
      }
      return material;
    },
  }));
  const gltf = await new Promise((resolve, reject) =>
    loader.parse(data, "", resolve, reject),
  ).catch((error) => {
    placeholder.dispose();
    throw error;
  });
  const parts = [];
  let surface;
  try {
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverseVisible((child) => {
      if (!child.isMesh || !child.geometry?.attributes.position) return;
      const source = child.geometry.clone();
      if (!source.attributes.normal) source.computeVertexNormals();
      source.applyMatrix4(child.matrixWorld);
      const part = source.index ? source.toNonIndexed() : source;
      if (part !== source) source.dispose();
      const inkImage = child.material.userData.inkImage ?? -1;
      const uvName = child.material.userData.inkUv === 1 ? "uv2" : "uv";
      const uv = part.attributes[uvName];
      part.setAttribute(
        "uv",
        uv ||
          new THREE.BufferAttribute(
            new Float32Array(part.attributes.position.count * 2),
            2,
          ),
      );
      part.setAttribute(
        "aInkImage",
        new THREE.BufferAttribute(
          new Float32Array(part.attributes.position.count).fill(
            uv ? inkImage : -1,
          ),
          1,
        ),
      );
      Object.keys(part.attributes).forEach((name) => {
        if (!["position", "normal", "uv", "aInkImage"].includes(name))
          part.deleteAttribute(name);
      });
      part.clearGroups();
      parts.push(part);
    });
    if (!parts.length)
      throw new Error("Ganesha contains no visible mesh surfaces");
    surface = mergeGeometries(parts, false);
    surface.computeBoundingBox();
    const center = surface.boundingBox.getCenter(new THREE.Vector3());
    const size = surface.boundingBox.getSize(new THREE.Vector3());
    if (!(size.y > 0)) throw new Error("Ganesha surface has no height");
    surface.translate(-center.x, -center.y, -center.z);
    surface.scale(2 / size.y, 2 / size.y, 2 / size.y);
    surface.computeBoundingBox();
    surface.computeBoundingSphere();
    surface.userData.inkImages = inkImages;
    return surface;
  } catch (error) {
    surface?.dispose();
    throw error;
  } finally {
    parts.forEach((part) => part.dispose());
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
    placeholder.dispose();
  }
}

export function sampleParticles(surface, count, options = {}) {
  // Spend more samples on the camera-facing surface and face instead of the
  // broad pedestal/back. Area weighting still applies within each region.
  const frontWeight = options.frontSamplingWeight || 1;
  const faceWeight = options.faceSamplingWeight || 1;
  const weights = new Float32Array(surface.attributes.position.count);
  for (let i = 0; i < weights.length; i++) {
    const y = surface.attributes.position.getY(i);
    const front = THREE.MathUtils.smoothstep(
      surface.attributes.normal.getZ(i),
      -0.2,
      0.4,
    );
    const face = Math.exp(-Math.pow((y - 0.35) / 0.45, 2));
    weights[i] =
      (1 + front * (frontWeight - 1)) * (1 + face * (faceWeight - 1));
  }
  surface.setAttribute("samplingWeight", new THREE.BufferAttribute(weights, 1));
  const random = randomGenerator();
  const sampler = new MeshSurfaceSampler({ geometry: surface })
    .setWeightAttribute("samplingWeight")
    .setRandomGenerator(random)
    .build();
  surface.deleteAttribute("samplingWeight");
  // r142's sampler returns flat face normals. Interpolate the source vertex
  // normals at the same barycentric location for continuous stipple tones.
  const triangle = new THREE.Triangle();
  const barycentric = new THREE.Vector3();
  const vertexNormal = new THREE.Vector3();
  const sampledUv = new THREE.Vector2();
  let sampledInkImage = -1;
  sampler.sampleFace = function (faceIndex, targetPosition, targetNormal) {
    MeshSurfaceSampler.prototype.sampleFace.call(
      this,
      faceIndex,
      targetPosition,
      targetNormal,
    );
    const index = faceIndex * 3;
    triangle.a.fromBufferAttribute(surface.attributes.position, index);
    triangle.b.fromBufferAttribute(surface.attributes.position, index + 1);
    triangle.c.fromBufferAttribute(surface.attributes.position, index + 2);
    triangle.getBarycoord(targetPosition, barycentric);
    sampledUv.set(0, 0);
    sampledInkImage = surface.attributes.aInkImage?.getX(index) ?? -1;
    targetNormal.set(0, 0, 0);
    for (let j = 0; j < 3; j++) {
      if (surface.attributes.uv) {
        sampledUv.x +=
          surface.attributes.uv.getX(index + j) * barycentric.getComponent(j);
        sampledUv.y +=
          surface.attributes.uv.getY(index + j) * barycentric.getComponent(j);
      }
      vertexNormal.fromBufferAttribute(surface.attributes.normal, index + j);
      targetNormal.addScaledVector(vertexNormal, barycentric.getComponent(j));
    }
    targetNormal.normalize();
    return this;
  };
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const fields = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const ink = new Float32Array(count);
  const uvs = new Float32Array(count * 2);
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(point, normal);
    sampledUv.toArray(uvs, i * 2);
    const image = surface.userData.inkImages?.[sampledInkImage];
    ink[i] = image ? sampleTextureInk(image, sampledUv.x, sampledUv.y) : -1;
    point.toArray(positions, i * 3);
    normal.toArray(normals, i * 3);
    // Normalized screen field, expanded to the viewport in the vertex shader.
    fields.set([random() * 2 - 1, random() * 2 - 1, random() - 0.5], i * 3);
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aField", new THREE.BufferAttribute(fields, 3));
  geometry.setAttribute("aTextureInk", new THREE.BufferAttribute(ink, 1));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

// Bilinear CPU sampling preserves small painted details between mesh vertices.
// Luminance is perceptual (source sRGB bytes); it controls ink, not physical light.
export function sampleTextureInk(image, u, v) {
  const e = image.matrix.elements;
  let x = e[0] * u + e[3] * v + e[6];
  let y = e[1] * u + e[4] * v + e[7];
  const wrap = (value, mode) =>
    mode === THREE.RepeatWrapping
      ? value - Math.floor(value)
      : mode === THREE.MirroredRepeatWrapping
      ? 1 - Math.abs((((value % 2) + 2) % 2) - 1)
      : THREE.MathUtils.clamp(value, 0, 1);
  x = wrap(x, image.wrapS);
  y = wrap(y, image.wrapT);
  if (image.flipY) y = 1 - y;
  const px = x * (image.width - 1),
    py = y * (image.height - 1);
  const x0 = Math.floor(px),
    y0 = Math.floor(py);
  const luminance = (ix, iy) => {
    const offset = (iy * image.width + ix) * 4;
    const p = image.pixels;
    const value =
      (0.2126 * p[offset] + 0.7152 * p[offset + 1] + 0.0722 * p[offset + 2]) /
      255;
    return 1 - ((1 - value) * p[offset + 3]) / 255;
  };
  const top = THREE.MathUtils.lerp(
    luminance(x0, y0),
    luminance(Math.min(x0 + 1, image.width - 1), y0),
    px - x0,
  );
  const bottom = THREE.MathUtils.lerp(
    luminance(x0, Math.min(y0 + 1, image.height - 1)),
    luminance(
      Math.min(x0 + 1, image.width - 1),
      Math.min(y0 + 1, image.height - 1),
    ),
    px - x0,
  );
  return 1 - THREE.MathUtils.lerp(top, bottom, py - y0);
}
