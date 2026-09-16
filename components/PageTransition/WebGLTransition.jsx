import React, { useEffect, useRef } from "react";
import Router from "next/router";
import * as THREE from "three/webgpu";
import styles from "./WebGLTransition.module.scss";
import { createTransitionMaterial } from "./transitionMaterial";
import { samplePageLayout } from "./samplePageLayout";

const DURATION = 1200;
const COUNT = 2800;

import { startWebGLTransition } from "./transitionTrigger";
export { startWebGLTransition };

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
    const renderer = new THREE.WebGPURenderer({
      alpha: true,
      antialias: false,
    });
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
    let renderWidth = 0;
    let renderHeight = 0;
    let renderDpr = 0;
    const resize = () => {
      // Only the soft particle overlay uses reduced resolution. Native page
      // captures and DOM text remain at the browser's full device resolution.
      const dpr = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1 : 1.25);
      if (
        renderWidth === innerWidth &&
        renderHeight === innerHeight &&
        renderDpr === dpr
      )
        return;
      renderWidth = innerWidth;
      renderHeight = innerHeight;
      renderDpr = dpr;
      renderer.setPixelRatio(dpr);
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

    const runTransition = (updateCallback, options = {}) => {
      if (disposed || reduced.matches || !document.startViewTransition) {
        updateCallback?.();
        return;
      }
      const duration = options.mode === "cards" ? 650 : DURATION;
      const particleCount =
        innerWidth < 768 ? 1100 : options.mode === "cards" ? 1800 : COUNT;
      geometry.instanceCount = particleCount;
      const id = ++serial;
      active?.skipTransition();
      clear();
      if (ready) resize();

      const scope = options.scopeSelector || null;
      if (options.mode) {
        document.documentElement.dataset.transitionMode = options.mode;
      } else {
        delete document.documentElement.dataset.transitionMode;
      }

      // Choose a coherent gesture once per transition, never randomize per frame.
      uniforms.uVariation.value.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        0.7 + Math.random() * 0.8,
        0.06 + Math.random() * 0.1
      );
      for (let i = 0; i < particleCount * 2; i++) seeds[i] = Math.random();
      geometry.attributes.aSeed.needsUpdate = true;
      origins.array.set(samplePageLayout(particleCount, scope));
      origins.needsUpdate = true;
      targets.array.set(origins.array);
      targets.needsUpdate = true;
      uniforms.uProgress.value = 0;

      const transition = document.startViewTransition(async () => {
        const res = await updateCallback?.();
        if (res === false || disposed) return;
        if (options.mode === "cards" && scope) {
          const images = Array.from(
            document.querySelector(scope)?.querySelectorAll("img") || []
          ).filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.bottom > 0 && rect.top < innerHeight;
          });
          // Decode only visible cards, and never stall a filter on a slow image.
          let timeout;
          await Promise.race([
            Promise.all(
              images.map((image) => {
                image.loading = "eager";
                return image.decode?.().catch(() => {}) || Promise.resolve();
              })
            ),
            new Promise((resolve) => {
              timeout = setTimeout(resolve, 300);
            }),
          ]);
          clearTimeout(timeout);
        }
        targets.array.set(samplePageLayout(particleCount, scope));
        targets.needsUpdate = true;
      });
      active = transition;
      transition.ready
        .then(() => {
          if (disposed || serial !== id || !ready) return;
          const start = performance.now();
          const frame = (now) => {
            if (disposed || serial !== id) return;
            const progress = Math.min(1, (now - start) / duration);
            uniforms.uProgress.value = progress;
            uniforms.time.value = (now - start) / 1000;
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
            delete document.documentElement.dataset.transitionMode;
            active = null;
            clear();
          }
        });
      transition.updateCallbackDone.catch(() => {});
    };

    const handleCustomTransition = (event) => {
      if (typeof event.detail?.update === "function") {
        runTransition(event.detail.update, {
          mode: event.detail.mode,
          scopeSelector: event.detail.scopeSelector,
        });
      }
    };

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
      const destination = url.pathname + url.search + url.hash;
      runTransition(() => Router.push(destination));
    };
    const cancel = () => {
      active?.skipTransition();
      clear();
    };
    window.addEventListener("click", click, true);
    window.addEventListener("webgl-page-transition", handleCustomTransition);
    window.addEventListener("resize", cancel);
    reduced.addEventListener("change", cancel);
    return () => {
      disposed = true;
      serial++;
      cancel();
      window.removeEventListener("click", click, true);
      window.removeEventListener(
        "webgl-page-transition",
        handleCustomTransition
      );
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
