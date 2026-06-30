import type { FeatureCollection, LineString, MultiLineString } from "geojson";
import * as THREE from "three";
import { GLOBE_RADIUS, latLonToVector3 } from "./geo";

const cache = new Map<number, THREE.BufferGeometry[]>();

function coordsToPoints(
  coords: number[][],
  radius: number
): THREE.Vector3[] {
  return coords.map(([lon, lat]) => latLonToVector3(lat, lon, radius));
}

function processGeometry(
  geometry: LineString | MultiLineString,
  radius: number
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  if (geometry.type === "LineString") {
    const points = coordsToPoints(geometry.coordinates, radius);
    if (points.length >= 2) {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      geometries.push(geo);
    }
  } else if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates) {
      const points = coordsToPoints(line, radius);
      if (points.length >= 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        geometries.push(geo);
      }
    }
  }

  return geometries;
}

export async function loadCoastlineGeometries(
  radius: number = GLOBE_RADIUS + 0.008
): Promise<THREE.BufferGeometry[]> {
  const cached = cache.get(radius);
  if (cached) return cached;

  const response = await fetch("/coastline.geojson");
  const data = (await response.json()) as FeatureCollection;

  const geometries: THREE.BufferGeometry[] = [];

  for (const feature of data.features) {
    if (!feature.geometry) continue;
    const geom = feature.geometry;
    if (geom.type === "LineString" || geom.type === "MultiLineString") {
      geometries.push(...processGeometry(geom, radius));
    }
  }

  cache.set(radius, geometries);
  return geometries;
}

export function clearCoastlineCache() {
  cache.clear();
}
