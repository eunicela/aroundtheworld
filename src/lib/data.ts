import type {
  ArchiveImage,
  City,
  ImageData,
  PhotoCardData,
  Photographer,
  SonderData,
} from "./types";
import { getGalleryThumbnailUrl, getImageUrl, getLightboxUrl } from "./images";
import { GLOBE_RADIUS } from "./geo";
import { resolveImageLocation } from "./location";
import { spreadLift, spreadOnSurface } from "./spread";

const CARD_SCALE = GLOBE_RADIUS / 2;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type CardDraft = {
  image: City["photographers"][number]["images"][number];
  photographer: City["photographers"][number];
  baseLat: number;
  baseLon: number;
};

export function buildAllPhotoCards(cities: City[]): PhotoCardData[] {
  return cities.flatMap((city) => buildPhotoCardsForCity(city));
}

export function buildPhotoCardsForCity(city: City): PhotoCardData[] {
  const drafts: CardDraft[] = [];

  for (const photographer of city.photographers) {
    for (const image of photographer.images) {
      const { lat, lon } = resolveImageLocation(image, city);
      drafts.push({ image, photographer, baseLat: lat, baseLon: lon });
    }
  }

  const cards: PhotoCardData[] = [];

  drafts.forEach((draft, index) => {
      const isPortrait = draft.image.orientation === "portrait";
      const baseW =
        (isPortrait ? randomInRange(0.2, 0.28) : randomInRange(0.24, 0.32)) *
        CARD_SCALE;
      const baseH = isPortrait ? baseW * 1.2 : baseW * 0.82;
      const cardSize = Math.max(baseW, baseH);
      const spreadSeed = `${draft.image.id}-${city.id}`;
      const { east, north } = spreadOnSurface(
        index,
        drafts.length,
        spreadSeed,
        cardSize
      );
      const lift = spreadLift(index, drafts.length, spreadSeed, cardSize);

      cards.push({
        id: draft.image.id,
        imageUrl: getImageUrl(
          draft.image.cloudinaryId,
          400,
          isPortrait ? 500 : 300,
          draft.image.format
        ),
        photographerId: draft.photographer.id,
        photographerName: draft.photographer.name,
        cityId: city.id,
        cityName: city.name,
        year: draft.image.year,
        url: draft.photographer.url,
        orientation: draft.image.orientation,
        width: baseW,
        height: baseH,
        tilt: 0,
        driftPhase: 0,
        driftSpeed: 0,
        offsetX: east,
        offsetY: lift,
        offsetZ: north,
        lat: draft.baseLat,
        lon: draft.baseLon,
      });
  });

  return cards;
}

export function findImageInData(
  data: SonderData,
  cityId: string,
  imageId: string
): ImageData | undefined {
  const city = data.cities.find((c) => c.id === cityId);
  if (!city) return undefined;

  for (const photographer of city.photographers) {
    const image = photographer.images.find((img) => img.id === imageId);
    if (image) return image;
  }
  return undefined;
}

export function getPhotographerFromData(
  data: SonderData,
  id: string
): Photographer | undefined {
  let merged: Photographer | undefined;

  for (const city of data.cities) {
    const photographer = city.photographers.find((p) => p.id === id);
    if (!photographer) continue;

    if (!merged) {
      merged = { ...photographer, images: [...photographer.images] };
      continue;
    }

    merged = {
      ...merged,
      bio: photographer.bio || merged.bio,
      url: photographer.url || merged.url,
      instagram: photographer.instagram ?? merged.instagram,
      images: [...merged.images, ...photographer.images],
    };
  }

  return merged;
}

function galleryThumbnailDimensions(
  imageId: string,
  orientation: ImageData["orientation"]
): { width: number; height: number } {
  let hash = 0;
  for (let i = 0; i < imageId.length; i++) {
    hash = (hash * 31 + imageId.charCodeAt(i)) | 0;
  }
  const t = (Math.abs(hash) % 1000) / 1000;
  const width = 440;

  if (orientation === "portrait") {
    return { width, height: Math.round(width * (1.1 + t * 0.65)) };
  }

  return { width, height: Math.round(width * (0.5 + t * 0.45)) };
}

export function getPhotoDisplayDimensions(
  imageId: string,
  orientation: ImageData["orientation"]
): { width: number; height: number } {
  return galleryThumbnailDimensions(imageId, orientation);
}

function buildArchiveImage(
  city: City,
  photographer: Photographer,
  image: Photographer["images"][number]
): ArchiveImage {
  const title = image.title ?? `${photographer.name}, ${city.name}`;
  const caption = image.caption ?? photographer.bio;
  const thumb = galleryThumbnailDimensions(image.id, image.orientation);

  return {
    id: image.id,
    cityId: city.id,
    cityName: city.name,
    cloudinaryId: image.cloudinaryId,
    orientation: image.orientation,
    year: image.year,
    title,
    caption,
    photographerId: photographer.id,
    photographerName: photographer.name,
    photographerBio: photographer.bio,
    photographerUrl: photographer.url,
    photographerInstagram: photographer.instagram,
    thumbnailUrl: getGalleryThumbnailUrl(
      image.cloudinaryId,
      thumb.width,
      thumb.height,
      image.format
    ),
    fullUrl: getLightboxUrl(image.cloudinaryId, image.format),
  };
}

export function getAllArchiveImages(data: SonderData): ArchiveImage[] {
  const images: ArchiveImage[] = [];

  for (const city of data.cities) {
    for (const photographer of city.photographers) {
      for (const image of photographer.images) {
        images.push(buildArchiveImage(city, photographer, image));
      }
    }
  }

  return images;
}

export function getArchiveImage(
  data: SonderData,
  cityId: string,
  imageId: string
): ArchiveImage | undefined {
  const city = data.cities.find((c) => c.id === cityId);
  if (!city) return undefined;

  for (const photographer of city.photographers) {
    const image = photographer.images.find((img) => img.id === imageId);
    if (image) return buildArchiveImage(city, photographer, image);
  }

  return undefined;
}
