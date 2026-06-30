import * as THREE from "three";

export const GLOBE_RADIUS = 1.35;

export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number = GLOBE_RADIUS
): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function vector3ToLatLon(
  v: THREE.Vector3
): { lat: number; lon: number } {
  const normalized = v.clone().normalize();
  const lat = 90 - (Math.acos(normalized.y) * 180) / Math.PI;
  const lon =
    ((Math.atan2(normalized.z, -normalized.x) * 180) / Math.PI) - 180;
  return { lat, lon };
}

const CAMERA_FACING = new THREE.Vector3(0, 0, 1);

export function shortestAngleDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return from + delta;
}

/** X-axis spin only — no yaw or roll, globe tilts within the vertical plane. */
export function computeGlobeXRotationToFace(
  lat: number,
  lon: number,
  offsetEast = 0,
  offsetNorth = 0
): number {
  const point = positionOnGlobe(lat, lon, offsetEast, offsetNorth, 0);
  return Math.atan2(point.y, point.z);
}

/** Y then X rotation (no Z roll) to face the camera — pitch + yaw only. */
export function computeGlobeYXRotationToFaceCamera(
  lat: number,
  lon: number,
  offsetEast: number,
  offsetNorth: number,
  cameraPosition: THREE.Vector3
): { x: number; y: number } {
  const point = positionOnGlobe(lat, lon, offsetEast, offsetNorth, 0).normalize();
  const cam = cameraPosition.clone().normalize();

  const y = -Math.atan2(point.x, point.z) + Math.atan2(cam.x, cam.z);

  const sinY = Math.sin(y);
  const cosY = Math.cos(y);
  const y2 = point.y;
  const z2 = -point.x * sinY + point.z * cosY;

  const x = Math.atan2(cam.y, cam.z) - Math.atan2(y2, z2);

  return { x, y };
}

/** Y-axis spin only — rotate globe so a point faces the camera's current bearing. */
export function computeGlobeYRotationToFaceCamera(
  lat: number,
  lon: number,
  offsetEast: number,
  offsetNorth: number,
  cameraPosition: THREE.Vector3
): number {
  const point = positionOnGlobe(lat, lon, offsetEast, offsetNorth, 0);
  const cam = cameraPosition.clone().normalize();
  return -Math.atan2(point.x, point.z) + Math.atan2(cam.x, cam.z);
}

/** Y-axis spin to face default front camera (+Z). */
export function computeGlobeYRotationToFace(
  lat: number,
  lon: number,
  offsetEast = 0,
  offsetNorth = 0
): number {
  return computeGlobeYRotationToFaceCamera(
    lat,
    lon,
    offsetEast,
    offsetNorth,
    CAMERA_FACING.clone().multiplyScalar(5.5)
  );
}

export function computeGlobeQuaternionToFace(
  lat: number,
  lon: number,
  offsetEast = 0,
  offsetNorth = 0
): THREE.Quaternion {
  const point = positionOnGlobe(lat, lon, offsetEast, offsetNorth, 0).normalize();
  return new THREE.Quaternion().setFromUnitVectors(point, CAMERA_FACING);
}

export function computeGlobeRotationToFace(
  lat: number,
  lon: number
): THREE.Euler {
  const quaternion = computeGlobeQuaternionToFace(lat, lon);
  return new THREE.Euler().setFromQuaternion(quaternion, "YXZ");
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function tangentFrame(normal: THREE.Vector3): {
  east: THREE.Vector3;
  north: THREE.Vector3;
} {
  const worldUp = new THREE.Vector3(0, 1, 0);
  let east = new THREE.Vector3().crossVectors(worldUp, normal);

  if (east.lengthSq() < 1e-6) {
    east.set(1, 0, 0);
  } else {
    east.normalize();
  }

  const north = new THREE.Vector3().crossVectors(normal, east).normalize();
  return { east, north };
}

export function positionOnGlobe(
  lat: number,
  lon: number,
  offsetEast = 0,
  offsetNorth = 0,
  lift = 0
): THREE.Vector3 {
  const surface = latLonToVector3(lat, lon, GLOBE_RADIUS);
  const normal = surface.clone().normalize();
  const { east, north } = tangentFrame(normal);

  const onSurface = surface
    .clone()
    .addScaledVector(east, offsetEast)
    .addScaledVector(north, offsetNorth)
    .normalize()
    .multiplyScalar(GLOBE_RADIUS);

  if (lift === 0) return onSurface;

  return onSurface.addScaledVector(onSurface.clone().normalize(), lift);
}

export function outwardOrientation(
  lat: number,
  lon: number,
  offsetEast = 0,
  offsetNorth = 0,
  lift = 0
): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
  const onSurface = positionOnGlobe(lat, lon, offsetEast, offsetNorth, 0);
  const normal = onSurface.clone().normalize();
  const position =
    lift === 0
      ? onSurface
      : onSurface.clone().addScaledVector(normal, lift);

  const { east, north } = tangentFrame(normal);
  const matrix = new THREE.Matrix4().makeBasis(east, north, normal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

  return { position, quaternion };
}
