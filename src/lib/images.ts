import type { ImageFormat } from "./types";

function localExtension(format?: ImageFormat): string {
  if (!format || format === "jpg" || format === "jpeg") return "jpg";
  return format;
}

function placeholderSeed(cloudinaryId: string): string {
  return cloudinaryId.replace(/\//g, "-");
}

function placeholderUrl(
  cloudinaryId: string,
  width: number,
  height?: number
): string {
  const h = height ?? Math.round(width * 1.25);
  const seed = encodeURIComponent(placeholderSeed(cloudinaryId));
  return `https://picsum.photos/seed/${seed}/${width}/${h}`;
}

export function getImageUrl(
  cloudinaryId: string,
  width: number,
  height?: number,
  format?: ImageFormat
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (cloudName) {
    const h = height ?? Math.round(width * 1.25);
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${h},c_fill,q_auto,f_auto/${cloudinaryId}`;
  }

  if (format) {
    return placeholderUrl(cloudinaryId, width, height);
  }

  return `/${cloudinaryId}.${localExtension(format)}`;
}

export function getGalleryThumbnailUrl(
  cloudinaryId: string,
  width: number,
  height: number,
  format?: ImageFormat
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fit,q_auto,f_auto/${cloudinaryId}`;
  }

  if (format) {
    return placeholderUrl(cloudinaryId, width, height);
  }

  return `/${cloudinaryId}.${localExtension(format)}`;
}

export function getLightboxUrl(
  cloudinaryId: string,
  format?: ImageFormat
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${cloudinaryId}`;
  }

  if (format) {
    return placeholderUrl(cloudinaryId, 1400, 1050);
  }

  return `/${cloudinaryId}.${localExtension(format)}`;
}
