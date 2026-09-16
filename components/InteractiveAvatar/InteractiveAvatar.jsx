import React, { useEffect, useRef, useState, useCallback } from "react";
import NextImage from "next/image";
import { Eye, Sparkles } from "lucide-react";
import styles from "./InteractiveAvatar.module.scss";

// Exact center coordinates for each of the 9 frames in both 3x3 spritesheets
const FRAME_CENTERS = [
  // Row 0: Up-Left, Up, Up-Right
  [
    { x: 437, y: 395 },
    { x: 1057, y: 395 },
    { x: 1678, y: 395 },
  ],
  // Row 1: Left, Center, Right
  [
    { x: 437, y: 1030 },
    { x: 1057, y: 1030 },
    { x: 1678, y: 1030 },
  ],
  // Row 2: Down-Left, Down, Down-Right
  [
    { x: 437, y: 1671 },
    { x: 1057, y: 1671 },
    { x: 1678, y: 1671 },
  ],
];

const FRAME_RADIUS = 276; // Diameter = 552px

// 9-frame sequential natural blink sequence from about_face_blinking_spritesheet
const BLINK_SEQUENCE = [
  [0, 0], // eyes open
  [0, 1], // eyelids start closing
  [0, 2], // halfway closed
  [1, 0], // almost closed
  [1, 1], // fully closed
  [1, 2], // fully closed (hold)
  [2, 0], // eyelids opening
  [2, 1], // halfway open
  [2, 2], // wide open
];

