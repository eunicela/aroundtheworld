import type { Orientation } from "@/lib/types";

export interface ImportPhoto {
  id: string;
  title: string;
  year: string;
  yearRaw: string;
  imageUrl: string;
}

export interface ImportPhotographerDefaults {
  name: string;
  url: string;
  instagram?: string;
}

export interface GalleryScanResult {
  type: "squarespace-gallery";
  sourceUrl: string;
  pageTitle: string;
  suggestedCity?: string;
  suggestedCaption?: string;
  photographer?: ImportPhotographerDefaults;
  photos: ImportPhoto[];
  warnings: string[];
}

export interface PhotoImportResult {
  title: string;
  year: string;
  yearRaw: string;
  yearWarning?: string;
  orientation: Orientation;
  caption?: string;
  sourceUrl?: string;
  image: {
    base64: string;
    mimeType: string;
    filename: string;
    width: number;
    height: number;
  };
  photographer?: ImportPhotographerDefaults;
  suggestedCity?: string;
}
