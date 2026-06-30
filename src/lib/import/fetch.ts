import "server-only";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function assertSafeUrl(url: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("URL is not allowed");
  }

  if (isPrivateIpv4(hostname)) {
    throw new Error("URL is not allowed");
  }

  return parsed;
}

function isSquarespaceImageHost(hostname: string): boolean {
  return (
    hostname === "images.squarespace-cdn.com" ||
    hostname === "static1.squarespace.com" ||
    hostname.endsWith(".squarespace-cdn.com")
  );
}

export function assertGalleryUrl(url: string): URL {
  return assertSafeUrl(url);
}

export function assertImageUrl(url: string): URL {
  const parsed = assertSafeUrl(url);
  if (!isSquarespaceImageHost(parsed.hostname)) {
    throw new Error("Image URL is not from a supported host");
  }
  return parsed;
}

async function readResponseWithLimit(
  response: Response,
  maxBytes: number
): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Could not read response");
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error("Response is too large");
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function fetchHtml(url: string): Promise<string> {
  assertGalleryUrl(url);

  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "PhotoAtlasAdminImport/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch page (${response.status})`);
  }

  const buffer = await readResponseWithLimit(response, MAX_HTML_BYTES);
  return buffer.toString("utf8");
}

export async function fetchImage(url: string): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  assertImageUrl(url);

  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "PhotoAtlasAdminImport/1.0",
      Accept: "image/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch image (${response.status})`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (
    mimeType !== "image/jpeg" &&
    mimeType !== "image/png" &&
    mimeType !== "image/webp"
  ) {
    throw new Error("Only JPG, PNG, and WebP images are supported");
  }

  const buffer = await readResponseWithLimit(response, MAX_IMAGE_BYTES);
  return { buffer, mimeType };
}
