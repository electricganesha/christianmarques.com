import styles from "../styles/Home.module.scss";
import {useEffect, useState} from "react";
import * as THREE from "three";
import sphereVertexShader from "../shaders/sphere/vertex.glsl";
import sphereFragmentShader from "../shaders/sphere/fragment.glsl";

export default function Home() {
  const [isCanvasCreated, setIsCanvasCreated] = useState(false);

  const fitCameraToCenteredObject = (aCamera, object, offset) => {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    let size = new THREE.Vector3();
    boundingBox.getSize(size);

    const fov = aCamera.fov * (Math.PI / 180);
    const fovh = 2 * Math.atan(Math.tan(fov / 2) * aCamera.aspect);
    let dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
    let dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
    let cameraZ = Math.max(dx, dy);

    if (offset !== undefined && offset !== 0) cameraZ *= offset;

    aCamera.position.set(-0.05, -0.4, cameraZ);

    const minZ = boundingBox.min.z;
    const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

    aCamera.far = cameraToFarEdge * 3;
    aCamera.updateProjectionMatrix();
  };

  useEffect(() => {
    if (isCanvasCreated) {
      return;
    }

    function onPointerMove(event) {
      let rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / canvas.clientWidth * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / canvas.clientHeight * 2 - 1);

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        material.uniforms.uMousePos.value = intersects[0].point;
      }
    }

    let count = 0;

    const pointer = new THREE.Vector2();

    const raycaster = new THREE.Raycaster();

    const scene = new THREE.Scene();
    const canvas = document.querySelector("#canvas");
    const camera = new THREE.PerspectiveCamera(
      30,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor("#fff");
    renderer.setPixelRatio(2);
    canvas.appendChild(renderer.domElement);

    const SPHERE_COUNT_X = 32;
    const SPHERE_COUNT_Y = 16;
    const SPHERE_OFFSET = 100;
    const sphereCount = SPHERE_COUNT_X * SPHERE_COUNT_Y;

    const positions = new Float32Array(sphereCount * 3);
    const scales = new Float32Array(sphereCount);
    const angles = new Float32Array(sphereCount);
    let i = 0,
      j = 0;

    for (let ix = 0; ix < SPHERE_COUNT_X; ix++) {
      for (let iy = 0; iy < SPHERE_COUNT_Y; iy++) {
        positions[i] = ix * SPHERE_OFFSET - SPHERE_COUNT_X * SPHERE_OFFSET / 2;
        positions[i + 1] =
          iy * SPHERE_OFFSET - SPHERE_COUNT_Y * SPHERE_OFFSET / 2;
        positions[i + 2] = 0;

        scales[j] = Math.random() * 2;
        angles[i] = Math.random() * Math.PI;

        i += 3;
        j++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("angle", new THREE.BufferAttribute(angles, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0.0},
        uColor: {value: new THREE.Color("#000000")},
        uMousePos: {value: new THREE.Vector3(0, 0, 0)},
        uSize: {value: 1.0}
      },
      vertexShader: sphereVertexShader,
      fragmentShader: sphereFragmentShader
    });

    const spheres = new THREE.Points(geometry, material);
    spheres.updateMatrixWorld();
    spheres.geometry.computeBoundingBox();
    spheres.geometry.computeVertexNormals();
    scene.add(spheres);

    const planeWidth =
      spheres.geometry.boundingBox.max.x - spheres.geometry.boundingBox.min.x;
    const planeHeight =
      spheres.geometry.boundingBox.max.y - spheres.geometry.boundingBox.min.y;
    const invisiblePlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(planeWidth, planeHeight, 128),
      new THREE.MeshBasicMaterial({
        color: "#ff0000",
        transparent: true,
        depthWrite: true,
        opacity: 0
      })
    );
    scene.add(invisiblePlane);
    invisiblePlane.position.copy(spheres.position);
    invisiblePlane.position.z += 1;

    fitCameraToCenteredObject(camera, spheres, 1);
    canvas.addEventListener("mousemove", onPointerMove);
    const clock = new THREE.Clock();
    function tick() {
      material.uniforms.time.value = clock.getElapsedTime();
      material.uniforms.uMousePos.value = new THREE.Vector2(
        pointer.x * spheres.geometry.boundingBox.max.x,
        pointer.y * spheres.geometry.boundingBox.max.y
      );

      requestAnimationFrame(tick);

      spheres.geometry.attributes.position.needsUpdate = true;
      spheres.geometry.attributes.scale.needsUpdate = true;

      renderer.render(scene, camera);

      count += 0.1;
    }

    tick();
    setIsCanvasCreated(true);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <img src="/hexagram55.png" alt="Hexagram 55" />
        Christian Marques
        <img src="/hexagram55.png" alt="Hexagram 55" />
      </h1>
      <div id="canvas" className={styles.canvas} />
    </div>
  );
}
