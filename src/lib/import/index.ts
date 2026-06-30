import "server-only";

import { applySiteDefaults } from "./defaults";
import { fetchHtml, fetchImage } from "./fetch";
import {
  filenameFromUrl,
  getImageDimensions,
  orientationFromDimensions,
  parseYear,
} from "./image-meta";
import { isSquarespaceGallery, parseSquarespaceGallery } from "./squarespace";
import type { GalleryScanResult, PhotoImportResult } from "./types";

export async function scanGalleryUrl(url: string): Promise<GalleryScanResult> {
  const html = await fetchHtml(url);

  if (!isSquarespaceGallery(html)) {
    throw new Error(
      "This page format is not supported yet. Try a Squarespace gallery URL."
    );
  }

  const scan = parseSquarespaceGallery(html, url);
  return applySiteDefaults(scan, url);
}

export async function importPhotoFromUrl(input: {
  imageUrl: string;
  title: string;
  yearRaw?: string;
  sourceUrl?: string;
  suggestedCaption?: string;
  photographer?: GalleryScanResult["photographer"];
  suggestedCity?: string;
}): Promise<PhotoImportResult> {
  const { buffer, mimeType } = await fetchImage(input.imageUrl);
  const { width, height } = getImageDimensions(buffer, mimeType);
  const yearInfo = parseYear(input.yearRaw ?? "");

  return {
    title: input.title,
    year: yearInfo.year,
    yearRaw: input.yearRaw ?? "",
    yearWarning: yearInfo.warning,
    orientation: orientationFromDimensions(width, height),
    caption: input.suggestedCaption,
    sourceUrl: input.sourceUrl,
    image: {
      base64: buffer.toString("base64"),
      mimeType,
      filename: filenameFromUrl(input.imageUrl, mimeType),
      width,
      height,
    },
    photographer: input.photographer,
    suggestedCity: input.suggestedCity,
  };
}
