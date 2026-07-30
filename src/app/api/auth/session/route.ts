import { NextResponse } from "next/server";

import {
  AuthServiceUnavailableError,
  currentPublicSession,
  sessionTokensChanged,
} from "@/lib/auth/oauth";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

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
    if (sessionTokensChanged(session, current)) await writeSession(current);
    return NextResponse.json(
      { data: { user: current.user } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) {
      return jsonError("upstream_unavailable", 502);
    }
    await clearSession();
    return jsonError("session_expired", 401);
  }
}
