import { NextResponse } from "next/server";
import type { Orientation } from "@/lib/types";
import { addImageToCatalog, isAdminAuthorized, isAdminEnabled, readSonderData } from "@/lib/admin";
import { decodePlusCode } from "@/lib/pluscode";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in .env.local" },
      { status: 503 }
    );
  }

  const password = request.headers.get("x-admin-password");
  if (!isAdminAuthorized(password)) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are supported" },
        { status: 400 }
      );
    }

    const cityId = String(formData.get("cityId") ?? "");
    const isNewCity = formData.get("isNewCity") === "true";
    const cityName = String(formData.get("cityName") ?? "").trim();
    const photographerId = String(formData.get("photographerId") ?? "") || null;
    const orientation = String(formData.get("orientation") ?? "portrait") as Orientation;
    const title = String(formData.get("title") ?? "").trim();
    const caption = String(formData.get("caption") ?? "").trim();
    const year = String(formData.get("year") ?? "").trim();
    const isNewPhotographer = formData.get("isNewPhotographer") === "true";
    const latRaw = String(formData.get("lat") ?? "").trim();
    const lonRaw = String(formData.get("lon") ?? "").trim();
    const plusCode = String(formData.get("plusCode") ?? "").trim();

    if (!isNewCity && !cityId) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    if (isNewCity && !cityName) {
      return NextResponse.json({ error: "City name is required" }, { status: 400 });
    }

    if (orientation !== "portrait" && orientation !== "landscape") {
      return NextResponse.json({ error: "Invalid orientation" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let lat = latRaw ? Number(latRaw) : undefined;
    let lon = lonRaw ? Number(lonRaw) : undefined;

    if (latRaw && Number.isNaN(lat)) {
      return NextResponse.json({ error: "Invalid latitude" }, { status: 400 });
    }
    if (lonRaw && Number.isNaN(lon)) {
      return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
    }

    if ((lat === undefined || lon === undefined) && plusCode) {
      const data = await readSonderData();
      let reference: { lat: number; lon: number } | undefined;

      if (isNewCity && lat !== undefined && lon !== undefined) {
        reference = { lat, lon };
      } else if (!isNewCity) {
        const city = data.cities.find((entry) => entry.id === cityId);
        if (!city) {
          return NextResponse.json({ error: "City not found" }, { status: 400 });
        }
        reference = { lat: city.lat, lon: city.lon };
      }

      const decoded = reference
        ? decodePlusCode(plusCode, reference)
        : decodePlusCode(plusCode);
      if (!decoded) {
        return NextResponse.json({ error: "Invalid plus code" }, { status: 400 });
      }
      lat = decoded.lat;
      lon = decoded.lon;
    }

    if (lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const result = await addImageToCatalog({
      cityId: isNewCity ? null : cityId,
      newCity: isNewCity ? { name: cityName, lat, lon } : undefined,
      photographerId: isNewPhotographer ? null : photographerId,
      newPhotographer: isNewPhotographer
        ? {
            name: String(formData.get("photographerName") ?? "").trim(),
            bio: String(formData.get("photographerBio") ?? "").trim(),
            url: String(formData.get("photographerUrl") ?? "").trim(),
            instagram: String(formData.get("photographerInstagram") ?? "").trim() || undefined,
          }
        : undefined,
      file: buffer,
      mimeType: file.type,
      title: title || undefined,
      caption: caption || undefined,
      year: year || undefined,
      orientation,
      lat,
      lon,
      plusCode: plusCode || undefined,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      archiveUrl: `/gallery/${result.cityId}/${result.imageId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
