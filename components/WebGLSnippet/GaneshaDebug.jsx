import React, { useState } from "react";
import { createPortal } from "react-dom";
import { GANESHA_CONFIG } from "./ganeshaConfig";
import styles from "./GaneshaDebug.module.scss";

const GROUPS = {
  "Depth of field": [
    "dofEnabled",
    "dofFocusOffset",
    "dofAperture",
    "dofMaxBlur",
  ],
  "Visual effects": [
    "depthAccentsEnabled",
    "depthAccentStrength",
    "tonalContrastEnabled",
    "tonalContrast",
    "interactionTrailsEnabled",
    "interactionTrailLength",
    "antialiasingEnabled",
  ],
  Composition: [
    "scale",
    "mobileScale",
    "xOffset",
    "yOffset",
    "depth",
    "rotationX",
    "rotationY",
    "rotationZ",
    "cameraDistance",
    "mobileCameraDistance",
  ],
  "Ink & shading": [
    "textureInkBlend",
    "textureInkContrast",
    "inkDirection",
    "shadowStrength",
    "contourStrength",
    "occlusionStrength",
    "occlusionRadius",
    "inkSizeRange",
    "depthTolerance",
  ],
  "Circles & reveal": [
    "fieldParticleSize",
    "surfaceParticleSize",
    "fieldCountDesktop",
    "fieldCountMobile",
    "coreFraction",
    "idleReveal",
    "hoverReveal",
    "pressedReveal",
    "reducedMotionReveal",
    "pointerRevealStrength",
  ],
  Interaction: [
    "idleDelay",
    "idleFadeDuration",
    "hoverDwell",
    "holdDuration",
    "revealDuration",
    "releaseDuration",
    "trailDuration",
    "trailRevealStrength",
    "rippleStrength",
    "rippleSpeed",
    "interactionRadius",
    "fieldHoverRadius",
    "fieldRepelStrength",
    "fieldHoverSize",
    "displacementStrength",
    "pointerRotationStrength",
    "idleRotationStrength",
    "pointerSmoothing",
    "depthSmoothing",
  ],
  Performance: [
    "particleCountDesktop",
    "particleCountMobile",
    "frontSamplingWeight",
    "faceSamplingWeight",
    "maxDpr",
    "mobileMaxDpr",
    "raycastInterval",
  ],
};
const LABELS = {
  dofEnabled: "Enable Depth of Field",
  depthAccentsEnabled: "Enable Depth-aware ink accents",
  depthAccentStrength: "Ink accent strength",
  tonalContrastEnabled: "Enable Gentle tonal contrast",
  tonalContrast: "Tonal contrast strength",
  interactionTrailsEnabled: "Enable Interaction trails",
  interactionTrailLength: "Trail length",
  antialiasingEnabled: "Enable Antialiasing (smooth circles)",
};

export const REBUILD_KEYS = [
  "particleCountDesktop",
  "particleCountMobile",
  "frontSamplingWeight",
  "faceSamplingWeight",
];
const rangeFor = (key) => {
  if (key === "dofAperture") return [0, 0.03, 0.001];
  if (key === "dofMaxBlur") return [0, 0.015, 0.001];
  if (key === "depthAccentStrength") return [0, 2, 0.05];
  if (key === "tonalContrast") return [0, 1, 0.02];
  if (key === "interactionTrailLength") return [0, 2, 0.05];
  if (key.startsWith("particleCount")) return [1000, 150000, 1000];
  if (key.startsWith("fieldCount")) return [0, 1500, 10];
  if (key.includes("SamplingWeight")) return [0.1, 10, 0.1];
  if (key.includes("Dpr")) return [0.5, 2.5, 0.1];
  if (key.includes("CameraDistance") || key === "cameraDistance")
    return [2, 12, 0.1];
  if (key.startsWith("rotation")) return [-Math.PI, Math.PI, 0.01];
  if (key.endsWith("Offset") || key === "depth") return [-2, 2, 0.01];
  if (key === "inkDirection") return [-2, 2, 0.05];
  if (/Duration|Dwell|Delay/.test(key)) return [0.1, 8, 0.1];
  if (key === "rippleStrength") return [0, 0.1, 0.001];
  if (key.includes("Smoothing")) return [0.5, 30, 0.5];
  if (key === "raycastInterval") return [0.016, 0.25, 0.001];
  if (key === "depthTolerance") return [0.001, 0.05, 0.001];
  if (key === "occlusionRadius") return [0.005, 0.2, 0.005];
  if (key === "displacementStrength") return [0, 0.15, 0.001];
  if (key.includes("RotationStrength")) return [0, 0.4, 0.005];
  if (key.endsWith("ParticleSize")) return [0.2, 24, 0.1];
  if (/Reveal|Blend|Fraction/.test(key)) return [0, 1, 0.01];
  return [0.05, 4, 0.05];
};

