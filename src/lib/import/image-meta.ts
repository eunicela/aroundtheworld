import "server-only";

import type { Orientation } from "@/lib/types";

export function getImageDimensions(
  buffer: Buffer,
  mimeType: string
): { width: number; height: number } {
  if (mimeType === "image/png") {
    return readPngDimensions(buffer);
  }

  if (mimeType === "image/jpeg") {
    return readJpegDimensions(buffer);
  }

  if (mimeType === "image/webp") {
    return readWebpDimensions(buffer);
  }

  throw new Error("Unsupported image type");
}

export function orientationFromDimensions(
  width: number,
  height: number
): Orientation {
  return width >= height ? "landscape" : "portrait";
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Invalid PNG image");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Invalid JPEG image");
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }

  throw new Error("Could not read JPEG dimensions");
}

function readWebpDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Invalid WebP image");
  }

  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L") {
    const bits =
      buffer[21] | (buffer[22] << 8) | (buffer[23] << 16) | (buffer[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunkType === "VP8X") {
    return {
      width: 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)),
      height: 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)),
    };
  }

  throw new Error("Could not read WebP dimensions");
}

export function filenameFromUrl(url: string, mimeType: string): string {
  const pathname = new URL(url).pathname;
  const basename = pathname.split("/").pop() ?? "imported-image";
  const decoded = decodeURIComponent(basename);

  if (/\.(jpe?g|png|webp)$/i.test(decoded)) {
    return decoded;
  }

  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
  return `${decoded}.${ext}`;
}

export function parseYear(raw: string): { year: string; warning?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { year: "" };
  }

  if (trimmed.includes(".")) {
    const [first] = trimmed.split(".");
    return {
      year: first,
      warning: "Year may be approximate — verify before publishing",
    };
  }

  return { year: trimmed };
}
