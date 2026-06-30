import { NextResponse } from "next/server";
import { isAdminAuthorized, isAdminEnabled } from "@/lib/admin";
import { scanGalleryUrl } from "@/lib/import";

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
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await scanGalleryUrl(url);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import scan failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
