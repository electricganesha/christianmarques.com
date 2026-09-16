export function startWebGLTransition(updateCallback, options = {}) {
  if (typeof window === "undefined") {
    updateCallback?.();
    return;
  }
  if (
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    updateCallback?.();
    return;
  }
  window.dispatchEvent(
    new CustomEvent("webgl-page-transition", {
      detail: {
        update: updateCallback,
        mode: options.mode || null,
        scopeSelector: options.scopeSelector || null,
      },
    })
  );
}
