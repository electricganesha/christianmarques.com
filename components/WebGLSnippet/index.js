import React, { useEffect, useState } from "react";
import styles from "./WebGLSnippet.module.scss";
import * as THREE from "three";
import sphereVertexShader from "../../shaders/sphere/vertex.glsl";
import sphereFragmentShader from "../../shaders/sphere/fragment.glsl";

const WebGLSnippet = () => {
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

    aCamera.position.set(0, 0, cameraZ);

    const minZ = boundingBox.min.z;
    const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

    aCamera.far = cameraToFarEdge * 4;
    aCamera.updateProjectionMatrix();
  };

  useEffect(() => {
    if (isCanvasCreated) {
      return;
    }

    let count = 0;
    const pointer = new THREE.Vector2();
    let renderer, camera, scene, spheres;

    // Wait for next frame to ensure DOM is ready
    const initCanvas = () => {
      const canvas = document.querySelector("#canvas");
      if (!canvas) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        30,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000,
      );

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor("#fff");
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      canvas.appendChild(renderer.domElement);

      // Adjust grid orientation based on viewport aspect ratio
      const isPortrait = canvas.clientHeight > canvas.clientWidth;
      const SPHERE_COUNT_X = isPortrait ? 16 : 32;
      const SPHERE_COUNT_Y = isPortrait ? 32 : 16;
      const SPHERE_OFFSET = 100;
      const sphereCount = SPHERE_COUNT_X * SPHERE_COUNT_Y;

      // Scale spheres down on mobile devices
      const isMobile = window.innerWidth < 768;
      const scaleMultiplier = isMobile ? 0.5 : 1.0;

      const positions = new Float32Array(sphereCount * 3);
      const scales = new Float32Array(sphereCount);
      const angles = new Float32Array(sphereCount);
      const hovers = new Float32Array(sphereCount);
      let i = 0,
        j = 0;

      for (let ix = 0; ix < SPHERE_COUNT_X; ix++) {
        for (let iy = 0; iy < SPHERE_COUNT_Y; iy++) {
          positions[i] =
            ix * SPHERE_OFFSET - (SPHERE_COUNT_X * SPHERE_OFFSET) / 2;
          positions[i + 1] =
            iy * SPHERE_OFFSET - (SPHERE_COUNT_Y * SPHERE_OFFSET) / 2;
          positions[i + 2] = 0;

          scales[j] = Math.random() * 2 * scaleMultiplier;
          angles[i] = Math.random() * Math.PI;

          i += 3;
          j++;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
      geometry.setAttribute("angle", new THREE.BufferAttribute(angles, 1));
      geometry.setAttribute("hover", new THREE.BufferAttribute(hovers, 1));
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          uColor: { value: new THREE.Color("#000000") },
          uMousePos: { value: new THREE.Vector3(0, 0, 0) },
          uSize: { value: isMobile ? 0.5 : 1.0 },
          uIsClicked: { value: 0.0 },
        },
        vertexShader: sphereVertexShader,
        fragmentShader: sphereFragmentShader,
        transparent: true,
        depthWrite: false,
      });

      spheres = new THREE.Points(geometry, material);
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
          transparent: true,
          depthWrite: true,
          opacity: 0,
        }),
      );
      scene.add(invisiblePlane);
      invisiblePlane.position.copy(spheres.position);
      invisiblePlane.position.z += 1;

      fitCameraToCenteredObject(camera, spheres, 1);

      // Raycaster for mouse interaction
      const raycaster = new THREE.Raycaster();
      const mouse3D = new THREE.Vector3(10000, 10000, 10000);
      let targetClickState = 0.0;

      // Handle mouse/touch movement
      const handlePointerMove = (event) => {
        const canvas = document.querySelector("#canvas");
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.touches) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        } else {
          clientX = event.clientX;
          clientY = event.clientY;
        }

        // Convert to normalized device coordinates (-1 to +1)
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        // Use raycaster to get 3D position
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(invisiblePlane);

        if (intersects.length > 0) {
          mouse3D.copy(intersects[0].point);
        }
      };

      const handlePointerLeave = () => {
        // Reset mouse position when leaving canvas
        mouse3D.set(10000, 10000, 10000);
      };

      const handlePointerDown = () => {
        targetClickState = 1.0;
      };

      const handlePointerUp = () => {
        targetClickState = 0.0;
      };

      canvas.addEventListener("mousemove", handlePointerMove);
      canvas.addEventListener("touchmove", handlePointerMove);
      canvas.addEventListener("mouseleave", handlePointerLeave);
      canvas.addEventListener("touchend", handlePointerLeave);
      canvas.addEventListener("mousedown", handlePointerDown);
      canvas.addEventListener("mouseup", handlePointerUp);
      canvas.addEventListener("touchstart", handlePointerDown);
      canvas.addEventListener("touchend", handlePointerUp);

      // Handle window resize
      const handleResize = () => {
        const canvas = document.querySelector("#canvas");
        if (!canvas || !camera || !renderer) return;

        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        fitCameraToCenteredObject(camera, spheres, 1);
      };

      window.addEventListener("resize", handleResize);

      const clock = new THREE.Clock();
      function tick() {
        material.uniforms.time.value = clock.getElapsedTime();

        if (mouse3D.x > 9000) {
          material.uniforms.uMousePos.value.lerp(mouse3D, 0.15);
        } else if (material.uniforms.uMousePos.value.x > 9000) {
          material.uniforms.uMousePos.value.copy(mouse3D);
        } else {
          material.uniforms.uMousePos.value.copy(mouse3D);
        }

        // Animate each sphere's hover state individually for smooth sizing transitions
        const hoverRadius = 350.0;
        const positionsAttr = spheres.geometry.attributes.position.array;
        const hoversAttr = spheres.geometry.attributes.hover.array;
        const mx = mouse3D.x;
        const my = mouse3D.y;
        const mz = mouse3D.z;

        for (let j = 0; j < sphereCount; j++) {
          const idx = j * 3;
          const dx = positionsAttr[idx] - mx;
          const dy = positionsAttr[idx + 1] - my;
          const dz = positionsAttr[idx + 2] - mz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          const targetHover =
            dist < hoverRadius ? 1.0 - dist / hoverRadius : 0.0;
          hoversAttr[j] += (targetHover - hoversAttr[j]) * 0.08;
        }

        // Smoothly animate click state with slower, more progressive transition
        const lerpSpeed = 0.1;
        material.uniforms.uIsClicked.value +=
          (targetClickState - material.uniforms.uIsClicked.value) * lerpSpeed;

        requestAnimationFrame(tick);

        spheres.geometry.attributes.position.needsUpdate = true;
        spheres.geometry.attributes.scale.needsUpdate = true;
        spheres.geometry.attributes.hover.needsUpdate = true;

        renderer.render(scene, camera);

        count += 0.1;
      }

      tick();
      setIsCanvasCreated(true);

      // Cleanup function
      return () => {
        const canvas = document.querySelector("#canvas");
        if (canvas) {
          canvas.removeEventListener("mousemove", handlePointerMove);
          canvas.removeEventListener("touchmove", handlePointerMove);
          canvas.removeEventListener("mouseleave", handlePointerLeave);
          canvas.removeEventListener("touchend", handlePointerLeave);
          canvas.removeEventListener("mousedown", handlePointerDown);
          canvas.removeEventListener("mouseup", handlePointerUp);
          canvas.removeEventListener("touchstart", handlePointerDown);
        }
        window.removeEventListener("resize", handleResize);
        if (renderer) {
          renderer.dispose();
        }
      };
    };

    // Initialize on next frame to ensure DOM is ready
    requestAnimationFrame(initCanvas);
  }, []);

  return <div id="canvas" className={styles.canvas} />;
};

export default WebGLSnippet;
