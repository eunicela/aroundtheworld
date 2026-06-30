import "server-only";

import { slugify } from "@/lib/admin";
import type { GalleryScanResult, ImportPhoto } from "./types";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, "")).trim();
}

function pageTitleFromHtml(html: string): string {
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i);
  if (ogTitle?.[1]) {
    return stripHtml(ogTitle[1]);
  }

  const title = html.match(/<title>([^<]+)<\/title>/i);
  return title?.[1] ? stripHtml(title[1]) : "Imported gallery";
}

function cleanPageTitle(title: string): string {
  return title.replace(/\s*[—–-]\s*Fan Ho Photography\s*$/i, "").trim();
}

function parseSquarespaceSlides(html: string): ImportPhoto[] {
  const pattern =
    /data-title="([^"]+)"\s+data-description="([^"]+)"[^>]*href="([^"]+)"/g;
  const photos: ImportPhoto[] = [];
  const seen = new Set<string>();
  const usedIds = new Set<string>();

  for (const match of html.matchAll(pattern)) {
    const title = decodeHtmlEntities(match[1]).trim();
    const yearRaw = stripHtml(decodeHtmlEntities(match[2]));
    const imageUrl = match[3].split("?")[0];

    if (!title || !imageUrl || seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    const baseId =
      slugify(title.split(/\s+/).slice(0, 4).join(" ")) ||
      `photo-${photos.length + 1}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    photos.push({
      id,
      title,
      year: yearRaw.includes(".") ? yearRaw.split(".")[0] : yearRaw,
      yearRaw,
      imageUrl,
    });
  }

  return photos;
}

export function isSquarespaceGallery(html: string): boolean {
  return (
    html.includes("images.squarespace-cdn.com") &&
    /data-title="[^"]+"\s+data-description="[^"]+"/.test(html)
  );
}

export function parseSquarespaceGallery(
  html: string,
  sourceUrl: string
): GalleryScanResult {
  const photos = parseSquarespaceSlides(html);
  if (photos.length === 0) {
    throw new Error("No photos found on this page");
  }

  const pageTitle = cleanPageTitle(pageTitleFromHtml(html));
  const warnings: string[] = [];

  if (html.includes("Years may not denote year photo taken")) {
    warnings.push("Years on this page may not be the year each photo was taken");
  }

  if (photos.some((photo) => photo.yearRaw.includes("."))) {
    warnings.push("Some years use compound dates — verify before publishing");
  }

  return {
    type: "squarespace-gallery",
    sourceUrl,
    pageTitle,
    photos,
    warnings,
  };
}
