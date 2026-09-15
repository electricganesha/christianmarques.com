import React, { useEffect, useRef } from "react";
import Router from "next/router";
import * as THREE from "three/webgpu";
import styles from "./WebGLTransition.module.scss";
import { createTransitionMaterial } from "./transitionMaterial";
import { samplePageLayout } from "./samplePageLayout";

const DURATION = 1200;
const COUNT = 4500;

export default function WebGLTransition() {
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (!document.startViewTransition || reduced.matches) return;
    let disposed = false;
    let ready = false;
    let active = null;
    let raf = 0;
    let serial = 0;
    const renderer = new THREE.WebGPURenderer({ alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const { material, uniforms } = createTransitionMaterial();
    const quad = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = quad.index;
    geometry.attributes = { ...quad.attributes };
    const origins = new THREE.InstancedBufferAttribute(
      new Float32Array(COUNT * 2),
      2
    );
    const targets = new THREE.InstancedBufferAttribute(
      new Float32Array(COUNT * 2),
      2
    );
    const seeds = new Float32Array(COUNT * 2);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    geometry.setAttribute("aOrigin", origins);
    geometry.setAttribute("aTarget", targets);
    geometry.setAttribute(
      "aSeed",
      new THREE.InstancedBufferAttribute(seeds, 2)
    );
    geometry.instanceCount = COUNT;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const clear = () => {
      cancelAnimationFrame(raf);
      if (ready) renderer.clear();
    };
    const resize = () => {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(innerWidth, innerHeight);
      uniforms.uDpr.value = renderer.getPixelRatio();
    };
    renderer
      .init()
      .then(() => {
        if (disposed) {
          renderer.dispose();
          return;
        }
        renderer.setClearColor(0xffffff, 0);
        resize();
        container.appendChild(renderer.domElement);
        ready = true;
      })
      .catch(() => {});

    const click = (event) => {
      if (
        disposed ||
        reduced.matches ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = event.target.closest?.("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname)
        return;
      event.preventDefault();
      event.stopPropagation();
      const id = ++serial;
      active?.skipTransition();
      clear();
      if (ready) resize();
      origins.array.set(samplePageLayout(COUNT));
      origins.needsUpdate = true;
      const destination = url.pathname + url.search + url.hash;
      // The browser owns both page captures. No DOM repainting, image copying,
      // font substitution, or texture uploads are involved in this handoff.
      const transition = document.startViewTransition(async () => {
        const navigated = await Router.push(destination);
        if (!navigated || disposed) return;
        targets.array.set(samplePageLayout(COUNT));
        targets.needsUpdate = true;
      });
      active = transition;
      transition.ready
        .then(() => {
          if (disposed || serial !== id || !ready) return;
          const start = performance.now();
          const frame = (now) => {
            if (disposed || serial !== id) return;
            const progress = Math.min(1, (now - start) / DURATION);
            uniforms.uProgress.value = progress;
            uniforms.time.value = now / 1000;
            try {
              renderer.render(scene, camera);
            } catch {
              clear();
              return;
            }
            if (progress < 1) raf = requestAnimationFrame(frame);
            else clear();
          };
          raf = requestAnimationFrame(frame);
        })
        .catch(() => {});
      transition.finished
        .catch(() => {})
        .finally(() => {
          if (serial === id) {
            active = null;
            clear();
          }
        });
      transition.updateCallbackDone.catch(() => {});
    };
    const cancel = () => {
      active?.skipTransition();
      clear();
    };
    window.addEventListener("click", click, true);
    window.addEventListener("resize", cancel);
    reduced.addEventListener("change", cancel);
    return () => {
      disposed = true;
      serial++;
      cancel();
      window.removeEventListener("click", click, true);
      window.removeEventListener("resize", cancel);
      reduced.removeEventListener("change", cancel);
      geometry.dispose();
      material.dispose();
      if (ready) renderer.dispose();
    };
  }, []);
  return (
    <div
      ref={containerRef}
      className={styles.transitionOverlay}
      aria-hidden="true"
      data-testid="webgl-transition"
    />
  );
}