export default function InteractiveAvatar({
  staticSrc = "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623788588/christianmarques.com/coverImage.gif",
  staticBlurUrl = "",
  alt = "Christian Marques portrait",
  initialMode = "static",
}) {
  const [mode, setMode] = useState(initialMode); // 'static' | 'interactive'
  const isInteractive = mode === "interactive";

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Spritesheet images
  const faceImgRef = useRef(null);
  const blinkImgRef = useRef(null);
  const isFaceLoadedRef = useRef(false);
  const isBlinkLoadedRef = useRef(false);

  const currentFrameRef = useRef([1, 1]); // [row, col]
  const currentSheetRef = useRef("face"); // 'face' | 'blink'
  const isAnimatingRef = useRef(false);
  const isIdleRef = useRef(true);

  const rafIdRef = useRef(null);
  const idleTimerRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const blinkStepTimerRef = useRef(null);

  const [isFaceLoaded, setIsFaceLoaded] = useState(false);

  // Toggle between static GIF and interactive gaze avatar
  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "static" ? "interactive" : "static"));
  }, []);

  // Handle keyboard activation (Enter or Space)
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMode();
      }
    },
    [toggleMode]
  );

  // Draw a specific [row, col] frame from either sheet onto the canvas
  const renderFrame = useCallback((row, col, sheetType = "face") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = sheetType === "blink" ? blinkImgRef.current : faceImgRef.current;
    const isLoaded =
      sheetType === "blink" ? isBlinkLoadedRef.current : isFaceLoadedRef.current;

    if (!img || !isLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const center = FRAME_CENTERS[row][col];
    const r = FRAME_RADIUS;
    const sx = center.x - r;
    const sy = center.y - r;
    const sw = r * 2;
    const sh = r * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    currentFrameRef.current = [row, col];
    currentSheetRef.current = sheetType;
  }, []);

  // Stop any in-progress blink animation immediately
  const cancelBlink = useCallback(() => {
    if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    if (blinkStepTimerRef.current) clearTimeout(blinkStepTimerRef.current);
    isAnimatingRef.current = false;
  }, []);

  // Helper for randomized organic blink timing intervals
  const getRandomBlinkInterval = () => {
    const roll = Math.random();
    if (roll < 0.25) {
      // Short pause
      return 1200 + Math.random() * 1300;
    } else if (roll < 0.75) {
      // Typical natural pause
      return 2800 + Math.random() * 2600;
    } else {
      // Longer focused pause
      return 5800 + Math.random() * 3200;
    }
  };

  // Execute a natural, fast blink animation sequence (2x faster, ~18ms/frame)
  const triggerBlink = useCallback(
    (isSecondBlink = false) => {
      if (!isIdleRef.current || isAnimatingRef.current || !isBlinkLoadedRef.current) {
        return;
      }

      isAnimatingRef.current = true;
      let step = 0;

      const runBlinkStep = () => {
        if (!isIdleRef.current) {
          isAnimatingRef.current = false;
          return;
        }

        if (step < BLINK_SEQUENCE.length) {
          const [r, c] = BLINK_SEQUENCE[step];
          renderFrame(r, c, "blink");
          step++;
          // Twice as fast: ~18ms per frame (~160ms total duration)
          blinkStepTimerRef.current = setTimeout(runBlinkStep, 18);
        } else {
          // Return to standard center face
          renderFrame(1, 1, "face");
          isAnimatingRef.current = false;

          // Schedule next idle blink with organic randomized intervals
          if (isIdleRef.current) {
            // 20% chance of a natural double-blink
            if (!isSecondBlink && Math.random() < 0.2) {
              blinkTimerRef.current = setTimeout(() => {
                triggerBlink(true);
              }, 120 + Math.random() * 80);
            } else {
              const nextInterval = getRandomBlinkInterval();
              blinkTimerRef.current = setTimeout(() => {
                triggerBlink(false);
              }, nextInterval);
            }
          }
        }
      };

      runBlinkStep();
    },
    [renderFrame]
  );

  // Schedule a blink when idle begins
  const scheduleIdleBlink = useCallback(() => {
    cancelBlink();
    isIdleRef.current = true;
    renderFrame(1, 1, "face");

    // Randomized first blink when entering idle (1.4s - 4.2s)
    const firstInterval = 1400 + Math.random() * 2800;
    blinkTimerRef.current = setTimeout(() => {
      triggerBlink(false);
    }, firstInterval);
  }, [cancelBlink, renderFrame, triggerBlink]);

  // Calculate which frame corresponds to the mouse position
  const getGazeFrame = useCallback((clientX, clientY) => {
    if (!containerRef.current) return [1, 1];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    // Dead zone: look directly forward if mouse is right over the face
    const deadzone = Math.max(50, rect.width * 0.35);
    if (dist < deadzone) {
      return [1, 1];
    }

    // Angle in degrees (-180 to 180)
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (deg >= -22.5 && deg < 22.5) {
      return [1, 2]; // Right
    } else if (deg >= 22.5 && deg < 67.5) {
      return [2, 2]; // Down-Right
    } else if (deg >= 67.5 && deg < 112.5) {
      return [2, 1]; // Down
    } else if (deg >= 112.5 && deg < 157.5) {
      return [2, 0]; // Down-Left
    } else if (deg >= 157.5 || deg < -157.5) {
      return [1, 0]; // Left
    } else if (deg >= -157.5 && deg < -112.5) {
      return [0, 0]; // Up-Left
    } else if (deg >= -112.5 && deg < -67.5) {
      return [0, 1]; // Up
    } else if (deg >= -67.5 && deg < -22.5) {
      return [0, 2]; // Up-Right
    }

    return [1, 1];
  }, []);

  // Update canvas sizing for sharp retina display
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(rect.width || 170);

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const [row, col] = currentFrameRef.current;
    renderFrame(row, col, currentSheetRef.current);
  }, [renderFrame]);

  // Handle active pointer tracking
  const handlePointer = useCallback(
    (clientX, clientY) => {
      if (!isInteractive) return;

      // When the user moves the mouse, cancel any blink and mark active
      isIdleRef.current = false;
      cancelBlink();

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const [targetRow, targetCol] = getGazeFrame(clientX, clientY);
        const [curRow, curCol] = currentFrameRef.current;
        const curSheet = currentSheetRef.current;

        if (targetRow !== curRow || targetCol !== curCol || curSheet !== "face") {
          renderFrame(targetRow, targetCol, "face");
        }
      });

      // Reset idle timer: when pointer stops moving for 800ms, start idle blinking
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        scheduleIdleBlink();
      }, 800);
    },
    [isInteractive, cancelBlink, getGazeFrame, renderFrame, scheduleIdleBlink]
  );

  // Preload and initialize both spritesheets in background
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Directional gaze spritesheet
    const faceImg = new window.Image();
    faceImgRef.current = faceImg;

    faceImg.onload = () => {
      isFaceLoadedRef.current = true;
      setIsFaceLoaded(true);
      updateCanvasSize();
      renderFrame(1, 1, "face");
    };

    faceImg.onerror = () => {
      if (faceImg.src.endsWith(".webp")) {
        faceImg.src = "/images/about_face_spritesheet.jpg";
      }
    };
    faceImg.src = "/images/about_face_spritesheet.webp";

    // 2. Blinking spritesheet
    const blinkImg = new window.Image();
    blinkImgRef.current = blinkImg;

    blinkImg.onload = () => {
      isBlinkLoadedRef.current = true;
    };

    blinkImg.onerror = () => {
      if (blinkImg.src.endsWith(".webp")) {
        blinkImg.src = "/images/about_face_blinking_spritesheet.jpg";
      }
    };
    blinkImg.src = "/images/about_face_blinking_spritesheet.webp";
  }, [updateCanvasSize, renderFrame]);

  // Set up mouse and resize listeners when interactive mode is active
  useEffect(() => {
    if (!isInteractive) return;

    updateCanvasSize();
    scheduleIdleBlink();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const onMouseMove = (e) => {
      if (prefersReducedMotion) return;
      handlePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e) => {
      if (prefersReducedMotion) return;
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onInteractionEnd = () => {
      scheduleIdleBlink();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onInteractionEnd, { passive: true });
    window.addEventListener("touchcancel", onInteractionEnd, { passive: true });
    document.addEventListener("mouseleave", onInteractionEnd);
    window.addEventListener("scroll", onInteractionEnd, { passive: true });
    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("blur", onInteractionEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onInteractionEnd);
      window.removeEventListener("touchcancel", onInteractionEnd);
      document.removeEventListener("mouseleave", onInteractionEnd);
      window.removeEventListener("scroll", onInteractionEnd);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("blur", onInteractionEnd);

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      cancelBlink();
    };
  }, [
    isInteractive,
    handlePointer,
    scheduleIdleBlink,
    cancelBlink,
    updateCanvasSize,
  ]);

  return (
    <div className={styles.avatarSection}>
      <div
        ref={containerRef}
        className={styles.avatarWrapper}
        onClick={toggleMode}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-pressed={isInteractive}
        aria-label={`Christian Marques portrait. Currently in ${
          isInteractive ? "interactive eye-tracking" : "static GIF"
        } mode. Click or press enter to toggle.`}
        title={`Click to switch to ${
          isInteractive ? "original static GIF" : "interactive eye-tracking portrait"
        }`}
      >
        {/* Static GIF layer */}
        <div
          className={styles.staticImageLayer}
          style={{
            display: isInteractive ? "none" : "block",
            visibility: isInteractive ? "hidden" : "visible",
          }}
        >
          {staticBlurUrl ? (
            <NextImage
              placeholder="blur"
              blurDataURL={staticBlurUrl}
              alt={alt}
              width={170}
              height={170}
              src={staticSrc}
              priority
            />
          ) : (
            <img src={staticSrc} alt={alt} />
          )}
        </div>

        {/* Interactive canvas layer */}
        <div
          className={styles.interactiveLayer}
          style={{
            display: isInteractive ? "block" : "none",
            visibility: isInteractive ? "visible" : "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ display: isFaceLoaded ? "block" : "none" }}
          />
          {!isFaceLoaded && (
            <img
              src="/images/about_face_center.jpg"
              alt={alt}
              className={styles.fallbackCenterImage}
              loading="eager"
            />
          )}
        </div>

        {/* Hover indication badge */}
        <div className={styles.modeOverlay}>
          {isInteractive ? <Sparkles size={18} /> : <Eye size={18} />}
          <span>{isInteractive ? "Auto" : "Interactive"}</span>
        </div>
      </div>
    </div>
  );
}
