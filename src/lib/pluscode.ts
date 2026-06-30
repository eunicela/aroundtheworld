import { OpenLocationCode } from "open-location-code";

const olc = new OpenLocationCode();

const PLUS_CODE_PATTERN =
  /[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,7}/i;

export function extractPlusCode(input: string): string | null {
  const match = input.trim().match(PLUS_CODE_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

export function decodePlusCode(
  input: string,
  reference?: { lat: number; lon: number }
): { lat: number; lon: number } | null {
  const code = extractPlusCode(input);
  if (!code) return null;

  try {
    let fullCode = code;

    if (olc.isShort(code)) {
      if (!reference) return null;
      fullCode = olc.recoverNearest(code, reference.lat, reference.lon);
    } else if (!olc.isFull(code)) {
      return null;
    }

    const area = olc.decode(fullCode);
    return {
      lat: area.latitudeCenter,
      lon: area.longitudeCenter,
    };
  } catch {
    return null;
  }
}

export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
