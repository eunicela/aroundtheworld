import "server-only";

import fs from "fs/promises";
import path from "path";
import { readSonderData } from "./admin";
import { getArchiveImage } from "./data";
import { getDescribeImageUrl } from "./images";

const CACHE_PATH = path.join(process.cwd(), "src/data/describe-cache.json");
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;

type CacheEntry = { text: string; cachedAt: number };
type DescribeCache = Record<string, CacheEntry>;

const memoryCache = new Map<string, CacheEntry>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function isDescribeEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function cacheKey(cityId: string, imageId: string): string {
  return `${cityId}/${imageId}`;
}

async function readDiskCache(): Promise<DescribeCache> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw) as DescribeCache;
  } catch {
    return {};
  }
}

async function writeDiskCache(cache: DescribeCache): Promise<void> {
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

async function getCachedDescription(key: string): Promise<string | null> {
  const fromMemory = memoryCache.get(key);
  if (fromMemory && Date.now() - fromMemory.cachedAt < CACHE_TTL_MS) {
    return fromMemory.text;
  }

  const disk = await readDiskCache();
  const entry = disk[key];
  if (!entry || Date.now() - entry.cachedAt >= CACHE_TTL_MS) {
    return null;
  }

  memoryCache.set(key, entry);
  return entry.text;
}

async function setCachedDescription(key: string, text: string): Promise<void> {
  const entry = { text, cachedAt: Date.now() };
  memoryCache.set(key, entry);

  const disk = await readDiskCache();
  disk[key] = entry;
  await writeDiskCache(disk);
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(request: Request): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

function buildPrompt(context: {
  title: string;
  photographerName: string;
  cityName: string;
  year?: string;
}): string {
  const lines = [
    'You are writing a short caption for a travel photograph in a gallery called "Photos Around the World".',
    "Write 2–3 sentences in a warm, observational tone — like a thoughtful friend describing what they see.",
    'Do not use clichés. Do not start with "This photograph", "This image", or "The photo".',
    "",
    `Title: ${context.title}`,
    `Photographer: ${context.photographerName}`,
    `Location: ${context.cityName}`,
  ];

  if (context.year) {
    lines.push(`Year: ${context.year}`);
  }

  return lines.join("\n");
}

async function generateDescription(
  imageUrl: string,
  context: {
    title: string;
    photographerName: string;
    cityName: string;
    year?: string;
  }
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: buildPrompt(context),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = payload.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Empty description from Anthropic API");
  }

  return text;
}

export async function describePhoto(
  cityId: string,
  imageId: string
): Promise<{ text: string; source: "editorial" | "cache" | "generated" }> {
  const data = await readSonderData();
  const archive = getArchiveImage(data, cityId, imageId);

  if (!archive) {
    throw new Error("Photo not found");
  }

  const rawImage = data.cities
    .find((city) => city.id === cityId)
    ?.photographers.flatMap((p) => p.images)
    .find((img) => img.id === imageId);

  if (rawImage?.caption) {
    return { text: rawImage.caption, source: "editorial" };
  }

  const key = cacheKey(cityId, imageId);
  const cached = await getCachedDescription(key);
  if (cached) {
    return { text: cached, source: "cache" };
  }

  const imageUrl = getDescribeImageUrl(archive.cloudinaryId, rawImage?.format);
  const text = await generateDescription(imageUrl, {
    title: archive.title,
    photographerName: archive.photographerName,
    cityName: archive.cityName,
    year: archive.year,
  });

  await setCachedDescription(key, text);
  return { text, source: "generated" };
}
