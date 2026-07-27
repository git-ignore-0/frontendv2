import { NextResponse } from "next/server";

import { currentPublicSession } from "@/lib/auth/oauth";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { data: { user: null } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const current = await currentPublicSession(session);
    await writeSession(current);
    return NextResponse.json(
      { data: { user: current.user } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    await clearSession();
    return NextResponse.json({ error: "session_expired" }, { status: 401 });
  }
}
