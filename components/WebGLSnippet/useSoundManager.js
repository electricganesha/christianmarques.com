import { useRef, useState, useCallback, useEffect } from "react";
import { ElectricGaneshaAudio } from "./audio/ElectricGaneshaAudio";

export function useSoundManager() {
  const audioRef = useRef(null);
  const audioEventRef = useRef(null);
  const aliveRef = useRef(true);
  const soundBusyRef = useRef(false);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundBusy, setSoundBusy] = useState(false);
  const [soundError, setSoundError] = useState("");

  const toggleSound = useCallback(async () => {
    if (soundBusyRef.current) return;
    if (audioRef.current) {
      audioRef.current.dispose();
      audioRef.current = null;
      setSoundEnabled(false);
      return;
    }

    soundBusyRef.current = true;
    setSoundBusy(true);
    setSoundError("");

    try {
      const engine = new ElectricGaneshaAudio((event) =>
        audioEventRef.current?.(event)
      );
      audioRef.current = engine;
      await engine.enable();
      if (aliveRef.current) setSoundEnabled(true);
    } catch (error) {
      audioRef.current?.dispose();
      audioRef.current = null;
      if (aliveRef.current) {
        setSoundError(
          error.message || "Sound could not start. Please try again."
        );
      }
    } finally {
      soundBusyRef.current = false;
      if (aliveRef.current) setSoundBusy(false);
    }
  }, []);

  const setActive = useCallback((active) => {
    audioRef.current?.setActive(active);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      audioRef.current?.dispose();
      audioRef.current = null;
      audioEventRef.current = null;
    };
  }, []);

  return {
    audioRef,
    audioEventRef,
    soundEnabled,
    soundBusy,
    soundError,
    toggleSound,
    setActive,
  };
}