export default function GaneshaDebug({ config, onChange, onPreview }) {
  const [values, setValues] = useState(() => ({ ...config }));
  const [pending, setPending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState("");
  const [exportText, setExportText] = useState("");

  function changeBoolean(key, checked) {
    setValues((old) => ({ ...old, [key]: checked }));
    onChange({ [key]: checked });
    setStatus("");
  }

  function change(key, raw, index) {
    if (raw === "") return;
    const [min, max] = rangeFor(key);
    const number = Number(raw);
    if (!Number.isFinite(number)) return;
    const clamped = Math.max(min, Math.min(max, number));
    const bounded = key.includes("Count") ? Math.round(clamped) : clamped;
    const value =
      index === undefined
        ? bounded
        : values[key].map((v, i) => (i === index ? bounded : v));
    if (key === "inkDirection" && value.every((component) => component === 0)) {
      setStatus("Ink direction needs at least one nonzero component.");
      return;
    }
    setValues((old) => ({ ...old, [key]: value }));
    if (REBUILD_KEYS.includes(key)) setPending(true);
    else onChange({ [key]: value });
    setStatus("");
  }
  function apply() {
    onChange(Object.fromEntries(REBUILD_KEYS.map((key) => [key, values[key]])));
    setPending(false);
    setStatus("Particle settings applied.");
  }
  function reset() {
    const defaults = { ...GANESHA_CONFIG };
    setValues(defaults);
    onChange(defaults);
    setPending(false);
    setExportText("");
    setStatus("Defaults restored.");
  }
  async function copy() {
    const text = JSON.stringify(values, null, 2);
    setExportText(text);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Configuration copied.");
    } catch {
      setStatus("Select and copy the configuration below.");
    }
  }
  const close = () => {
    history.replaceState(null, "", location.pathname + location.search);
    window.dispatchEvent(new Event("hashchange"));
  };
  return createPortal(
    <aside
      data-ganesha-debug
      className={styles.panel}
      aria-label="Ganesha debugger"
    >
      <header>
        <strong>Electric Ganesha</strong>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
        <button onClick={close} aria-label="Close debugger">
          ×
        </button>
      </header>
      {!collapsed && (
        <>
          <p>
            Live preview · radians for rotation. Changes last until reload.
            Remove #debug to hide.
          </p>
          <div className={styles.actions}>
            <button onClick={reset}>Reset</button>
            <button onClick={copy}>Copy config</button>
          </div>
          <label>
            Preview state{" "}
            <select
              aria-label="Preview state"
              onChange={(event) => onPreview(event.target.value)}
            >
              <option value="live">Live interaction</option>
              <option value="rest">Rest</option>
              <option value="hover">Hover reveal</option>
              <option value="held">Full reveal</option>
            </select>
          </label>
          {Object.entries(GROUPS).map(([group, keys]) => (
            <details
              key={group}
              open={["Ink & shading", "Visual effects", "Depth of field"].includes(group)}
            >
              <summary>{group}</summary>
              {keys.map((key) => {
                if (typeof values[key] === "boolean") {
                  const id = `ganesha-debug-${key}`;
                  const label = LABELS[key] || key;
                  return (
                    <div className={styles.controlCheckbox} key={id}>
                      <label htmlFor={id}>
                        <input
                          id={id}
                          type="checkbox"
                          checked={Boolean(values[key])}
                          onChange={(e) => changeBoolean(key, e.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    </div>
                  );
                }
                const [min, max, step] = rangeFor(key);
                const components = Array.isArray(values[key])
                  ? values[key].map((_, i) => i)
                  : [undefined];
                return components.map((index) => {
                  const label =
                    (index === undefined && LABELS[key])
                      ? LABELS[key]
                      : key +
                        (index === undefined
                          ? ""
                          : ` ${
                              key === "inkDirection"
                                ? "XYZ"[index]
                                : index === 0
                                ? "highlight"
                                : "shadow"
                            }`);
                  const value =
                    index === undefined ? values[key] : values[key][index];
                  const id = `ganesha-debug-${key}-${index ?? "scalar"}`;
                  return (
                    <div className={styles.control} key={id}>
                      <label htmlFor={id}>
                        {label}
                        {REBUILD_KEYS.includes(key) ? " *" : ""}
                      </label>
                      <div>
                        <input
                          id={id}
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={value}
                          onChange={(e) => change(key, e.target.value, index)}
                        />
                        <input
                          aria-label={`${label} value`}
                          type="number"
                          min={min}
                          max={max}
                          step={step}
                          value={Number(value.toFixed(4))}
                          onChange={(e) => change(key, e.target.value, index)}
                        />
                      </div>
                    </div>
                  );
                });
              })}
            </details>
          ))}
          <button className={styles.apply} disabled={!pending} onClick={apply}>
            Apply particle settings
          </button>
          <p>
            * Sampling changes require Apply. Copy config includes pending
            values. Asset: {values.modelUrl}
          </p>
          <p role="status">{status}</p>
          {exportText && (
            <textarea
              aria-label="Exported configuration"
              readOnly
              value={exportText}
              onFocus={(e) => e.target.select()}
            />
          )}
        </>
      )}
    </aside>,
    document.body
  );
}
