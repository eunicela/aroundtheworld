import { NextResponse } from "next/server";
import { isAdminAuthorized, isAdminEnabled } from "@/lib/admin";

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in .env.local" },
      { status: 503 }
    );
  }

  const { password } = (await request.json()) as { password?: string };

  if (!isAdminAuthorized(password ?? null)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
