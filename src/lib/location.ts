import type { City, ImageData } from "./types";
import { decodePlusCode } from "./pluscode";
import { scatterAroundCity } from "./spread";

export function resolveImageLocation(
  image: ImageData,
  city: City
): { lat: number; lon: number } {
  if (image.lat !== undefined && image.lon !== undefined) {
    const dLat = Math.abs(image.lat - city.lat);
    const dLon = Math.abs(image.lon - city.lon);

    if (image.plusCode || dLat > 0.25 || dLon > 0.25) {
      return { lat: image.lat, lon: image.lon };
    }
  }

  if (image.plusCode) {
    const decoded = decodePlusCode(image.plusCode, {
      lat: city.lat,
      lon: city.lon,
    });
    if (decoded) return decoded;
  }

  return scatterAroundCity(image.id, city);
}
