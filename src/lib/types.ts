export type Orientation = "portrait" | "landscape";

export type ViewMode = "globe" | "timeline";

export type ImageFormat = "jpg" | "jpeg" | "png" | "webp";

export interface ImageData {
  id: string;
  cloudinaryId: string;
  year?: string;
  orientation: Orientation;
  title?: string;
  caption?: string;
  format?: ImageFormat;
  lat?: number;
  lon?: number;
  plusCode?: string;
}

export interface Photographer {
  id: string;
  name: string;
  bio: string;
  url: string;
  instagram?: string;
  images: ImageData[];
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  photographers: Photographer[];
}

export interface SonderData {
  cities: City[];
}

export interface PhotoCardData {
  id: string;
  imageUrl: string;
  photographerId: string;
  photographerName: string;
  cityId: string;
  cityName: string;
  year?: string;
  url: string;
  orientation: Orientation;
  width: number;
  height: number;
  tilt: number;
  driftPhase: number;
  driftSpeed: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  lat: number;
  lon: number;
}

export interface ActivePhoto {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  photographerId: string;
  photographerName: string;
  cityId: string;
  cityName: string;
  year?: string;
  title?: string;
  editorialCaption?: string;
  fallbackCaption?: string;
  url: string;
  instagram?: string;
  lon: number;
}

export interface ArchiveImage {
  id: string;
  cityId: string;
  cityName: string;
  cloudinaryId: string;
  orientation: Orientation;
  year?: string;
  title: string;
  caption: string;
  photographerId: string;
  photographerName: string;
  photographerBio: string;
  photographerUrl: string;
  photographerInstagram?: string;
  thumbnailUrl: string;
  fullUrl: string;
}
