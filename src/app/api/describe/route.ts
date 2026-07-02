import { NextResponse } from "next/server";
import { checkRateLimit, describePhoto, isDescribeEnabled } from "@/lib/describe";

export async function POST(request: Request) {
  if (!isDescribeEnabled()) {
    return NextResponse.json(
      { error: "AI descriptions are not configured. Set ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: { cityId?: string; imageId?: string };
  try {
    body = (await request.json()) as { cityId?: string; imageId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cityId, imageId } = body;
  if (!cityId || !imageId) {
    return NextResponse.json(
      { error: "cityId and imageId are required" },
      { status: 400 }
    );
  }

  try {
    const result = await describePhoto(cityId, imageId);
    return NextResponse.json({ text: result.text, source: result.source });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate description";
    const status = message === "Photo not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
