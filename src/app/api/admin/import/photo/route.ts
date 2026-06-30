import { NextResponse } from "next/server";
import { isAdminAuthorized, isAdminEnabled } from "@/lib/admin";
import { importPhotoFromUrl } from "@/lib/import";

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
    const body = (await request.json()) as {
      imageUrl?: string;
      title?: string;
      yearRaw?: string;
      sourceUrl?: string;
      suggestedCaption?: string;
      photographer?: {
        name: string;
        url: string;
        instagram?: string;
      };
      suggestedCity?: string;
    };

    const imageUrl = body.imageUrl?.trim();
    const title = body.title?.trim();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await importPhotoFromUrl({
      imageUrl,
      title,
      yearRaw: body.yearRaw,
      sourceUrl: body.sourceUrl,
      suggestedCaption: body.suggestedCaption,
      photographer: body.photographer,
      suggestedCity: body.suggestedCity,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
