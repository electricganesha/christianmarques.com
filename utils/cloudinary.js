export function convertToCloudinaryBlurURL(url) {
  if (!url.includes("cloudinary")) {
    return;
  }

  url = url.split("/");
  const index = url.indexOf("upload");
  const item = `w_100/e_blur:1000,q_auto,f_webp`;
  url.splice(index + 1, 0, item);

  return url.join("/");
}

export function cleanUpCloudinaryURL(url) {
  if (!url.includes("cloudinary")) {
    return;
  }

  url = url.split("/");
  const index = url.indexOf("upload");
  url.splice(0, index + 1);
  return url.join("/");
}
