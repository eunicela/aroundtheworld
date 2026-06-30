import { NextResponse } from "next/server";
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

  return NextResponse.json({ enabled: true, cities });
}
