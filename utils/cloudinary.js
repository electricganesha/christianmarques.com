export function convertToCloudinaryBlurURL(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary")) {
    return url;
  }

  const parts = url.split("/");
  const index = parts.indexOf("upload");
  if (index === -1) return url;
  const item = `w_100/e_blur:1000,q_auto,f_webp`;
  parts.splice(index + 1, 0, item);

  return parts.join("/");
}

export function cleanUpCloudinaryURL(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary")) {
    return url;
  }

  const parts = url.split("/");
  const index = parts.indexOf("upload");
  if (index === -1) return url;
  parts.splice(0, index + 1);
  return parts.join("/");
}

/**
 * Generates an optimized Cloudinary URL with responsive width, auto-format (WebP/AVIF),
 * and automatic quality compression.
 */
export function getOptimizedCloudinaryUrl(url, { width = 800, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary")) {
    return url;
  }

  const parts = url.split("/");
  const index = parts.indexOf("upload");
  if (index === -1) return url;

  const transform = `w_${width},c_limit,q_${quality},f_${format}`;
  parts.splice(index + 1, 0, transform);

  return parts.join("/");
}

/**
 * Generates a standard srcset string for responsive images on Cloudinary.
 */
export function getCloudinarySrcSet(url, widths = [400, 800, 1200, 1600]) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary")) {
    return undefined;
  }

  return widths
    .map((w) => `${getOptimizedCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(", ");
}
