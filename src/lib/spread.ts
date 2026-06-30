function seededRandom(seed: string, salt = 0): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

export function scatterAroundCity(
  seed: string,
  city: { lat: number; lon: number },
  radiusDeg = 1.5
): { lat: number; lon: number } {
  const angle = seededRandom(seed, 2) * Math.PI * 2;
  const dist = (0.35 + seededRandom(seed, 3) * 0.65) * radiusDeg;
  const dLat = dist * Math.cos(angle);
  const cosLat = Math.cos((city.lat * Math.PI) / 180);
  const dLon = cosLat > 0.15 ? (dist * Math.sin(angle)) / cosLat : dist * Math.sin(angle);

  return {
    lat: city.lat + dLat,
    lon: city.lon + dLon,
  };
}

export function spreadOnSurface(
  index: number,
  total: number,
  seed: string,
  cardSize: number
): { east: number; north: number } {
  const angle =
    (index / Math.max(total, 1)) * Math.PI * 2 +
    seededRandom(seed, 1) * Math.PI * 0.5;
  const ring = Math.floor(index / 8);
  const radius = cardSize * (1.4 + ring * 0.85);

  return {
    east: Math.cos(angle) * radius,
    north: Math.sin(angle) * radius,
  };
}

export function spreadLift(
  _index: number,
  _total: number,
  seed: string,
  cardSize: number
): number {
  return 0.02 + seededRandom(seed, 4) * cardSize * 0.12;
}
