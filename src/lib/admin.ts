import "server-only";

import fs from "fs/promises";
import path from "path";
import type { City, ImageData, Photographer, SonderData } from "./types";
import { decodePlusCode } from "./pluscode";

const DATA_PATH = path.join(process.cwd(), "src/data/sonder.json");
const PUBLIC_DIR = path.join(process.cwd(), "public");

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export function isAdminAuthorized(password: string | null): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return password === expected;
}

export function isAdminEnabled(): boolean {
  return Boolean(getAdminPassword());
}

export async function readSonderData(): Promise<SonderData> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as SonderData;
}

export async function writeSonderData(data: SonderData): Promise<void> {
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(DATA_PATH, json, "utf8");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extensionFromMime(mime: string): ImageData["format"] {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function nextImageId(
  photographerId: string,
  images: ImageData[]
): string {
  const numbers = images
    .map((image) => {
      const match = image.id.match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((n) => n > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${photographerId}-${String(next).padStart(2, "0")}`;
}

export async function saveImageFile(
  cloudinaryId: string,
  buffer: Buffer,
  format: ImageData["format"]
): Promise<string> {
  const ext = format === "jpeg" ? "jpg" : format;
  const filePath = path.join(PUBLIC_DIR, `${cloudinaryId}.${ext}`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function addImageToCatalog(input: {
  cityId?: string | null;
  newCity?: {
    name: string;
    lat: number;
    lon: number;
  };
  photographerId: string | null;
  newPhotographer?: {
    name: string;
    bio: string;
    url: string;
    instagram?: string;
  };
  file: Buffer;
  mimeType: string;
  title?: string;
  caption?: string;
  year?: string;
  orientation: ImageData["orientation"];
  lat?: number;
  lon?: number;
  plusCode?: string;
}): Promise<{
  imageId: string;
  cloudinaryId: string;
  publicPath: string;
  cityId: string;
}> {
  const data = await readSonderData();
  let cityIndex: number;
  let city: City;

  if (input.newCity) {
    const id = slugify(input.newCity.name);
    if (!id) throw new Error("City name must contain letters or numbers");

    cityIndex = data.cities.findIndex((entry) => entry.id === id);
    if (cityIndex === -1) {
      city = {
        id,
        name: input.newCity.name,
        lat: input.newCity.lat,
        lon: input.newCity.lon,
        photographers: [],
      };
      data.cities.push(city);
      cityIndex = data.cities.length - 1;
    } else {
      city = data.cities[cityIndex];
    }
  } else if (input.cityId) {
    cityIndex = data.cities.findIndex((entry) => entry.id === input.cityId);
    if (cityIndex === -1) throw new Error("City not found");
    city = data.cities[cityIndex];
  } else {
    throw new Error("City is required");
  }

  let photographer: Photographer;

  if (input.photographerId) {
    const found = city.photographers.find((p) => p.id === input.photographerId);
    if (!found) throw new Error("Photographer not found");
    photographer = found;
  } else {
    if (!input.newPhotographer?.name || !input.newPhotographer.bio || !input.newPhotographer.url) {
      throw new Error("New photographer details are required");
    }

    const id = slugify(input.newPhotographer.name);
    if (!id) throw new Error("Photographer name must contain letters or numbers");
    if (city.photographers.some((p) => p.id === id)) {
      throw new Error("A photographer with this name already exists in this city");
    }

    photographer = {
      id,
      name: input.newPhotographer.name,
      bio: input.newPhotographer.bio,
      url: input.newPhotographer.url,
      ...(input.newPhotographer.instagram
        ? { instagram: input.newPhotographer.instagram }
        : {}),
      images: [],
    };

    city = {
      ...city,
      photographers: [...city.photographers, photographer],
    };
  }

  const format = extensionFromMime(input.mimeType);
  const imageId = nextImageId(photographer.id, photographer.images);
  const cloudinaryId = `sonder/${city.id}/${imageId}`;

  let lat = input.lat;
  let lon = input.lon;

  if ((lat === undefined || lon === undefined) && input.plusCode) {
    const decoded = decodePlusCode(input.plusCode, {
      lat: city.lat,
      lon: city.lon,
    });
    if (!decoded) throw new Error("Invalid plus code");
    lat = decoded.lat;
    lon = decoded.lon;
  }

  if (lat === undefined || lon === undefined) {
    lat = city.lat;
    lon = city.lon;
  }

  const image: ImageData = {
    id: imageId,
    cloudinaryId,
    orientation: input.orientation,
    format,
    lat,
    lon,
    ...(input.year ? { year: input.year } : {}),
    ...(input.title ? { title: input.title } : {}),
    ...(input.caption ? { caption: input.caption } : {}),
    ...(input.plusCode ? { plusCode: input.plusCode } : {}),
  };

  const updatedPhotographer: Photographer = {
    ...photographer,
    images: [...photographer.images, image],
  };

  city = {
    ...city,
    photographers: city.photographers.map((p) =>
      p.id === photographer.id ? updatedPhotographer : p
    ),
  };

  data.cities[cityIndex] = city;

  const publicPath = await saveImageFile(cloudinaryId, input.file, format);
  await writeSonderData(data);

  return { imageId, cloudinaryId, publicPath, cityId: city.id };
}
