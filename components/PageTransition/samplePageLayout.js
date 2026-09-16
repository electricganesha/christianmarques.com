/**
 * samplePageLayout.js
 *
 * Samples the visible DOM elements within the current viewport and distributes
 * particles across their bounding rectangles in WebGL clipspace coordinates [-1, 1].
 */

export function samplePageLayout(particleCount = 4200, scopeSelector = null) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return createFallbackDistribution(particleCount);
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let root = document;
  if (scopeSelector) {
    const el =
      typeof scopeSelector === "string"
        ? document.querySelector(scopeSelector)
        : scopeSelector;
    if (el) root = el;
  }

  // Query visible content elements in main layout and headers
  const selectors = "h1, h2, h3, h4, p, a, button, img, article, section, blockquote, figure, [role='article'], .card, ul, ol";
  const elements = Array.from(root.querySelectorAll(selectors));
  if (root !== document && root.matches?.(selectors)) {
    elements.push(root);
  }

  const validRects = [];
  let totalArea = 0;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.offsetParent === null) continue;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) < 0.1) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    // Intersecting visible viewport
    if (
      rect.bottom > 30 &&
      rect.top < vh - 30 &&
      rect.right > 20 &&
      rect.left < vw - 20 &&
      rect.width > 6 &&
      rect.height > 6
    ) {
      const left = Math.max(0, rect.left);
      const right = Math.min(vw, rect.right);
      const top = Math.max(0, rect.top);
      const bottom = Math.min(vh, rect.bottom);
      const width = right - left;
      const height = bottom - top;
      const area = width * height;

      if (area > 30) {
        // Boost typography so text headings form clear particle silhouettes
        const isHeading = /^H[1-4]$/.test(el.tagName);
        const weight = isHeading ? 3.0 : 1.0;
        validRects.push({ left, top, width, height, area: area * weight });
        totalArea += area * weight;
      }
    }
  }

  if (validRects.length === 0 || totalArea === 0) {
    return createFallbackDistribution(particleCount, vw, vh);
  }

  const positions = new Float32Array(particleCount * 2);

  let pIndex = 0;
  for (let i = 0; i < validRects.length; i++) {
    const r = validRects[i];
    const quota = Math.max(8, Math.floor((r.area / totalArea) * particleCount));

    for (let k = 0; k < quota && pIndex < particleCount; k++) {
      const px = r.left + (0.04 + Math.random() * 0.92) * r.width;
      const py = r.top + (0.04 + Math.random() * 0.92) * r.height;

      // Convert viewport pixels to WebGL clipspace [-1, 1]
      const clipX = (px / vw) * 2.0 - 1.0;
      const clipY = 1.0 - (py / vh) * 2.0;

      positions[pIndex * 2] = clipX;
      positions[pIndex * 2 + 1] = clipY;
      pIndex++;
    }
  }

  // Fill remaining quota randomly across collected rects
  while (pIndex < particleCount) {
    const r = validRects[Math.floor(Math.random() * validRects.length)];
    const px = r.left + (0.04 + Math.random() * 0.92) * r.width;
    const py = r.top + (0.04 + Math.random() * 0.92) * r.height;

    positions[pIndex * 2] = (px / vw) * 2.0 - 1.0;
    positions[pIndex * 2 + 1] = 1.0 - (py / vh) * 2.0;
    pIndex++;
  }

  return positions;
}

function createFallbackDistribution(particleCount, vw = 1200, vh = 800) {
  const positions = new Float32Array(particleCount * 2);
  for (let i = 0; i < particleCount; i++) {
    const x = (0.2 + Math.random() * 0.6) * 2.0 - 1.0;
    const y = 1.0 - (0.25 + Math.random() * 0.5) * 2.0;
    positions[i * 2] = x;
    positions[i * 2 + 1] = y;
  }
  return positions;
}
