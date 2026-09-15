import React from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./SoundControl.module.scss";

export default function SoundControl({
  enabled,
  busy,
  visible,
  error,
  onToggle,
}) {
  if (!visible) return null;
  return createPortal(
    <div className={styles.sound}>
      <button
        type="button"
        aria-pressed={enabled}
        aria-label={enabled ? "Mute sound" : "Enable sound"}
        disabled={busy}
        onClick={onToggle}
      >
        {enabled ? (
          <Volume2 size={24} aria-hidden="true" />
        ) : (
          <VolumeX size={24} aria-hidden="true" />
        )}
      </button>
      {error && <span role="status">{error}</span>}
    </div>,
    document.body
  );
}
