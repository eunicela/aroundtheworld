import { NextResponse } from "next/server";
import {
  deleteImageFromCatalog,
  isAdminAuthorized,
  isAdminEnabled,
} from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in .env.local" },
      { status: 503 }
    );
  }

  const password = request.headers.get("x-admin-password");
  if (!isAdminAuthorized(password)) return unauthorized();

  try {
    const body = await request.json();
    const cityId = String(body.cityId ?? "").trim();
    const imageId = String(body.imageId ?? "").trim();

    if (!cityId || !imageId) {
      return NextResponse.json(
        { error: "cityId and imageId are required" },
        { status: 400 }
      );
    }

    await deleteImageFromCatalog(cityId, imageId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
