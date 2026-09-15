import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import styles from "./WebGLSnippet.module.scss";
import SoundControl from "./SoundControl";
import { GANESHA_CONFIG } from "./ganeshaConfig";
import { useSoundManager } from "./useSoundManager";
import { applyConfigPatch } from "./uniformBindings";
import { GaneshaScene } from "./ganeshaScene";
import { InteractionManager } from "./interactionManager";
import { SimulationLoop } from "./simulationLoop";

const GaneshaDebug = dynamic(() => import("./GaneshaDebug"), { ssr: false });

const WebGLSnippet = ({ onInteraction }) => {
  const containerRef = useRef(null);
  const configRef = useRef({ ...GANESHA_CONFIG });
  const applyConfigRef = useRef(null);
  const previewRef = useRef("live");
  const onInteractionRef = useRef(onInteraction);

  const [heroVisible, setHeroVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [debug, setDebug] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  const {
    audioRef,
    audioEventRef,
    soundEnabled,
    soundBusy,
    soundError,
    toggleSound,
    setActive: setAudioActive,
  } = useSoundManager();

  useEffect(() => {
    onInteractionRef.current = onInteraction;
  }, [onInteraction]);

  useEffect(() => {
    const handleHashChange = () => {
      const enabled = window.location.hash === "#debug";
      setDebug(enabled);
      if (!enabled) previewRef.current = "live";
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const changeConfig = useCallback((patch) => {
    Object.assign(configRef.current, patch);
    applyConfigRef.current?.(Object.keys(patch));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const abort = new AbortController();
    let disposed = false;
    let scene = null;
    let interaction = null;
    let simulation = null;
    let observer = null;

    const handleResize = () => scene?.resize();
    const handleOrientationChange = () => scene?.resize();

    async function initialize() {
      try {
        // Yield so the browser paints the loading screen cleanly before heavy CPU/GPU workload
        await new Promise((resolve) => setTimeout(resolve, 40));

        scene = new GaneshaScene(container, configRef.current);
        await scene.init(abort.signal);

        if (disposed || abort.signal.aborted) {
          scene.dispose();
          return;
        }

        const motionQuery = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );
        const initialReduced = motionQuery.matches;

        scene.uniforms.uReveal.value = initialReduced
          ? configRef.current.reducedMotionReveal
          : configRef.current.idleReveal;
        scene.uniforms.uLoad.value = initialReduced ? 1 : 0;
        scene.uniforms.uMotion.value = initialReduced ? 0 : 1;
        scene.uniforms.uCameraRange.value.set(
          scene.camera.near,
          scene.camera.far,
        );

        interaction = new InteractionManager(
          container,
          () => simulation?.elapsed ?? 0,
          audioRef,
          (reduced) => {
            if (scene?.uniforms) {
              scene.uniforms.uMotion.value = reduced ? 0 : 1;
            }
          },
        );

        simulation = new SimulationLoop({
          ganeshaScene: scene,
          interaction,
          configRef,
          audioRef,
          audioEventRef,
          previewRef,
          onInteractionRef,
        });

        applyConfigRef.current = (keys) => {
          if (!scene?.uniforms) return;
          applyConfigPatch(
            configRef.current,
            keys,
            scene.uniforms,
            scene.resize,
          );
        };

        // Diagnostics snapshot for browser automation and the #debug panel
        container.ganeshaSnapshot = () =>
          scene.createSnapshot(simulation.getSnapshotExtra());

        window.addEventListener("resize", handleResize, { passive: true });
        window.addEventListener("orientationchange", handleOrientationChange, {
          passive: true,
        });

        scene.renderer.domElement.addEventListener("webglcontextlost", () => {
          cleanup();
          setHasWebGLError(true);
        });

        let isVisible = true;
        let isAudible = true;
        let isTabActive = !document.hidden;

        const updateActivity = () => {
          const active = isVisible && isTabActive;
          if (active) simulation.start();
          else simulation.stop();
          setAudioActive(isAudible && isTabActive);
        };

        const hero = container.nextElementSibling;
        if ("IntersectionObserver" in window && hero) {
          observer = new IntersectionObserver(
            ([entry]) => {
              isVisible =
                entry.isIntersecting && entry.intersectionRatio > 0.05;
              isAudible = entry.isIntersecting && entry.intersectionRatio > 0.2;
              setHeroVisible(isAudible);
              updateActivity();
            },
            { threshold: [0.05, 0.2] },
          );
          observer.observe(hero);
        }

        const handleVisibilityChange = () => {
          isTabActive = !document.hidden;
          updateActivity();
        };
        // Wait two animation frames so GPU pipeline compilation settles smoothly
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        if (disposed || abort.signal.aborted) return;

        setReady(true);
        updateActivity();
      } catch (error) {
        if (disposed) return;
        console.warn(
          "Electric Ganesha unavailable; using static circle field:",
          error,
        );
        cleanup();
        setHasWebGLError(true);
      }
    }

    const cleanup = () => {
      disposed = true;
      abort.abort();
      delete container.ganeshaSnapshot;
      applyConfigRef.current = null;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      observer?.disconnect();
      simulation?.stop();
      interaction?.dispose();
      scene?.dispose();
    };

    initialize();
    return cleanup;
  }, [audioRef, audioEventRef, setAudioActive]);

  if (hasWebGLError) {
    return (
      <div className={styles.canvasFallback} aria-hidden="true">
        <div className={styles.fallbackGrid} />
      </div>
    );
  }

  return (
    <>
      <div
        id="canvas"
        ref={containerRef}
        className={styles.canvas}
        aria-hidden="true"
      />
      <div
        className={`${styles.loaderOverlay} ${
          ready ? styles.loaderHidden : ""
        }`}
        aria-hidden={ready ? "true" : undefined}
      >
        <div className={styles.fallbackGrid} />
        <div className={styles.loaderContent}>
          <div className={styles.loaderIcon}>
            <div className={styles.loaderRing} />
            <div className={styles.loaderDot} />
          </div>
          <div className={styles.loaderTextGroup}>
            <span className={styles.loaderSubtitle}>Weaving particles...</span>
          </div>
        </div>
      </div>
      <SoundControl
        enabled={soundEnabled}
        busy={soundBusy}
        visible={heroVisible && ready}
        error={soundError}
        onToggle={toggleSound}
      />
      {debug && (
        <GaneshaDebug
          config={configRef.current}
          onChange={changeConfig}
          onPreview={(value) => {
            previewRef.current = value;
          }}
        />
      )}
    </>
  );
};

export default WebGLSnippet;
