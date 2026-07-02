import { NextResponse } from "next/server";
import { getAllArchiveImages } from "@/lib/data";
import { isAdminAuthorized, isAdminEnabled, readSonderData } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ enabled: false, cities: [] });
  }

  const password = request.headers.get("x-admin-password");
  if (!isAdminAuthorized(password)) return unauthorized();

  const data = await readSonderData();
  const cities = data.cities.map((city) => ({
    id: city.id,
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    photographers: city.photographers.map((photographer) => ({
      id: photographer.id,
      name: photographer.name,
      imageCount: photographer.images.length,
    })),
  }));

  const images = getAllArchiveImages(data).map((image) => ({
    id: image.id,
    cityId: image.cityId,
    cityName: image.cityName,
    photographerId: image.photographerId,
    photographerName: image.photographerName,
    title: image.title,
    year: image.year,
    thumbnailUrl: image.thumbnailUrl,
    archiveUrl: `/gallery/${image.cityId}/${image.id}`,
  }));

  return NextResponse.json({ enabled: true, cities, images });
}
