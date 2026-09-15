import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./WebGLSnippet.module.scss";

function StaticFallback() {
  return (
    <div className={styles.loaderOverlay} aria-hidden="true">
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
  );
}

// Dynamically import WebGLSnippet with zero SSR and lightweight loading placeholder
const LazyWebGLSnippet = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => <StaticFallback />,
});

function checkDeviceCapabilities() {
  if (typeof window === "undefined") return false;

  // 2. Respect Data Saver / low-bandwidth mode
  if (navigator.connection && navigator.connection.saveData === true) {
    return false;
  }

  // 3. Skip heavy 3D on budget devices with low CPU thread concurrency
  if (
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency < 4
  ) {
    return false;
  }

  // 4. Check WebGPU or WebGL support
  try {
    const hasWebGPU = Boolean(typeof navigator !== "undefined" && navigator.gpu);
    const canvas = document.createElement("canvas");
    const hasGL = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
    if (!hasWebGPU && !hasGL) return false;
  } catch {
    return false;
  }

  return true;
}

export default function DynamicWebGL(props) {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    // Only upgrade to 3D if device passes capability checks
    if (checkDeviceCapabilities()) {
      setCanRender3D(true);
    }
  }, []);

  if (!canRender3D) {
    return <StaticFallback />;
  }

  return <LazyWebGLSnippet {...props} />;
}
