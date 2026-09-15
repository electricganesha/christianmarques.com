import * as THREE from "three/webgpu";

/**
 * Encapsulates all DOM pointer, touch, scroll, focus, and blur listeners.
 * Normalizes screen-space coordinates and enforces touch/UI target gating.
 */
export class InteractionManager {
  constructor(container, getElapsed, audioRef, onMotionChange) {
    this.container = container;
    this.getElapsed = getElapsed;
    this.audioRef = audioRef;
    this.onMotionChange = onMotionChange;

    this.pointer = new THREE.Vector2();
    this.smoothPointer = new THREE.Vector2();
    this.pointerActive = false;
    this.pressed = false;
    this.touch = false;
    this.lastPointerTime = -100;
    this.pulseRequested = false;

    this.disposers = [];
    this.initListeners();
  }

  listen(target, name, handler, options = { passive: true }) {
    target.addEventListener(name, handler, options);
    this.disposers.push(() => target.removeEventListener(name, handler, options));
  }

  handlePointerMove = (event) => {
    if (event.pointerType === "touch") {
      if (!event.isPrimary) return;
      // Only gestures started in the designated play area are musical.
      if (!event.target?.closest?.("[data-ganesha-touch]")) {
        this.leave();
        return;
      }
    }

    // Skip interactive UI elements such as links, buttons, and debug panel
    if (
      event.target?.closest?.(
        "[data-ganesha-debug], a, button, input, textarea, select, [role=button]"
      )
    ) {
      this.leave();
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const previousX = this.pointer.x;
    const previousY = this.pointer.y;

    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.pointerActive =
      Math.abs(this.pointer.x) <= 1 &&
      Math.abs(this.pointer.y) <= 1 &&
      window.scrollY < rect.height * 0.8;

    this.touch = event.pointerType === "touch";

    if (
      Math.abs(this.pointer.x - previousX) + Math.abs(this.pointer.y - previousY) >
      0.0001
    ) {
      this.lastPointerTime = this.getElapsed();
    }
  };

  handlePointerDown = (event) => {
    if (event.pointerType === "touch" && !event.isPrimary) return;
    this.handlePointerMove(event);
    this.pressed = this.pointerActive && event.button === 0;

    if (this.pressed) {
      if (event.pointerType === "touch") {
        event.target.setPointerCapture?.(event.pointerId);
      }
      this.pulseRequested = true;
      this.audioRef.current?.beginPath();
    }
  };

  handlePointerUp = (event) => {
    if (event.pointerType === "touch" && !event.isPrimary) return;
    if (this.pressed) {
      this.audioRef.current?.endPath();
    }
    this.pressed = false;
    if (this.touch) {
      this.pointerActive = false;
    }
  };

  leave = () => {
    this.pointerActive = false;
    this.pressed = false;
    this.audioRef.current?.cancelPath();
  };

  initListeners() {
    this.listen(window, "pointermove", this.handlePointerMove);
    this.listen(window, "pointerdown", this.handlePointerDown);
    this.listen(window, "pointerup", this.handlePointerUp);
    this.listen(window, "pointercancel", this.leave);
    this.listen(document.documentElement, "pointerleave", this.leave);

    this.listen(window, "blur", () => {
      this.leave();
      this.audioRef.current?.setActive(false);
    });

    this.listen(window, "scroll", this.leave);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = motionQuery.matches;
    this.listen(motionQuery, "change", () => {
      this.reducedMotion = motionQuery.matches;
      this.onMotionChange?.(this.reducedMotion);
    });
  }

  dispose() {
    this.leave();
    this.disposers.forEach((dispose) => dispose());
    this.disposers.length = 0;
  }
}
